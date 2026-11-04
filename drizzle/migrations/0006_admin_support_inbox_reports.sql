create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

create policy "Users see own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Owner email becomes administrator automatically on sign-up.
create or replace function public.grant_owner_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'charisfallas@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
revoke execute on function public.grant_owner_admin() from public, anon, authenticated;
create trigger on_auth_user_owner_admin after insert on auth.users
  for each row execute function public.grant_owner_admin();
insert into public.user_roles (user_id, role)
  select id, 'admin' from auth.users where lower(email) = 'charisfallas@gmail.com' on conflict do nothing;

-- Complimentary access granted by the administrator.
create table public.membership_grants (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  note text not null default '',
  expires_at timestamptz,
  granted_at timestamptz not null default now()
);
grant select on public.membership_grants to authenticated;
grant all on public.membership_grants to service_role;
alter table public.membership_grants enable row level security;
create policy "Own grant or admin" on public.membership_grants for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create or replace function public.has_active_subscription(user_uuid uuid, check_env text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(user_uuid, 'admin')
    or exists (select 1 from public.membership_grants g where g.user_id = user_uuid and (g.expires_at is null or g.expires_at > now()))
    or exists (
      select 1 from public.subscriptions
      where user_id = user_uuid
        and (check_env is null or environment = check_env)
        and (
          (status in ('active','trialing','past_due') and (current_period_end is null or current_period_end > now()))
          or (status = 'canceled' and current_period_end > now())
        )
    );
$$;

-- Support
create table public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  subject text not null,
  category text not null default 'question',
  status text not null default 'open',
  admin_unread boolean not null default true,
  member_unread boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  sender text not null default 'member',
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.support_threads(user_id, updated_at desc);
create index on public.support_messages(thread_id, created_at);
grant select, insert, update on public.support_threads to authenticated;
grant select, insert on public.support_messages to authenticated;
grant all on public.support_threads, public.support_messages to service_role;
alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
create policy "Own threads read" on public.support_threads for select to authenticated using (auth.uid() = user_id);
create policy "Own threads create" on public.support_threads for insert to authenticated
  with check (auth.uid() = user_id and status = 'open' and admin_unread = true and member_unread = false);
create policy "Own threads mark read" on public.support_threads for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own messages read" on public.support_messages for select to authenticated using (auth.uid() = user_id);
create policy "Own messages write" on public.support_messages for insert to authenticated
  with check (auth.uid() = user_id and sender = 'member'
    and exists (select 1 from public.support_threads t where t.id = thread_id and t.user_id = auth.uid()));
create or replace function public.support_guard_member_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    -- members may only clear their own unread flag
    new.subject := old.subject; new.category := old.category; new.status := old.status;
    new.admin_unread := old.admin_unread; new.user_id := old.user_id; new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger support_threads_guard before update on public.support_threads
  for each row execute function public.support_guard_member_update();
create or replace function public.support_on_member_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.sender = 'member' then
    update public.support_threads set admin_unread = true, status = 'open', updated_at = now() where id = new.thread_id;
  end if;
  return new;
end $$;
revoke execute on function public.support_on_member_message() from public, anon, authenticated;
create trigger support_messages_after after insert on public.support_messages
  for each row execute function public.support_on_member_message();

-- Message center (inbox)
create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'announcement',
  title text not null,
  body text not null,
  local_date date,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index inbox_daily_once on public.inbox_messages(user_id, kind, local_date) where kind = 'daily_coach';
create index on public.inbox_messages(user_id, created_at desc);
grant select, update, delete on public.inbox_messages to authenticated;
grant all on public.inbox_messages to service_role;
alter table public.inbox_messages enable row level security;
create policy "Own inbox read" on public.inbox_messages for select to authenticated using (auth.uid() = user_id);
create policy "Own inbox mark read" on public.inbox_messages for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own inbox delete" on public.inbox_messages for delete to authenticated using (auth.uid() = user_id);

alter table public.wellness_preferences add column daily_messages boolean not null default true;

-- Scheduled job history
create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  detail jsonb not null default '{}'::jsonb
);
grant all on public.job_runs to service_role;
alter table public.job_runs enable row level security;

