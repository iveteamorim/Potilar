alter table public.listings
add column if not exists payment_proof_sent_at timestamptz;

alter table public.listings
add column if not exists featured_payment_proof_sent_at timestamptz;
