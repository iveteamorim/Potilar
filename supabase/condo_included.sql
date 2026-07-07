alter table public.listings
add column if not exists condo_included boolean not null default false;

comment on column public.listings.condo_included is
'True when the condominium fee is included in the advertised rent price.';

create index if not exists listings_condo_included_idx
on public.listings (condo_included)
where condo_included = true;
