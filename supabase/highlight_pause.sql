-- Pausing preserves the highlight's existing expiration date.
alter table public.listings
  drop constraint if exists listings_featured_payment_status_check;

alter table public.listings
  add constraint listings_featured_payment_status_check
  check (featured_payment_status in ('not_requested', 'pix_pending', 'confirmed', 'paused'));

notify pgrst, 'reload schema';
