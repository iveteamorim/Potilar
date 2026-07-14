alter table public.profiles
add column if not exists professional_plan text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_professional_plan_check'
  ) then
    alter table public.profiles
    add constraint profiles_professional_plan_check
    check (
      professional_plan is null
      or professional_plan in ('corretor', 'imobiliaria', 'plus')
    );
  end if;
end $$;

create table if not exists public.professional_plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('corretor', 'imobiliaria', 'plus')),
  status text not null default 'active' check (status in ('pending', 'active', 'past_due', 'cancelled')),
  provider text,
  provider_payment_id text,
  provider_subscription_id text,
  price numeric(10,2),
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists professional_plan_subscriptions_user_unique_idx
on public.professional_plan_subscriptions (user_id);

create unique index if not exists professional_plan_subscriptions_payment_unique_idx
on public.professional_plan_subscriptions (provider, provider_payment_id)
where provider is not null and provider_payment_id is not null;

create unique index if not exists professional_plan_subscriptions_subscription_unique_idx
on public.professional_plan_subscriptions (provider, provider_subscription_id)
where provider is not null and provider_subscription_id is not null;

alter table public.professional_plan_subscriptions enable row level security;

drop policy if exists "Users can read own professional plan subscription" on public.professional_plan_subscriptions;
create policy "Users can read own professional plan subscription"
on public.professional_plan_subscriptions for select
using (auth.uid() = user_id);

grant select on public.professional_plan_subscriptions to authenticated;