-- Business report computed from real records (admins only)
create or replace function public.admin_report(_from date, _to date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'forbidden'; end if;
  with act as (
    select user_id, local_date d from check_ins
    union select user_id, local_date from ritual_completions
    union select user_id, local_date from mission_completions
    union select user_id, local_date from challenge_completions
    union select user_id, local_date from hydration_entries
    union select user_id, local_date from breathing_sessions
    union select user_id, (created_at at time zone 'utc')::date from coach_messages where role = 'user'
  ),
  reg as (select id, created_at::date d, onboarded_at from profiles),
  live_subs as (select * from subscriptions where environment = 'live')
  select jsonb_build_object(
    'total_users', (select count(*) from profiles),
    'new_users', (select count(*) from reg where d between _from and _to),
    'onboarded_new', (select count(*) from reg where d between _from and _to and onboarded_at is not null),
    'first_checkin_new', (select count(*) from reg where d between _from and _to and exists (select 1 from check_ins c where c.user_id = reg.id)),
    'first_ritual_new', (select count(*) from reg where d between _from and _to and exists (select 1 from ritual_completions c where c.user_id = reg.id)),
    'first_mission_new', (select count(*) from reg where d between _from and _to and exists (select 1 from mission_completions c where c.user_id = reg.id)),
    'coach_users_new', (select count(*) from reg where d between _from and _to and exists (select 1 from coach_messages c where c.user_id = reg.id and c.role='user')),
    'dau', (select count(distinct user_id) from act where d = _to),
    'wau', (select count(distinct user_id) from act where d between _to - 6 and _to),
    'mau', (select count(distinct user_id) from act where d between _to - 29 and _to),
    'active_in_range', (select count(distinct user_id) from act where d between _from and _to),
    'checkins', (select count(*) from check_ins where local_date between _from and _to),
    'rituals', (select count(*) from ritual_completions where local_date between _from and _to),
    'missions', (select count(*) from mission_completions where local_date between _from and _to),
    'challenges', (select count(*) from challenge_completions where local_date between _from and _to),
    'coach_messages', (select count(*) from coach_messages where role='user' and created_at::date between _from and _to),
    'inactive_14d', (select count(*) from profiles p where not exists (select 1 from act where act.user_id = p.id and act.d > current_date - 14)),
    'returning', (select count(*) from (select user_id from act where d between _from and _to group by user_id having count(distinct d) >= 2) x),
    'retained_week1', (select count(*) from reg where d between _from and _to and exists (select 1 from act where act.user_id = reg.id and act.d between reg.d + 7 and reg.d + 13)),
    'daily_new_users', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d) from (select d, count(*) n from reg where d between _from and _to group by d) z), '[]'::jsonb),
    'daily_active', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d) from (select d, count(distinct user_id) n from act where d between _from and _to group by d) z), '[]'::jsonb),
    'subs_live', jsonb_build_object(
      'active', (select count(*) from live_subs where status in ('active','trialing','past_due') and (current_period_end is null or current_period_end > now()) and not cancel_at_period_end),
      'cancelling', (select count(*) from live_subs where cancel_at_period_end and current_period_end > now()),
      'past_due', (select count(*) from live_subs where status = 'past_due'),
      'new', (select count(*) from live_subs where created_at::date between _from and _to),
      'cancelled', (select count(*) from live_subs where status = 'canceled' and updated_at::date between _from and _to)
    ),
    'subs_test', jsonb_build_object(
      'active', (select count(*) from subscriptions where environment='sandbox' and status in ('active','trialing','past_due')),
      'total', (select count(*) from subscriptions where environment='sandbox')
    ),
    'complimentary', (select count(*) from membership_grants where expires_at is null or expires_at > now()),
    'open_support', (select count(*) from support_threads where status = 'open')
  ) into r;
  return r;
end $$;
revoke execute on function public.admin_report(date, date) from public, anon;
grant execute on function public.admin_report(date, date) to authenticated;