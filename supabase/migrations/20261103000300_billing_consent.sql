begin;
create table private.billing_consents (
  user_id uuid not null references auth.users on delete restrict,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  primary key(user_id,terms_version)
);
alter table private.billing_consents enable row level security;
revoke all on private.billing_consents from public,anon,authenticated;
grant all on private.billing_consents to service_role;
create function public.billing_accept_terms(p_user uuid,p_version text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_version<>'2026-11-03-preventa' then raise exception 'Invalid terms version'; end if;
  insert into private.billing_consents(user_id,terms_version) values(p_user,p_version) on conflict do nothing;
end;
$$;
revoke all on function public.billing_accept_terms(uuid,text) from public,anon,authenticated;
grant execute on function public.billing_accept_terms(uuid,text) to service_role;
commit;
