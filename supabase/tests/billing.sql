begin;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000010'),('00000000-0000-0000-0000-000000000011'),
 ('00000000-0000-0000-0000-000000000012'),('00000000-0000-0000-0000-000000000013');
create function pg_temp.reject(statement text) returns void language plpgsql as $$
begin
  begin execute statement; exception when insufficient_privilege then return; end;
  raise exception 'Expected permission denied: %',statement;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000010',true);
select pg_temp.reject($q$select public.billing_reserve(auth.uid(),'live')$q$);
select pg_temp.reject($q$select public.billing_summary(auth.uid(),'live')$q$);
select pg_temp.reject($q$select * from private.billing_subscriptions$q$);
select pg_temp.reject($q$select * from private.billing_invoices$q$);
select pg_temp.reject($q$select * from private.billing_events$q$);
select pg_temp.reject($q$select * from private.billing_consents$q$);
select pg_temp.reject($q$select public.billing_accept_terms(auth.uid(),'2026-11-03-preventa')$q$);
set local role postgres;

do $$ declare s uuid; again uuid; test_s uuid; initial_end timestamptz; wrong_amount boolean=false;
begin
  perform public.billing_accept_terms('00000000-0000-0000-0000-000000000010','2026-11-03-preventa');
  perform public.billing_accept_terms('00000000-0000-0000-0000-000000000010','2026-11-03-preventa');
  assert (select count(*) from private.billing_consents where user_id='00000000-0000-0000-0000-000000000010')=1,'consent not idempotent';
  s=(public.billing_reserve('00000000-0000-0000-0000-000000000010','live')->'subscription'->>'id')::uuid;
  again=(public.billing_reserve('00000000-0000-0000-0000-000000000010','live')->'subscription'->>'id')::uuid;
  assert s=again,'duplicate subscription attempt';
  perform public.billing_save_subscription(s,jsonb_build_object('provider_id','mp-live','state','authorized','provider_updated_at',now()));
  assert (select status from public.memberships where user_id='00000000-0000-0000-0000-000000000010')='pending','mandate alone granted access';
  perform public.billing_record_invoice(s,jsonb_build_object('invoice_id','inv-1','payment_id','pay-1','amount_cents',5000,'currency','PEN','period_start',now(),'status','approved','provider_updated_at',now()));
  select paid_until into initial_end from public.memberships where user_id='00000000-0000-0000-0000-000000000010';
  assert initial_end>now(),'approved payment did not activate';
  perform public.billing_record_invoice(s,jsonb_build_object('invoice_id','inv-1','payment_id','pay-1','amount_cents',5000,'currency','PEN','period_start',now(),'status','approved','provider_updated_at',now()));
  assert (select paid_until from public.memberships where user_id='00000000-0000-0000-0000-000000000010')=initial_end,'duplicate extended access';
  perform public.billing_record_invoice(s,jsonb_build_object('invoice_id','inv-1','payment_id','pay-1','amount_cents',5000,'currency','PEN','period_start',now(),'status','rejected','provider_updated_at',now()-interval '1 day'));
  assert (select paid_until from public.memberships where user_id='00000000-0000-0000-0000-000000000010')=initial_end,'old event revoked access';
  begin
    perform public.billing_record_invoice(s,jsonb_build_object('invoice_id','inv-wrong','amount_cents',100,'currency','PEN','period_start',now(),'status','approved','provider_updated_at',now()));
  exception when raise_exception then wrong_amount=true; end;
  assert wrong_amount,'wrong amount accepted';
  perform public.billing_request_cancel('00000000-0000-0000-0000-000000000010',s);
  perform public.billing_save_subscription(s,jsonb_build_object('provider_id','mp-live','state','cancelled','provider_updated_at',now()+interval '1 second'));
  assert (select paid_until from public.memberships where user_id='00000000-0000-0000-0000-000000000010')=initial_end,'cancellation lost paid access';
  assert (select cancel_at_period_end from public.memberships where user_id='00000000-0000-0000-0000-000000000010'),'cancellation not recorded';
  perform public.billing_save_subscription(s,jsonb_build_object('provider_id','mp-live','state','authorized','provider_updated_at',now()+interval '2 seconds'));
  assert (select state from private.billing_subscriptions where id=s)='cancelled','cancelled mandate reopened';
  perform public.billing_record_invoice(s,jsonb_build_object('invoice_id','inv-1','payment_id','pay-1','amount_cents',5000,'currency','PEN','period_start',now(),'status','refunded','provider_updated_at',now()));
  assert (select paid_until from public.memberships where user_id='00000000-0000-0000-0000-000000000010') is null,'refund kept access';

  test_s=(public.billing_reserve('00000000-0000-0000-0000-000000000011','test')->'subscription'->>'id')::uuid;
  perform public.billing_save_subscription(test_s,jsonb_build_object('provider_id','mp-test','state','authorized','provider_updated_at',now()));
  perform public.billing_record_invoice(test_s,jsonb_build_object('invoice_id','test-invoice','payment_id','test-pay','amount_cents',5000,'currency','PEN','period_start',now(),'status','approved','provider_updated_at',now()));
  assert (select paid_until from public.memberships where user_id='00000000-0000-0000-0000-000000000011') is null,'test payment granted production access';
end $$;
do $$ declare s uuid; expired timestamptz; other_s uuid;
begin
  s=(public.billing_reserve('00000000-0000-0000-0000-000000000012','live')->'subscription'->>'id')::uuid;
  perform public.billing_save_subscription(s,jsonb_build_object('provider_id','mp-renewal','state','authorized','provider_updated_at',now()));
  perform public.billing_record_invoice(s,jsonb_build_object('invoice_id','prior-month','payment_id','prior-pay','amount_cents',5000,'currency','PEN','period_start',now()-interval '1 month'-interval '1 day','status','approved','provider_updated_at',now()));
  select paid_until into expired from public.memberships where user_id='00000000-0000-0000-0000-000000000012';
  perform public.billing_record_invoice(s,jsonb_build_object('invoice_id','failed-renewal','payment_id','failed-pay','amount_cents',5000,'currency','PEN','period_start',expired,'status','rejected','provider_updated_at',now()));
  assert (select status from public.memberships where user_id='00000000-0000-0000-0000-000000000012')='grace','failed renewal did not grant paid-member grace';
  assert (select grace_until from public.memberships where user_id='00000000-0000-0000-0000-000000000012')=expired+interval '3 days','grace extended beyond three days';
  perform public.billing_request_cancel('00000000-0000-0000-0000-000000000012',s);
  perform public.billing_summary('00000000-0000-0000-0000-000000000012','live');
  assert (select grace_until from public.memberships where user_id='00000000-0000-0000-0000-000000000012') is null,'cancelled renewal retained grace';
  other_s=(public.billing_reserve('00000000-0000-0000-0000-000000000013','live')->'subscription'->>'id')::uuid;
  perform public.billing_save_subscription(other_s,jsonb_build_object('provider_id','mp-first-failure','state','authorized','provider_updated_at',now()));
  perform public.billing_record_invoice(other_s,jsonb_build_object('invoice_id','first-rejected','payment_id','first-failed-pay','amount_cents',5000,'currency','PEN','period_start',now(),'status','rejected','provider_updated_at',now()));
  assert (select status from public.memberships where user_id='00000000-0000-0000-0000-000000000013')='pending','first failed payment granted access';
end $$;
rollback;
