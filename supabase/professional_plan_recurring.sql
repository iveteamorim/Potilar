alter table public.professional_plan_subscriptions
add column if not exists provider_subscription_id text,
add column if not exists cancelled_at timestamptz;

alter table public.professional_plan_subscriptions
drop constraint if exists professional_plan_subscriptions_status_check;

alter table public.professional_plan_subscriptions
add constraint professional_plan_subscriptions_status_check
check (status in ('pending', 'active', 'past_due', 'cancelled'));

create unique index if not exists professional_plan_subscriptions_subscription_unique_idx
on public.professional_plan_subscriptions (provider, provider_subscription_id)
where provider is not null and provider_subscription_id is not null;

notify pgrst, 'reload schema';
