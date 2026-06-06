alter table public.listings
add column if not exists payment_confirmed_at timestamptz;

alter table public.listings
add column if not exists listing_expires_at timestamptz;

alter table public.listings
add column if not exists featured_starts_at timestamptz;

alter table public.listings
add column if not exists featured_expires_at timestamptz;

alter table public.listings
add column if not exists payment_proof_sent_at timestamptz;

alter table public.listings
add column if not exists featured_payment_proof_sent_at timestamptz;

create index if not exists listings_payment_status_idx
on public.listings (payment_status);

create index if not exists listings_listing_expires_at_idx
on public.listings (listing_expires_at);

create index if not exists listings_featured_expires_at_idx
on public.listings (featured_expires_at);
