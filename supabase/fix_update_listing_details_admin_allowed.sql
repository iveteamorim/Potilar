-- Allow owner or admin to edit listing details without "Not allowed"
-- / "permission denied for table listings".
-- Does not change listing status (approved stays approved).
-- Run in Supabase SQL Editor.

create or replace function public.update_listing_details(
  listing_id uuid,
  new_title text,
  new_property_type text,
  new_transaction text,
  new_price integer,
  new_price_period text,
  new_bedrooms integer,
  new_bathrooms integer,
  new_parking integer,
  new_location text,
  new_neighborhood text,
  new_community text,
  new_address_extra text,
  new_lat double precision,
  new_lng double precision,
  new_description text,
  new_features text[],
  new_images text[],
  new_contact_name text default null,
  new_contact_phone text default null,
  new_contact_whatsapp text default null,
  new_contact_email text default null,
  new_contact_methods text[] default array['whatsapp']
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_owner uuid;
  current_role text;
begin
  select owner_id into listing_owner
  from public.listings
  where id = listing_id;

  if listing_owner is null then
    raise exception 'Listing not found';
  end if;

  select role into current_role
  from public.profiles
  where id = auth.uid();

  if auth.uid() is distinct from listing_owner and coalesce(current_role, '') is distinct from 'admin' then
    raise exception 'Not allowed';
  end if;

  if new_property_type not in ('Casa', 'Terreno', 'Apartamento', 'Kitnet/Conjugado', 'Ponto comercial') then
    raise exception 'Invalid property type';
  end if;

  if new_transaction not in ('Compra', 'Aluguel', 'Temporada') then
    raise exception 'Invalid transaction';
  end if;

  if new_price_period is not null and new_price_period not in ('dia', 'semana', 'mes') then
    raise exception 'Invalid price period';
  end if;

  update public.listings
  set
    title = new_title,
    property_type = new_property_type,
    transaction = new_transaction,
    price = new_price,
    price_period = case when new_transaction = 'Temporada' then new_price_period else null end,
    bedrooms = new_bedrooms,
    bathrooms = new_bathrooms,
    parking = new_parking,
    location = new_location,
    neighborhood = new_neighborhood,
    community = new_community,
    address_extra = new_address_extra,
    lat = new_lat,
    lng = new_lng,
    description = new_description,
    features = coalesce(new_features, '{}'),
    images = new_images,
    contact_name = new_contact_name,
    contact_phone = new_contact_phone,
    contact_whatsapp = new_contact_whatsapp,
    contact_email = new_contact_email,
    contact_methods = coalesce(new_contact_methods, '{}'),
    updated_at = now()
  where id = listing_id;
end;
$$;

alter function public.update_listing_details(
  uuid, text, text, text, integer, text, integer, integer, integer, text, text, text, text,
  double precision, double precision, text, text[], text[], text, text, text, text, text[]
) owner to postgres;

grant execute on function public.update_listing_details(
  uuid, text, text, text, integer, text, integer, integer, integer, text, text, text, text,
  double precision, double precision, text, text[], text[], text, text, text, text, text[]
) to authenticated;
