-- Execute no Supabase SQL Editor (bloque verde Potilar)

-- Campos detalhados do imovel
alter table public.listings add column if not exists area_sqm integer;
alter table public.listings add column if not exists condo_fee integer;
alter table public.listings add column if not exists is_pet_friendly boolean not null default false;
alter table public.listings add column if not exists is_furnished boolean not null default false;

-- Perfil publico de corretor / imobiliaria
alter table public.profiles add column if not exists public_slug text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists bio text;

create unique index if not exists profiles_public_slug_unique_idx
on public.profiles (lower(public_slug))
where public_slug is not null and length(trim(public_slug)) > 0;

drop policy if exists "Public professional profiles are visible" on public.profiles;
create policy "Public professional profiles are visible"
on public.profiles for select
using (
  account_type in ('corretor', 'imobiliaria')
  and public_slug is not null
  and length(trim(public_slug)) > 0
);

-- Alertas de busca salvos
create table if not exists public.listing_search_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  filters jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_search_alerts_user_id_idx on public.listing_search_alerts(user_id);

alter table public.listing_search_alerts enable row level security;

drop policy if exists "Users manage own search alerts" on public.listing_search_alerts;
create policy "Users manage own search alerts"
on public.listing_search_alerts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.listing_search_alerts to authenticated;

-- Estatisticas simples por anuncio
create table if not exists public.listing_stats (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  view_count bigint not null default 0,
  whatsapp_click_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.listing_stats enable row level security;

drop policy if exists "Owners can read listing stats" on public.listing_stats;
create policy "Owners can read listing stats"
on public.listing_stats for select
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_stats.listing_id
    and listings.owner_id = auth.uid()
  )
);

grant select on public.listing_stats to authenticated;

create or replace function public.track_listing_view(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_listing_id is null then
    return;
  end if;

  insert into public.listing_stats (listing_id, view_count, whatsapp_click_count, updated_at)
  values (p_listing_id, 1, 0, now())
  on conflict (listing_id)
  do update set
    view_count = public.listing_stats.view_count + 1,
    updated_at = now();
end;
$$;

create or replace function public.track_listing_whatsapp_click(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_listing_id is null then
    return;
  end if;

  insert into public.listing_stats (listing_id, view_count, whatsapp_click_count, updated_at)
  values (p_listing_id, 0, 1, now())
  on conflict (listing_id)
  do update set
    whatsapp_click_count = public.listing_stats.whatsapp_click_count + 1,
    updated_at = now();
end;
$$;

grant execute on function public.track_listing_view(uuid) to anon, authenticated;
grant execute on function public.track_listing_whatsapp_click(uuid) to anon, authenticated;
