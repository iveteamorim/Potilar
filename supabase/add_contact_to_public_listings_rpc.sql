-- Restaura Chat/WhatsApp nas tarjetas de anuncios para visitantes sem login.
-- Execute no Supabase SQL Editor (projeto Potilar).

drop function if exists public.get_public_listing_contacts(uuid[]);

create or replace function public.get_public_listing_contacts(listing_ids uuid[])
returns table (
  id uuid,
  owner_id uuid,
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  contact_methods text[]
)
language sql
security definer
set search_path = public
as $$
  select
    listings.id,
    listings.owner_id,
    listings.contact_name,
    listings.contact_phone,
    listings.contact_whatsapp,
    listings.contact_email,
    listings.contact_methods
  from public.listings
  where listings.status = 'approved'
    and listings.id = any(listing_ids);
$$;

grant execute on function public.get_public_listing_contacts(uuid[]) to anon, authenticated;

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
    and (
      listings.listing_expires_at is null
      or listings.listing_expires_at > now()
    )
  order by listings.created_at desc;
$$;

grant execute on function public.get_public_approved_listings() to anon, authenticated;
