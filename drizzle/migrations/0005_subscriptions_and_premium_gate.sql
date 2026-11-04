create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_subscriptions_user on public.subscriptions(user_id, environment, created_at desc);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "Users view own subscription" on public.subscriptions for select to authenticated using (auth.uid() = user_id);

create table public.stripe_webhook_events (
  id text primary key,
  type text not null,
  environment text not null,
  received_at timestamptz not null default now()
);
grant all on public.stripe_webhook_events to service_role;
alter table public.stripe_webhook_events enable row level security;

create or replace function public.has_active_subscription(user_uuid uuid, check_env text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and (check_env is null or environment = check_env)
      and (
        (status in ('active','trialing','past_due') and (current_period_end is null or current_period_end > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  );
$$;
grant execute on function public.has_active_subscription(uuid, text) to authenticated, service_role;

-- Backend premium gate: new activity records require an active membership.
-- Reading, editing and deleting existing records stays allowed so lapsed members keep their data.
do $$
declare t text;
begin
  foreach t in array array[
    'breathing_sessions','bucket_goals','challenge_completions','check_ins','coach_conversations','coach_messages',
    'experiment_logs','goal_actions','goal_milestones','hydration_entries','mission_completions','period_check_ins',
    'personal_achievements','personal_time_entries','protein_entries','report_exports','ritual_activity_completions',
    'ritual_completions','user_challenge_days','user_challenges','user_experiments','wellness_reviews']
  loop
    execute format('create policy "Premium required to add" on public.%I as restrictive for insert to authenticated with check (public.has_active_subscription(auth.uid()))', t);
  end loop;
end $$;