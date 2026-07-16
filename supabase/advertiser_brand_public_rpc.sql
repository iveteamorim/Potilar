-- Logo do corretor nas tarjetas publicas (visitantes sem login).
-- Execute no Supabase SQL Editor (projeto Potilar).

drop function if exists public.get_public_advertiser_profiles(uuid[]);

create or replace function public.get_public_advertiser_profiles(profile_ids uuid[])
returns table (
  id uuid,
  full_name text,
  company_name text,
  account_type text,
  public_slug text,
  profile_image_url text,
  creci text,
  creci_verified boolean
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.company_name,
    profiles.account_type,
    profiles.public_slug,
    profiles.profile_image_url,
    profiles.creci,
    coalesce(profiles.creci_verified, false) as creci_verified
  from public.profiles
  where profiles.id = any(profile_ids)
    and profiles.account_type in ('corretor', 'imobiliaria');
$$;

grant execute on function public.get_public_advertiser_profiles(uuid[]) to anon, authenticated;

drop function if exists public.get_public_profile_by_slug(text);

create or replace function public.get_public_profile_by_slug(profile_slug text)
returns table (
  id uuid,
  full_name text,
  company_name text,
  bio text,
  phone text,
  account_type text,
  professional_plan text,
  public_slug text,
  creci text,
  creci_verified boolean,
  profile_image_url text,
  banner_image_url text,
  languages text[]
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.company_name,
    profiles.bio,
    profiles.phone,
    profiles.account_type,
    profiles.professional_plan,
    profiles.public_slug,
    profiles.creci,
    coalesce(profiles.creci_verified, false) as creci_verified,
    profiles.profile_image_url,
    profiles.banner_image_url,
    profiles.languages
  from public.profiles
  where profiles.account_type in ('corretor', 'imobiliaria')
    and profiles.public_slug is not null
    and length(trim(profiles.public_slug)) > 0
    and (
      lower(profiles.public_slug) = lower(profile_slug)
      or lower(profiles.public_slug) like lower(profile_slug) || '-%'
    )
  order by case when lower(profiles.public_slug) = lower(profile_slug) then 0 else 1 end
  limit 1;
$$;

grant execute on function public.get_public_profile_by_slug(text) to anon, authenticated;

drop function if exists public.get_public_listings_by_owner(uuid);

create or replace function public.get_public_listings_by_owner(p_owner_id uuid)
returns table (
  id uuid,
  owner_id uuid,
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
  video_url text,
  tour_url text,
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
  updated_at timestamptz,
  advertiser_account_type text,
  advertiser_public_slug text,
  advertiser_display_name text,
  advertiser_profile_image_url text,
  advertiser_creci_verified boolean
)
language sql
security definer
set search_path = public
as $$
  select
    listings.id,
    listings.owner_id,
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
    listings.video_url,
    listings.tour_url,
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
    listings.updated_at,
    profiles.account_type as advertiser_account_type,
    profiles.public_slug as advertiser_public_slug,
    coalesce(nullif(trim(profiles.company_name), ''), nullif(trim(profiles.full_name), '')) as advertiser_display_name,
    profiles.profile_image_url as advertiser_profile_image_url,
    coalesce(profiles.creci_verified, false) as advertiser_creci_verified
  from public.listings
  left join public.profiles
    on profiles.id = listings.owner_id
    and profiles.account_type in ('corretor', 'imobiliaria')
  where listings.status = 'approved'
    and listings.owner_id = p_owner_id
    and (
      listings.listing_expires_at is null
      or listings.listing_expires_at > now()
    )
  order by listings.created_at desc;
$$;

grant execute on function public.get_public_listings_by_owner(uuid) to anon, authenticated;

drop function if exists public.get_public_approved_listings();

create or replace function public.get_public_approved_listings()
returns table (
  id uuid,
  owner_id uuid,
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
  video_url text,
  tour_url text,
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
  updated_at timestamptz,
  advertiser_account_type text,
  advertiser_public_slug text,
  advertiser_display_name text,
  advertiser_profile_image_url text,
  advertiser_creci_verified boolean
)
language sql
security definer
set search_path = public
as $$
  select
    listings.id,
    listings.owner_id,
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
    listings.video_url,
    listings.tour_url,
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
    listings.updated_at,
    profiles.account_type as advertiser_account_type,
    profiles.public_slug as advertiser_public_slug,
    coalesce(nullif(trim(profiles.company_name), ''), nullif(trim(profiles.full_name), '')) as advertiser_display_name,
    profiles.profile_image_url as advertiser_profile_image_url,
    coalesce(profiles.creci_verified, false) as advertiser_creci_verified
  from public.listings
  left join public.profiles
    on profiles.id = listings.owner_id
    and profiles.account_type in ('corretor', 'imobiliaria')
  where listings.status = 'approved'
    and (
      listings.listing_expires_at is null
      or listings.listing_expires_at > now()
    )
  order by listings.created_at desc;
$$;

grant execute on function public.get_public_approved_listings() to anon, authenticated;
