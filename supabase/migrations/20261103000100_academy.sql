begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '' check (length(display_name) <= 100),
  created_at timestamptz not null default now()
);
create table private.admins (
  user_id uuid primary key references auth.users on delete cascade
);
create table public.memberships (
  user_id uuid primary key references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','grace','suspended')),
  paid_until timestamptz,
  grace_until timestamptz,
  cancel_at_period_end boolean not null default false,
  check (status <> 'active' or paid_until is not null),
  check (status <> 'grace' or (paid_until is not null and grace_until is not null and grace_until <= paid_until + interval '3 days'))
);
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admins where user_id = (select auth.uid()));
$$;
create function private.has_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists(
    select 1 from public.memberships where user_id = (select auth.uid()) and
    ((status = 'active' and paid_until > now()) or (status = 'grace' and grace_until > now()))
  );
$$;
revoke all on function private.is_admin(), private.has_access() from public;
grant execute on function private.is_admin(), private.has_access() to anon, authenticated, service_role;

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 1 and 160),
  description text not null default '' check (length(description) <= 5000),
  status text not null default 'draft' check (status in ('draft','coming','published')),
  position integer not null default 0
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses on delete restrict,
  title text not null check (length(title) between 1 and 160),
  body text not null default '' check (length(body) <= 100000),
  published boolean not null default false,
  position integer not null default 0,
  unique(course_id, position)
);
create index lessons_course on public.lessons(course_id);
create function private.can_read_lesson(lesson uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or (private.has_access() and exists(
    select 1 from public.lessons l join public.courses c on c.id = l.course_id
    where l.id = lesson and l.published and c.status = 'published'
  ));
$$;
revoke all on function private.can_read_lesson(uuid) from public;
grant execute on function private.can_read_lesson(uuid) to authenticated, service_role;

create table public.progress (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lesson_id uuid not null references public.lessons on delete cascade,
  completed boolean not null default false,
  primary key(user_id, lesson_id)
);
create table public.notes (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lesson_id uuid not null references public.lessons on delete cascade,
  body text not null default '' check (length(body) <= 10000),
  primary key(user_id, lesson_id)
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete restrict,
  lesson_id uuid not null references public.lessons on delete restrict,
  body text not null check (length(trim(body)) between 1 and 2000),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index questions_lesson on public.questions(lesson_id);
create index questions_author on public.questions(user_id);
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete restrict,
  question_id uuid not null references public.questions on delete restrict,
  body text not null check (length(trim(body)) between 1 and 2000),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index replies_question on public.replies(question_id);
create index replies_author on public.replies(user_id);
create function private.can_read_question(question uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists(
    select 1 from public.questions q where q.id = question and q.visible and private.can_read_lesson(q.lesson_id)
  );
$$;
revoke all on function private.can_read_question(uuid) from public;
grant execute on function private.can_read_question(uuid) to authenticated, service_role;

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses on delete restrict,
  title text not null check (length(title) between 1 and 160),
  starts_at timestamptz not null,
  meet_url text check (meet_url ~ '^https://meet[.]google[.]com/[a-z0-9-]+$'),
  published boolean not null default false
);
create index encounters_course on public.encounters(course_id);
create table public.academy_settings (
  id boolean primary key default true check (id),
  monthly_price_cents integer not null default 2000 check (monthly_price_cents > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  countries text[] not null default array['PE'] check (cardinality(countries) between 1 and 250)
);
insert into public.academy_settings(id) values (true);

create function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
    values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 100));
  insert into public.memberships(user_id) values (new.id);
  return new;
end;
$$;
revoke all on function private.create_profile() from public;
create trigger create_academy_profile after insert on auth.users
  for each row execute function private.create_profile();

-- No role, paid access, or moderation decision can be assigned by a browser.
alter table private.admins enable row level security;
revoke all on private.admins from public, anon, authenticated;
grant all on private.admins to service_role;
do $$ declare t text; begin
  foreach t in array array['profiles','memberships','courses','lessons','progress','notes','questions','replies','encounters','academy_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy admin_all on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
  end loop;
end $$;

grant select on public.profiles, public.memberships to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select on public.courses, public.academy_settings to anon, authenticated;
grant select on public.lessons, public.progress, public.notes, public.questions, public.replies, public.encounters to authenticated;
grant insert, update, delete on public.courses, public.lessons, public.encounters to authenticated;
grant update on public.memberships, public.academy_settings to authenticated;
grant insert, update on public.progress, public.notes to authenticated;
grant insert(lesson_id, body) on public.questions to authenticated;
grant insert(question_id, body) on public.replies to authenticated;
grant update(body, visible), delete on public.questions, public.replies to authenticated;

create policy own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy edit_profile on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_membership on public.memberships for select to authenticated using (user_id = (select auth.uid()));
create policy catalog on public.courses for select to anon, authenticated using (status in ('published','coming'));
create policy pricing on public.academy_settings for select to anon, authenticated using (true);
create policy lesson_access on public.lessons for select to authenticated using (private.can_read_lesson(id));
create policy encounter_access on public.encounters for select to authenticated using (
  published and (select private.has_access()) and exists(select 1 from public.courses c where c.id = course_id and c.status = 'published')
);
create policy own_progress_read on public.progress for select to authenticated using (user_id = (select auth.uid()));
create policy own_progress_insert on public.progress for insert to authenticated with check (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id));
create policy own_progress_update on public.progress for update to authenticated using (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id)) with check (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id));
create policy own_notes_read on public.notes for select to authenticated using (user_id = (select auth.uid()));
create policy own_notes_insert on public.notes for insert to authenticated with check (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id));
create policy own_notes_update on public.notes for update to authenticated using (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id)) with check (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id));
create policy visible_questions on public.questions for select to authenticated using (visible and private.can_read_lesson(lesson_id));
create policy ask_question on public.questions for insert to authenticated with check (user_id = (select auth.uid()) and visible and private.can_read_lesson(lesson_id));
create policy edit_question on public.questions for update to authenticated using (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id)) with check (user_id = (select auth.uid()) and private.can_read_lesson(lesson_id) and visible);
create policy visible_replies on public.replies for select to authenticated using (visible and private.can_read_question(question_id));
create policy answer_question on public.replies for insert to authenticated with check (user_id = (select auth.uid()) and visible and private.can_read_question(question_id));
create policy edit_reply on public.replies for update to authenticated using (user_id = (select auth.uid()) and private.can_read_question(question_id)) with check (user_id = (select auth.uid()) and private.can_read_question(question_id) and visible);

-- Separate moderation writes from learner edits, even on their own rows.
create function private.guard_moderation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.visible is distinct from old.visible and not private.is_admin() then
    raise exception 'Only an administrator may change moderation status' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_moderation() from public;
create trigger guard_question_moderation before update on public.questions for each row execute function private.guard_moderation();
create trigger guard_reply_moderation before update on public.replies for each row execute function private.guard_moderation();

create function public.my_access() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('is_admin', private.is_admin(), 'has_access', private.has_access());
$$;
revoke all on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

commit;
