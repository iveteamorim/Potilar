create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  account_type text not null default 'particular' check (account_type in ('particular', 'corretor', 'imobiliaria')),
  advertiser_document text,
  creci text,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null unique,
  property_type text not null check (property_type in ('Casa', 'Terreno', 'Apartamento', 'Kitnet/Conjugado', 'Ponto comercial')),
  transaction text not null check (transaction in ('Compra', 'Aluguel', 'Temporada')),
  price integer not null default 0,
  price_period text check (price_period in ('dia', 'semana', 'mes')),
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  parking integer not null default 0,
  location text not null,
  neighborhood text,
  community text,
  address_extra text,
  lat double precision not null default -5.7945,
  lng double precision not null default -35.211,
  description text not null,
  features text[] not null default '{}',
  images text[] not null default '{}',
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  contact_methods text[] not null default '{}',
  referral_code text,
  is_paid boolean not null default false,
  payment_status text not null default 'not_required' check (payment_status in ('not_required', 'pix_pending', 'confirmed')),
  payment_amount numeric(10,2),
  payment_confirmed_at timestamptz,
  listing_expires_at timestamptz,
  featured_plan text check (featured_plan in ('7_days', '15_days', '30_days', 'super_30_days')),
  featured_payment_status text not null default 'not_requested' check (featured_payment_status in ('not_requested', 'pix_pending', 'confirmed')),
  featured_payment_amount numeric(10,2),
  featured_starts_at timestamptz,
  featured_expires_at timestamptz,
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings add column if not exists is_paid boolean not null default false;
alter table public.listings add column if not exists payment_status text not null default 'not_required';
alter table public.listings add column if not exists payment_amount numeric(10,2);
alter table public.listings add column if not exists payment_confirmed_at timestamptz;
alter table public.listings add column if not exists listing_expires_at timestamptz;
alter table public.listings add column if not exists price_period text;
alter table public.listings add column if not exists contact_name text;
alter table public.listings add column if not exists neighborhood text;
alter table public.listings add column if not exists community text;
alter table public.listings add column if not exists address_extra text;
alter table public.listings add column if not exists contact_phone text;
alter table public.listings add column if not exists contact_whatsapp text;
alter table public.listings add column if not exists contact_email text;
alter table public.listings add column if not exists contact_methods text[] not null default '{}';
alter table public.listings add column if not exists referral_code text;
alter table public.listings add column if not exists featured_plan text;
alter table public.listings add column if not exists featured_payment_status text not null default 'not_requested';
alter table public.listings add column if not exists featured_payment_amount numeric(10,2);
alter table public.listings add column if not exists featured_starts_at timestamptz;
alter table public.listings add column if not exists featured_expires_at timestamptz;
alter table public.profiles add column if not exists account_type text not null default 'particular';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists advertiser_document text;
alter table public.profiles add column if not exists creci text;
alter table public.profiles add column if not exists professional_plan text;

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null and length(trim(email)) > 0;

create unique index if not exists profiles_phone_unique_idx
on public.profiles (regexp_replace(phone, '\D', '', 'g'))
where phone is not null and length(regexp_replace(phone, '\D', '', 'g')) > 0;

