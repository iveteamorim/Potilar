-- Corrige anuncios invisiveis para visitantes sem login.
-- Execute no Supabase SQL Editor (projeto Potilar).

alter table public.listings add column if not exists area_sqm numeric;
alter table public.listings add column if not exists condo_fee numeric;
alter table public.listings add column if not exists is_pet_friendly boolean default false;
alter table public.listings add column if not exists is_furnished boolean default false;
alter table public.listings add column if not exists listing_expires_at timestamptz;
alter table public.listings add column if not exists featured_starts_at timestamptz;
alter table public.listings add column if not exists featured_expires_at timestamptz;

grant usage on schema public to anon, authenticated;
grant select on public.listings to anon, authenticated;

alter table public.listings enable row level security;

drop policy if exists "Approved listings are public" on public.listings;
drop policy if exists "Owners can view own listings" on public.listings;

create policy "Approved listings are public"
  on public.listings
  for select
  using (status = 'approved');

create policy "Owners can view own listings"
  on public.listings
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- RPC publico (ignora RLS) — fallback usado pela app se a policy falhar
drop function if exists public.get_public_approved_listings();

create or replace function public.get_public_approved_listings()
returns table (
  id uuid,
  slug text,
  title text,
  property_type text,
  transaction text,
  price integer,
  price_period text,
  bedrooms integer,
  bathrooms integer,
  parking integer,
  area_sqm numeric,
  condo_fee numeric,
  is_pet_friendly boolean,
  is_furnished boolean,
  location text,
  neighborhood text,
  community text,
  address_extra text,
  lat double precision,
  lng double precision,
  images text[],
  featured_plan text,
  featured_payment_status text,
  featured_starts_at timestamptz,
  featured_expires_at timestamptz,
  description text,
  features text[],
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    listings.id,
    listings.slug,
    listings.title,
    listings.property_type,
    listings.transaction,
    listings.price,
    listings.price_period,
    listings.bedrooms,
    listings.bathrooms,
    listings.parking,
    listings.area_sqm,
    listings.condo_fee,
    listings.is_pet_friendly,
    listings.is_furnished,
    listings.location,
    listings.neighborhood,
    listings.community,
    listings.address_extra,
    listings.lat,
    listings.lng,
    listings.images,
    listings.featured_plan,
    listings.featured_payment_status,
    listings.featured_starts_at,
    listings.featured_expires_at,
    listings.description,
    listings.features,
    listings.created_at,
    listings.updated_at
  from public.listings
  where listings.status = 'approved'
    and (
      listings.listing_expires_at is null
      or listings.listing_expires_at > now()
    )
  order by listings.created_at desc;
$$;

grant execute on function public.get_public_approved_listings() to anon, authenticated;

drop function if exists public.get_public_approved_listing_by_slug(text);

create or replace function public.get_public_approved_listing_by_slug(listing_slug text)
returns table (
  owner_id uuid,
  id uuid,
  slug text,
  title text,
  property_type text,
  transaction text,
  price integer,
  price_period text,
  bedrooms integer,
  bathrooms integer,
  parking integer,
  area_sqm numeric,
  condo_fee numeric,
  is_pet_friendly boolean,
  is_furnished boolean,
  location text,
  neighborhood text,
  community text,
  address_extra text,
  lat double precision,
  lng double precision,
  images text[],
  featured_plan text,
  featured_payment_status text,
  featured_starts_at timestamptz,
  featured_expires_at timestamptz,
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  contact_methods text[],
  description text,
  features text[],
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    listings.owner_id,
    listings.id,
    listings.slug,
    listings.title,
    listings.property_type,
    listings.transaction,
    listings.price,
    listings.price_period,
    listings.bedrooms,
    listings.bathrooms,
    listings.parking,
    listings.area_sqm,
    listings.condo_fee,
    listings.is_pet_friendly,
    listings.is_furnished,
    listings.location,
    listings.neighborhood,
    listings.community,
    listings.address_extra,
    listings.lat,
    listings.lng,
    listings.images,
    listings.featured_plan,
    listings.featured_payment_status,
    listings.featured_starts_at,
    listings.featured_expires_at,
    listings.contact_name,
    listings.contact_phone,
    listings.contact_whatsapp,
    listings.contact_email,
    listings.contact_methods,
    listings.description,
    listings.features,
    listings.created_at,
    listings.updated_at
  from public.listings
  where listings.status = 'approved'
    and lower(listings.slug) = lower(listing_slug)
    and (
      listings.listing_expires_at is null
      or listings.listing_expires_at > now()
    )
  limit 1;
$$;

grant execute on function public.get_public_approved_listing_by_slug(text) to anon, authenticated;

drop function if exists public.get_public_approved_listing_by_id(uuid);

create or replace function public.get_public_approved_listing_by_id(listing_id uuid)
returns table (
  owner_id uuid,
  id uuid,
  slug text,
  title text,
  property_type text,
  transaction text,
  price integer,
  price_period text,
  bedrooms integer,
  bathrooms integer,
  parking integer,
  area_sqm numeric,
  condo_fee numeric,
  is_pet_friendly boolean,
  is_furnished boolean,
  location text,
  neighborhood text,
  community text,
  address_extra text,
  lat double precision,
  lng double precision,
  images text[],
  featured_plan text,
  featured_payment_status text,
  featured_starts_at timestamptz,
  featured_expires_at timestamptz,
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  contact_methods text[],
  description text,
  features text[],
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    listings.owner_id,
    listings.id,
    listings.slug,
    listings.title,
    listings.property_type,
    listings.transaction,
    listings.price,
    listings.price_period,
    listings.bedrooms,
    listings.bathrooms,
    listings.parking,
    listings.area_sqm,
    listings.condo_fee,
    listings.is_pet_friendly,
    listings.is_furnished,
    listings.location,
    listings.neighborhood,
    listings.community,
    listings.address_extra,
    listings.lat,
    listings.lng,
    listings.images,
    listings.featured_plan,
    listings.featured_payment_status,
    listings.featured_starts_at,
    listings.featured_expires_at,
    listings.contact_name,
    listings.contact_phone,
    listings.contact_whatsapp,
    listings.contact_email,
    listings.contact_methods,
    listings.description,
    listings.features,
    listings.created_at,
    listings.updated_at
  from public.listings
  where listings.id = listing_id
    and listings.status = 'approved'
    and (
      listings.listing_expires_at is null
      or listings.listing_expires_at > now()
    )
  limit 1;
$$;

grant execute on function public.get_public_approved_listing_by_id(uuid) to anon, authenticated;
