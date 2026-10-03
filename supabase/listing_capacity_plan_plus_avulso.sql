-- Delta: plan quota + avulsos above the plan. Does not change account_type.
-- Run after listing_capacity.sql. Safe to re-run.

create or replace function public.validate_listing_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean := public.current_user_is_admin();
  owner_profile record;
  paid_limit integer;
  free_limit integer;
  covered_limit integer;
  active_count integer;
begin
  if is_admin then
    return new;
  end if;

  if auth.uid() is null or new.owner_id <> auth.uid() then
    raise exception 'LISTING_OWNER_MISMATCH';
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending') then
      raise exception 'INVALID_OWNER_LISTING_STATUS';
    end if;

    if new.payment_status = 'confirmed' or new.featured_payment_status = 'confirmed' then
      raise exception 'PAYMENT_CONFIRMATION_NOT_ALLOWED';
    end if;

    if new.payment_confirmed_at is not null or new.listing_expires_at is not null then
      raise exception 'PAYMENT_EVIDENCE_NOT_ALLOWED';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id then
      raise exception 'LISTING_OWNER_CHANGE_NOT_ALLOWED';
    end if;

    if new.status = 'approved' and old.status <> 'approved' and old.status not in ('paused', 'needs_renewal') then
      raise exception 'OWNER_CANNOT_APPROVE_LISTING';
    end if;

    if new.payment_status = 'confirmed' and old.payment_status is distinct from 'confirmed' then
      raise exception 'PAYMENT_CONFIRMATION_NOT_ALLOWED';
    end if;

    if new.featured_payment_status = 'confirmed' and old.featured_payment_status is distinct from 'confirmed' then
      raise exception 'PAYMENT_CONFIRMATION_NOT_ALLOWED';
    end if;

    if new.payment_confirmed_at is distinct from old.payment_confirmed_at
      or new.listing_expires_at is distinct from old.listing_expires_at then
      raise exception 'PAYMENT_EVIDENCE_NOT_ALLOWED';
    end if;
  end if;

  if new.status not in ('approved', 'pending') then
    return new;
  end if;

  select account_type, professional_plan
  into owner_profile
  from public.profiles
  where id = new.owner_id;

  paid_limit := public.get_account_paid_active_limit(owner_profile.professional_plan);
  free_limit := public.get_account_free_active_limit(owner_profile.account_type);
  covered_limit := coalesce(paid_limit, free_limit);
  active_count := public.count_capacity_active_listings(new.owner_id, case when tg_op = 'UPDATE' then old.id else null end);

  if active_count < covered_limit then
    return new;
  end if;

  if new.payment_status = 'pix_pending' then
    return new;
  end if;

  if new.payment_status = 'confirmed' and new.payment_confirmed_at is not null then
    return new;
  end if;

  raise exception 'LISTING_PAYMENT_REQUIRED';
end;
$$;

create or replace function public.owner_reactivate_listing(listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_row record;
  owner_profile record;
  paid_limit integer;
  free_limit integer;
  covered_limit integer;
  active_count integer;
  next_status text;
begin
  select id, owner_id, status, is_paid, payment_status, transaction
  into listing_row
  from public.listings
  where id = listing_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'Anuncio nao encontrado ou sem permissao';
  end if;

  if listing_row.status not in ('paused', 'needs_renewal') then
    raise exception 'Este anuncio nao pode ser reativado';
  end if;

  select account_type, professional_plan, role
  into owner_profile
  from public.profiles
  where id = auth.uid();

  if owner_profile.role = 'admin' then
    next_status := case
      when listing_row.is_paid and listing_row.payment_status <> 'confirmed' then 'pending'
      else 'approved'
    end;
    update public.listings
    set status = next_status, updated_at = now()
    where id = listing_id;
    return 'reactivated';
  end if;

  paid_limit := public.get_account_paid_active_limit(owner_profile.professional_plan);
  free_limit := public.get_account_free_active_limit(owner_profile.account_type);
  covered_limit := coalesce(paid_limit, free_limit);
  active_count := public.count_capacity_active_listings(auth.uid(), listing_id);

  if active_count >= covered_limit then
    raise exception 'CAPACITY_PAYMENT_REQUIRED';
  end if;

  next_status := case
    when listing_row.is_paid and listing_row.payment_status <> 'confirmed' then 'pending'
    else 'approved'
  end;

  update public.listings
  set status = next_status, updated_at = now()
  where id = listing_id;

  return 'reactivated';
end;
$$;

notify pgrst, 'reload schema';