create unique index if not exists profiles_advertiser_document_unique_idx
on public.profiles (regexp_replace(advertiser_document, '\D', '', 'g'))
where advertiser_document is not null and length(regexp_replace(advertiser_document, '\D', '', 'g')) > 0;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'listings_transaction_check'
  ) then
    alter table public.listings drop constraint listings_transaction_check;
  end if;

  alter table public.listings
  add constraint listings_transaction_check
  check (transaction in ('Compra', 'Aluguel', 'Temporada'));
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_price_period_check'
  ) then
    alter table public.listings
    add constraint listings_price_period_check
    check (price_period in ('dia', 'semana', 'mes'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_payment_status_check'
  ) then
    alter table public.listings
    add constraint listings_payment_status_check
    check (payment_status in ('not_required', 'pix_pending', 'confirmed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_featured_plan_check'
  ) then
    alter table public.listings
    add constraint listings_featured_plan_check
    check (featured_plan in ('7_days', '15_days', '30_days', 'super_30_days'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_featured_payment_status_check'
  ) then
    alter table public.listings
    add constraint listings_featured_payment_status_check
    check (featured_payment_status in ('not_requested', 'pix_pending', 'confirmed'));
  end if;
end $$;

create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_referral_code_idx on public.listings(referral_code);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null default 'Imobiliario',
  excerpt text not null,
  content text not null,
  image_url text,
  source_name text,
  source_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  ai_generated boolean not null default false,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_status_idx on public.news_articles(status);
create index if not exists news_articles_published_at_idx on public.news_articles(published_at);

grant usage on schema public to anon, authenticated;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.news_articles to anon, authenticated;
grant insert, update, delete on public.news_articles to authenticated;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.news_articles enable row level security;

create policy "Profiles are visible to owner"
on public.profiles for select
using (auth.uid() = id);

create policy "Admins can view profiles"
on public.profiles for select
using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
  )
);

create policy "Users can insert their profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Approved listings are public"
on public.listings for select
using (status = 'approved' or auth.uid() = owner_id);

create policy "Admins can view all listings"
on public.listings for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Owners can create listings"
on public.listings for insert
with check (auth.uid() = owner_id);

create policy "Owners can update own listings before approval"
on public.listings for update
using (auth.uid() = owner_id and status in ('draft', 'pending', 'rejected', 'paused'))
with check (auth.uid() = owner_id);

create policy "Owners can delete own listings before approval"
on public.listings for delete
using (auth.uid() = owner_id and status in ('draft', 'pending', 'rejected'));

create policy "Admins can moderate listings"
on public.listings for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Published news are public"
on public.news_articles for select
using (status = 'published');

create or replace function public.profile_contact_exists(
  candidate_email text,
  candidate_phone text,
  candidate_document text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where (
      candidate_email is not null
      and length(trim(candidate_email)) > 0
      and email is not null
      and lower(email) = lower(trim(candidate_email))
    )
    or (
      candidate_phone is not null
      and length(regexp_replace(candidate_phone, '\D', '', 'g')) > 0
      and regexp_replace(phone, '\D', '', 'g') = regexp_replace(candidate_phone, '\D', '', 'g')
    )
    or (
      candidate_document is not null
      and length(regexp_replace(candidate_document, '\D', '', 'g')) > 0
      and regexp_replace(advertiser_document, '\D', '', 'g') = regexp_replace(candidate_document, '\D', '', 'g')
    )
  );
$$;

grant execute on function public.profile_contact_exists(text, text, text) to anon, authenticated;

create policy "Admins can manage news"
on public.news_articles for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create or replace function public.moderate_listing(listing_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_status not in ('approved', 'rejected', 'paused') then
    raise exception 'Invalid listing status: %', new_status;
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can moderate listings';
  end if;

  update public.listings
  set status = new_status,
      updated_at = now()
  where id = listing_id;
end;
$$;

grant execute on function public.moderate_listing(uuid, text) to authenticated;

create or replace function public.update_listing_contact(
  listing_id uuid,
  new_contact_name text,
  new_contact_phone text,
  new_contact_whatsapp text,
  new_contact_email text,
  new_contact_methods text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.listings
    where listings.id = listing_id
    and listings.owner_id = auth.uid()
  ) then
    raise exception 'Only the listing owner can update contact data';
  end if;

  update public.listings
  set contact_name = new_contact_name,
      contact_phone = new_contact_phone,
      contact_whatsapp = new_contact_whatsapp,
      contact_email = new_contact_email,
      contact_methods = coalesce(new_contact_methods, '{}'),
      status = case
        when listings.owner_id = auth.uid()
          and not exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
          )
        then 'pending'
        else listings.status
      end,
      updated_at = now()
  where id = listing_id;
end;
$$;

grant execute on function public.update_listing_contact(uuid, text, text, text, text, text[]) to authenticated;

create or replace function public.set_listing_main_image(listing_id uuid, image_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_images text[];
begin
  select images
  into current_images
  from public.listings
  where id = listing_id
  and (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

  if current_images is null then
    raise exception 'Listing not found or permission denied';
  end if;

  if not image_url = any(current_images) then
    raise exception 'Image does not belong to this listing';
  end if;

  update public.listings
  set images = array_prepend(image_url, array_remove(current_images, image_url)),
      updated_at = now()
  where id = listing_id;
end;
$$;

grant execute on function public.set_listing_main_image(uuid, text) to authenticated;

create or replace function public.request_listing_highlight(
  listing_id uuid,
  new_featured_plan text,
  new_featured_payment_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_featured_plan not in ('7_days', '15_days', '30_days') then
    raise exception 'Invalid highlight plan';
  end if;

  if not exists (
    select 1
    from public.listings
    where listings.id = listing_id
    and listings.owner_id = auth.uid()
  ) then
    raise exception 'Only the listing owner can request highlight';
  end if;

  update public.listings
  set featured_plan = new_featured_plan,
      featured_payment_status = 'pix_pending',
      featured_payment_amount = new_featured_payment_amount,
      updated_at = now()
  where id = listing_id;
end;
$$;

grant execute on function public.request_listing_highlight(uuid, text, numeric) to authenticated;

create or replace function public.cancel_listing_highlight(listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.listings
    where listings.id = listing_id
    and listings.owner_id = auth.uid()
    and listings.featured_payment_status = 'pix_pending'
  ) then
    raise exception 'Only pending highlight requests can be cancelled by the owner';
  end if;

  update public.listings
  set featured_plan = null,
      featured_payment_status = 'not_requested',
      featured_payment_amount = null,
      updated_at = now()
  where id = listing_id;
end;
$$;

grant execute on function public.cancel_listing_highlight(uuid) to authenticated;

drop function if exists public.update_listing_details(
  uuid, text, text, text, integer, integer, integer, integer, text, text, text, text, double precision, double precision, text, text[], text[], text, text, text, text, text[]
);

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
  new_contact_name text,
  new_contact_phone text,
  new_contact_whatsapp text,
  new_contact_email text,
  new_contact_methods text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_property_type not in ('Casa', 'Terreno', 'Apartamento', 'Kitnet/Conjugado', 'Ponto comercial') then
    raise exception 'Invalid property type';
  end if;

  if new_transaction not in ('Compra', 'Aluguel', 'Temporada') then
    raise exception 'Invalid transaction';
  end if;

  if new_price_period is not null and new_price_period not in ('dia', 'semana', 'mes') then
    raise exception 'Invalid price period';
  end if;

  if array_length(new_images, 1) is null or array_length(new_images, 1) < 3 then
    raise exception 'At least 3 images are required';
  end if;

  if not exists (
    select 1
    from public.listings
    where listings.id = listing_id
    and (
      listings.owner_id = auth.uid()
      or exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
      )
    )
  ) then
    raise exception 'Listing not found or permission denied';
  end if;

  update public.listings
  set title = new_title,
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

grant execute on function public.update_listing_details(
  uuid, text, text, text, integer, text, integer, integer, integer, text, text, text, text, double precision, double precision, text, text[], text[], text, text, text, text, text[]
) to authenticated;

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

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Listing photos are publicly readable"
on storage.objects for select
using (bucket_id = 'listing-photos');

drop policy if exists "Authenticated users can upload listing photos" on storage.objects;

create policy "Users can upload own listing photos"
on storage.objects for insert
with check (
  bucket_id = 'listing-photos'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own listing photos"
on storage.objects for update
using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own listing photos"
on storage.objects for delete
using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);
