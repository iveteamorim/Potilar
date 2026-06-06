create table if not exists public.geocoding_cache (
  normalized_query text primary key,
  query text not null,
  lat double precision not null,
  lng double precision not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.geocoding_cache enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'geocoding_cache'
      and policyname = 'geocoding cache readable'
  ) then
    create policy "geocoding cache readable"
    on public.geocoding_cache
    for select
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'geocoding_cache'
      and policyname = 'geocoding cache writable'
  ) then
    create policy "geocoding cache writable"
    on public.geocoding_cache
    for insert
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'geocoding_cache'
      and policyname = 'geocoding cache updatable'
  ) then
    create policy "geocoding cache updatable"
    on public.geocoding_cache
    for update
    using (true)
    with check (true);
  end if;
end $$;

create index if not exists geocoding_cache_created_at_idx
on public.geocoding_cache (created_at desc);
