alter table public.professional_plan_subscriptions
add column if not exists billing_mode text not null default 'launch_offer',
add column if not exists activation_fee numeric(10,2),
add column if not exists monthly_price numeric(10,2),
add column if not exists subscription_status text not null default 'not_started',
add column if not exists launch_offer_started_at timestamptz,
add column if not exists launch_offer_ends_at timestamptz,
add column if not exists subscription_started_at timestamptz;

alter table public.professional_plan_subscriptions
drop constraint if exists professional_plan_subscriptions_billing_mode_check;

alter table public.professional_plan_subscriptions
add constraint professional_plan_subscriptions_billing_mode_check
check (billing_mode in ('launch_offer', 'standard_subscription'));

alter table public.professional_plan_subscriptions
drop constraint if exists professional_plan_subscriptions_subscription_status_check;

alter table public.professional_plan_subscriptions
add constraint professional_plan_subscriptions_subscription_status_check
check (subscription_status in ('not_started', 'pending', 'active', 'past_due', 'cancelled'));

notify pgrst, 'reload schema';
