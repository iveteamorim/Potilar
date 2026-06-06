-- Execute no Supabase SQL Editor para o mapa usar bairro/comunidade nos pins.
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
  location text,
  neighborhood text,
  community text,
  address_extra text,
  lat double precision,
  lng double precision,
  images text[],
  featured_plan text,
  featured_payment_status text,
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
    listings.location,
    listings.neighborhood,
    listings.community,
    listings.address_extra,
    listings.lat,
    listings.lng,
    listings.images,
    listings.featured_plan,
    listings.featured_payment_status,
    listings.description,
    listings.features,
    listings.created_at,
    listings.updated_at
  from public.listings
  where listings.status = 'approved'
  order by listings.created_at desc;
$$;

grant execute on function public.get_public_approved_listings() to anon, authenticated;
