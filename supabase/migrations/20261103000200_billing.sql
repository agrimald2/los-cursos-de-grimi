begin;

update public.academy_settings set monthly_price_cents=5000,currency='PEN',countries=array['PE'] where id;

create table private.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete restrict,
  provider text not null default 'mercadopago',
  mode text not null check (mode in ('test','live')),
  amount_cents integer not null check (amount_cents>0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  provider_subscription_id text unique,
  state text not null default 'creating' check (state in ('creating','pending','authorized','paused','cancelled','failed')),
  checkout_url text,
  cancellation_requested boolean not null default false,
  provider_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_open_billing_subscription on private.billing_subscriptions(user_id,mode)
  where state not in ('cancelled','failed');
create index billing_user on private.billing_subscriptions(user_id);

create table private.billing_invoices (
  subscription_id uuid not null references private.billing_subscriptions on delete restrict,
  provider text not null,
  provider_invoice_id text not null,
  provider_payment_id text,
  amount_cents integer not null check (amount_cents>0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  period_start timestamptz not null,
  period_end timestamptz not null check (period_end>period_start),
  status text not null check (status in ('pending','approved','rejected','cancelled','refunded','charged_back','in_mediation')),
  provider_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(subscription_id,provider_invoice_id),
  unique(provider,provider_payment_id)
);
alter table private.billing_subscriptions enable row level security;
alter table private.billing_invoices enable row level security;
revoke all on private.billing_subscriptions,private.billing_invoices from public,anon,authenticated;
grant all on private.billing_subscriptions,private.billing_invoices to service_role;

create table private.billing_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references private.billing_subscriptions on delete restrict,
  event_type text not null,
  resource_id text not null,
  status text not null,
  provider_updated_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique(subscription_id,event_type,resource_id,status,provider_updated_at)
);
alter table private.billing_events enable row level security;
revoke all on private.billing_events from public,anon,authenticated;
grant all on private.billing_events to service_role;

create function private.refresh_billing_access(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare paid timestamptz; cancelled boolean; failed boolean;
begin
  perform 1 from public.memberships where user_id=p_user for update;
  if not exists(select 1 from private.billing_subscriptions where user_id=p_user and mode='live') then return; end if;
  select max(i.period_end) into paid from private.billing_invoices i
    join private.billing_subscriptions s on s.id=i.subscription_id
    where s.user_id=p_user and s.mode='live' and i.status='approved' and i.period_start<=now();
  select not exists(select 1 from private.billing_subscriptions where user_id=p_user and mode='live'
    and state='authorized' and not cancellation_requested) into cancelled;
  select exists(select 1 from private.billing_invoices i join private.billing_subscriptions s on s.id=i.subscription_id
    where s.user_id=p_user and s.mode='live' and s.state='authorized' and not s.cancellation_requested
    and i.status in ('rejected','cancelled') and i.period_start>=paid-interval '1 minute' and i.period_start<=now()) into failed;
  update public.memberships set
    paid_until=paid,
    grace_until=case when failed and not cancelled then paid+interval '3 days' else null end,
    cancel_at_period_end=cancelled,
    status=case when paid>now() then 'active'
      when paid is not null and failed and not cancelled and paid+interval '3 days'>now() then 'grace'
      when paid is not null then 'suspended' else 'pending' end
    where user_id=p_user;
end;
$$;
revoke all on function private.refresh_billing_access(uuid) from public,anon,authenticated;
grant execute on function private.refresh_billing_access(uuid) to service_role;

create function public.billing_reserve(p_user uuid,p_mode text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.billing_subscriptions; offer public.academy_settings;
begin
  if p_mode not in ('test','live') then raise exception 'Invalid billing mode'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  select * into s from private.billing_subscriptions where user_id=p_user and mode=p_mode
    and state not in ('cancelled','failed') order by created_at desc limit 1;
  if found then return jsonb_build_object('created',false,'subscription',to_jsonb(s)); end if;
  select * into strict offer from public.academy_settings where id;
  if offer.currency<>'PEN' or not ('PE'=any(offer.countries)) then raise exception 'Mercado Pago Peru requires configured PEN offer'; end if;
  insert into private.billing_subscriptions(user_id,mode,amount_cents,currency)
    values(p_user,p_mode,offer.monthly_price_cents,offer.currency) returning * into s;
  return jsonb_build_object('created',true,'subscription',to_jsonb(s));
end;
$$;

create function public.billing_save_subscription(p_id uuid,p_data jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare s private.billing_subscriptions; modified timestamptz;
begin
  select * into strict s from private.billing_subscriptions where id=p_id for update;
  modified=(p_data->>'provider_updated_at')::timestamptz;
  insert into private.billing_events(subscription_id,event_type,resource_id,status,provider_updated_at)
    values(s.id,'subscription',p_data->>'provider_id',p_data->>'state',modified) on conflict do nothing;
  if s.provider_updated_at is not null and modified<s.provider_updated_at then return; end if;
  if s.state='cancelled' and p_data->>'state'<>'cancelled' then return; end if;
  if s.provider_subscription_id is not null and s.provider_subscription_id<>p_data->>'provider_id' then raise exception 'Subscription identity changed'; end if;
  update private.billing_subscriptions set provider_subscription_id=p_data->>'provider_id',state=p_data->>'state',
    checkout_url=coalesce(p_data->>'checkout_url',checkout_url),provider_updated_at=modified,updated_at=now()
    where id=p_id;
  perform private.refresh_billing_access(s.user_id);
end;
$$;

create function public.billing_record_invoice(p_id uuid,p_data jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare s private.billing_subscriptions; modified timestamptz; starts timestamptz;
begin
  select * into strict s from private.billing_subscriptions where id=p_id for update;
  if (p_data->>'amount_cents')::integer<>s.amount_cents or p_data->>'currency'<>s.currency then raise exception 'Invoice amount mismatch'; end if;
  modified=(p_data->>'provider_updated_at')::timestamptz;
  starts=(p_data->>'period_start')::timestamptz;
  if starts>now()+interval '5 minutes' and p_data->>'status'='approved' then raise exception 'Future invoice cannot grant access'; end if;
  insert into private.billing_events(subscription_id,event_type,resource_id,status,provider_updated_at)
    values(s.id,'invoice',p_data->>'invoice_id',p_data->>'status',modified) on conflict do nothing;
  insert into private.billing_invoices(subscription_id,provider,provider_invoice_id,provider_payment_id,amount_cents,currency,period_start,period_end,status,provider_updated_at)
    values(s.id,s.provider,p_data->>'invoice_id',p_data->>'payment_id',s.amount_cents,s.currency,starts,
      ((starts at time zone 'America/Lima')+interval '1 month') at time zone 'America/Lima',p_data->>'status',modified)
    on conflict(subscription_id,provider_invoice_id) do update set
      provider_payment_id=excluded.provider_payment_id,status=excluded.status,provider_updated_at=excluded.provider_updated_at,updated_at=now(),
      period_start=case when private.billing_invoices.status in ('pending','rejected','cancelled') then excluded.period_start else private.billing_invoices.period_start end,
      period_end=case when private.billing_invoices.status in ('pending','rejected','cancelled') then excluded.period_end else private.billing_invoices.period_end end
    where excluded.provider_updated_at>private.billing_invoices.provider_updated_at or
      (excluded.provider_updated_at=private.billing_invoices.provider_updated_at and excluded.status in ('refunded','charged_back','in_mediation')
      and private.billing_invoices.status not in ('refunded','charged_back','in_mediation'));
  perform private.refresh_billing_access(s.user_id);
end;
$$;

create function public.billing_find(p_id uuid default null,p_provider_id text default null,p_payment_id text default null) returns jsonb
language sql stable security definer set search_path='' as $$
  select to_jsonb(s)||jsonb_build_object('linked_invoice_id',(select provider_invoice_id from private.billing_invoices where subscription_id=s.id and provider_payment_id=p_payment_id limit 1)) from private.billing_subscriptions s where
    (p_id is not null and s.id=p_id) or
    (p_provider_id is not null and s.provider_subscription_id=p_provider_id) or
    (p_payment_id is not null and exists(select 1 from private.billing_invoices i where i.subscription_id=s.id and i.provider_payment_id=p_payment_id))
  limit 1;
$$;

create function public.billing_fail_attempt(p_id uuid) returns void
language sql security definer set search_path='' as $$
  update private.billing_subscriptions set state='failed',updated_at=now() where id=p_id and state='creating' and provider_subscription_id is null;
$$;

create function public.billing_request_cancel(p_user uuid,p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.billing_subscriptions;
begin
  update private.billing_subscriptions set cancellation_requested=true,updated_at=now()
    where id=p_id and user_id=p_user returning * into strict s;
  return to_jsonb(s);
end;
$$;

create function public.billing_summary(p_user uuid,p_mode text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  perform private.refresh_billing_access(p_user);
  select jsonb_build_object(
    'offer',(select jsonb_build_object('amount_cents',monthly_price_cents,'currency',currency) from public.academy_settings where id),
    'membership',(select to_jsonb(m) from public.memberships m where m.user_id=p_user),
    'subscription',(select jsonb_build_object('id',s.id,'state',s.state,'mode',s.mode,'amount_cents',s.amount_cents,'currency',s.currency,
      'cancellation_requested',s.cancellation_requested,'checkout_url',s.checkout_url,
      'latest_invoice',(select jsonb_build_object('status',i.status,'period_end',i.period_end) from private.billing_invoices i where i.subscription_id=s.id order by i.period_start desc limit 1))
      from private.billing_subscriptions s where s.user_id=p_user and s.mode=p_mode order by s.created_at desc limit 1),
    'is_admin',exists(select 1 from private.admins where user_id=p_user)
  ) into result;
  return result;
end;
$$;

revoke all on function public.billing_reserve(uuid,text),public.billing_save_subscription(uuid,jsonb),public.billing_record_invoice(uuid,jsonb),
  public.billing_find(uuid,text,text),public.billing_request_cancel(uuid,uuid),public.billing_summary(uuid,text),public.billing_fail_attempt(uuid) from public,anon,authenticated;
grant execute on function public.billing_reserve(uuid,text),public.billing_save_subscription(uuid,jsonb),public.billing_record_invoice(uuid,jsonb),
  public.billing_find(uuid,text,text),public.billing_request_cancel(uuid,uuid),public.billing_summary(uuid,text),public.billing_fail_attempt(uuid) to service_role;

commit;
