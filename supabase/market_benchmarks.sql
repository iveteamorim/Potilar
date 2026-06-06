-- Referencias FipeZAP sincronizadas pelo cron /api/cron/update-fipezap
-- Rodar no Supabase SQL Editor apos deploy.

create table if not exists public.market_city_benchmarks (
  city_key text primary key,
  city text not null,
  state text not null default 'RN',
  sale_sqm numeric not null,
  rent_sqm numeric not null,
  source text not null,
  reference_period text not null,
  reference_date date,
  synced_at timestamptz not null default now()
);

create index if not exists market_city_benchmarks_state_idx
  on public.market_city_benchmarks (state);

alter table public.market_city_benchmarks enable row level security;

drop policy if exists "Public read market city benchmarks" on public.market_city_benchmarks;
create policy "Public read market city benchmarks"
  on public.market_city_benchmarks
  for select
  using (true);
