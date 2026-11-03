begin;
insert into auth.users(id, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000001','{"full_name":"Admin"}'),
 ('00000000-0000-0000-0000-000000000002','{"full_name":"Alumno"}'),
 ('00000000-0000-0000-0000-000000000003','{}'),
 ('00000000-0000-0000-0000-000000000004','{}');
insert into private.admins values ('00000000-0000-0000-0000-000000000001');
update public.memberships set status='active', paid_until=now()+interval '1 day'
 where user_id='00000000-0000-0000-0000-000000000002';
update public.memberships set status='active', paid_until=now()-interval '1 day'
 where user_id='00000000-0000-0000-0000-000000000003';
insert into public.courses(id, slug, title, status) values
 ('10000000-0000-0000-0000-000000000001','publicado','Curso','published'),
 ('10000000-0000-0000-0000-000000000002','borrador','Borrador','draft');
insert into public.lessons(id,course_id,title,published,position) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Clase publicada',true,1),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Clase borrador',false,2),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Curso borrador',true,1);
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege or check_violation then return;
  end;
  raise exception 'Expected access denied: %',statement;
end;
$$;

set local role anon;
do $$ begin
  assert (select count(*) from public.courses)=1, 'anonymous catalog leaked draft';
end $$;
select pg_temp.denied('select * from public.lessons');
select pg_temp.denied('select * from public.profiles');
select pg_temp.denied('select public.my_access()');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
do $$ begin
  assert (select count(*) from public.profiles)=1, 'profile isolation';
  assert (select count(*) from public.memberships)=1, 'membership isolation';
  assert (select count(*) from public.lessons)=1, 'draft lesson leakage';
  assert public.my_access()->>'has_access'='true', 'active member access';
  assert public.my_access()->>'is_admin'='false', 'member became admin';
end $$;
select pg_temp.denied('insert into private.admins values (auth.uid())');
select pg_temp.denied('select * from private.admins');
select pg_temp.denied($q$insert into public.courses(slug,title) values ('hack','Hack')$q$);
insert into public.notes(lesson_id,body) values ('20000000-0000-0000-0000-000000000001','Nota privada');
insert into public.progress(lesson_id,completed) values ('20000000-0000-0000-0000-000000000001',true);
select pg_temp.denied($q$insert into public.notes(user_id,lesson_id) values ('00000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001')$q$);
select pg_temp.denied($q$insert into public.progress(lesson_id) values ('20000000-0000-0000-0000-000000000002')$q$);
insert into public.questions(lesson_id,body) values ('20000000-0000-0000-0000-000000000001','Consulta');
insert into public.replies(question_id,body) select id,'Respuesta' from public.questions;
select pg_temp.denied($q$update public.questions set visible=false$q$);
select pg_temp.denied($q$update public.replies set visible=false$q$);

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
update public.memberships set status='active', paid_until=now()+interval '1 year';
do $$ begin
  assert (select count(*) from public.lessons)=0, 'unpaid access';
  assert (select count(*) from public.questions)=0, 'unpaid questions access';
  assert (select count(*) from public.notes)=0, 'another user note leaked';
  assert (select count(*) from public.progress)=0, 'another user progress leaked';
  assert public.my_access()->>'has_access'='false', 'self-activated membership';
end $$;
select pg_temp.denied($q$insert into public.questions(lesson_id,body) values ('20000000-0000-0000-0000-000000000001','Unpaid')$q$);

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$ begin
  assert (select count(*) from public.lessons)=0, 'expired membership access';
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin
  assert (select count(*) from public.lessons)=3, 'admin draft access';
  assert public.my_access()->>'is_admin'='true', 'admin access';
end $$;
update public.memberships set status='grace', paid_until=now()-interval '1 day',grace_until=now()+interval '2 days'
 where user_id='00000000-0000-0000-0000-000000000003';
select set_config('test.question_id',(select id::text from public.questions limit 1),true);
update public.questions set visible=false;
update public.replies set visible=false;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
do $$ begin
  assert (select count(*) from public.lessons)=1, 'grace access';
  assert (select count(*) from public.questions)=0, 'hidden question leaked';
  assert (select count(*) from public.replies)=0, 'hidden reply leaked';
end $$;
select pg_temp.denied($q$insert into public.replies(question_id,body) values (current_setting('test.question_id')::uuid,'Hidden reply')$q$);
rollback;
