-- Ponto comercial (lojas, salas, pontos) nos anúncios Potilar.
-- Execute no Supabase SQL Editor.

do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.listings'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%property_type%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.listings drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.listings
add constraint listings_property_type_check
check (property_type in ('Casa', 'Terreno', 'Apartamento', 'Kitnet/Conjugado', 'Ponto comercial'));

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

  if auth.uid() <> listing_owner and current_role <> 'admin' then
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
    price_period = new_price_period,
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
    features = new_features,
    images = new_images,
    contact_name = new_contact_name,
    contact_phone = new_contact_phone,
    contact_whatsapp = new_contact_whatsapp,
    contact_email = new_contact_email,
    contact_methods = new_contact_methods,
    updated_at = now()
  where id = listing_id;
end;
$$;

grant execute on function public.update_listing_details(
  uuid,
  text,
  text,
  text,
  integer,
  text,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  text[]
) to authenticated;
