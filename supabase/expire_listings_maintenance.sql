-- Opcional: execute no Supabase se preferir cron nativo em vez da rota /api/cron/expire-listings

create or replace function public.expire_listings_maintenance()
returns table (
  paused_listings integer,
  cleared_highlights integer,
  refreshed_listings integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  paused_count integer := 0;
  cleared_count integer := 0;
  refreshed_count integer := 0;
begin
  update public.listings
  set status = 'paused', updated_at = now()
  where status = 'approved'
    and listing_expires_at is not null
    and listing_expires_at < now();

  get diagnostics paused_count = row_count;

  update public.listings
  set
    featured_plan = null,
    featured_payment_status = 'not_requested',
    featured_payment_amount = null,
    featured_starts_at = null,
    featured_expires_at = null
  where featured_payment_status = 'confirmed'
    and featured_expires_at is not null
    and featured_expires_at < now();

  get diagnostics cleared_count = row_count;

  update public.listings
  set updated_at = now()
  where status = 'approved'
    and (listing_expires_at is null or listing_expires_at > now())
    and (updated_at is null or updated_at < now() - interval '7 days');

  get diagnostics refreshed_count = row_count;

  return query select paused_count, cleared_count, refreshed_count;
end;
$$;

grant execute on function public.expire_listings_maintenance() to authenticated;
