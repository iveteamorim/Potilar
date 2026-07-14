-- Atualiza os planos de destaque para 7, 15 e 30 dias.
-- Mantem super_30_days apenas como compatibilidade com registros antigos.

alter table public.listings
drop constraint if exists listings_featured_plan_check;

alter table public.listings
add constraint listings_featured_plan_check
check (featured_plan in ('7_days', '15_days', '30_days', 'super_30_days'));

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
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if new_featured_plan not in ('7_days', '15_days', '30_days') then
    raise exception 'INVALID_FEATURED_PLAN';
  end if;

  update public.listings
  set
    featured_plan = new_featured_plan,
    featured_payment_status = 'pix_pending',
    featured_payment_amount = new_featured_payment_amount,
    featured_payment_proof_sent_at = null,
    featured_starts_at = null,
    featured_expires_at = null,
    updated_at = now()
  where id = listing_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'LISTING_NOT_FOUND';
  end if;
end;
$$;

notify pgrst, 'reload schema';
