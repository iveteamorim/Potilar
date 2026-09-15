create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  payment_id text,
  amount_before numeric(10,2) not null,
  amount_after numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create unique index if not exists coupon_redemptions_coupon_listing_idx
on public.coupon_redemptions (coupon_code, listing_id);

create index if not exists coupon_redemptions_coupon_user_idx
on public.coupon_redemptions (coupon_code, user_id);

alter table public.coupon_redemptions enable row level security;

drop policy if exists "Admins can view coupon redemptions" on public.coupon_redemptions;
create policy "Admins can view coupon redemptions"
on public.coupon_redemptions
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

grant select, insert on public.coupon_redemptions to authenticated;
grant all on table public.coupon_redemptions to service_role;
