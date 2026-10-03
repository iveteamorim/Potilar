-- Capacity model: account type != plan. Active = approved + pending.
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Future improvement: a dedicated purchase ledger (individual_listing_purchase)
-- for full avulso history and renewals. listings.payment_* is enough for this
-- release if confirmation stays server-side and expiration/renewal keep state.

alter table public.listings
add column if not exists publication_kind text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_publication_kind_check'
  ) then
    alter table public.listings
    add constraint listings_publication_kind_check
    check (publication_kind is null or publication_kind in ('free', 'avulso', 'plan'));
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'listings_status_check'
  ) then
    alter table public.listings drop constraint listings_status_check;
  end if;

  alter table public.listings
  add constraint listings_status_check
  check (status in ('draft', 'pending', 'approved', 'rejected', 'paused', 'needs_renewal'));
end $$;

drop policy if exists "Owners can update own listings before approval" on public.listings;
create policy "Owners can update own listings before approval"
on public.listings for update
using (auth.uid() = owner_id and status in ('draft', 'pending', 'rejected', 'paused', 'needs_renewal'))
with check (auth.uid() = owner_id);

create or replace function public.get_account_free_active_limit(account_type text)
returns integer
language sql
immutable
as $$
  select case
    when account_type = 'corretor' then 3
    when account_type = 'imobiliaria' then 10
    else 2
  end;
$$;

create or replace function public.get_account_paid_active_limit(plan_id text)
returns integer
language sql
immutable
as $$
  select case
    when plan_id = 'corretor' then 10
    when plan_id = 'imobiliaria' then 30
    when plan_id = 'plus' then 75
    else null
  end;
$$;

create or replace function public.get_professional_listing_limit(plan_id text, account_type text)
returns integer
language sql
immutable
as $$
  select coalesce(
    public.get_account_paid_active_limit(plan_id),
    public.get_account_free_active_limit(account_type)
  );
$$;

create or replace function public.count_capacity_active_listings(target_owner_id uuid, exclude_listing_id uuid default null)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.listings
  where owner_id = target_owner_id
    and status in ('approved', 'pending')
    and (exclude_listing_id is null or id <> exclude_listing_id);
$$;

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

drop trigger if exists listings_security_guard on public.listings;
create trigger listings_security_guard
before insert or update on public.listings
for each row execute function public.validate_listing_security();

create or replace function public.apply_professional_plan_loss(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row record;
  free_limit integer;
begin
  select account_type, professional_plan
  into profile_row
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  update public.profiles
  set professional_plan = null
  where id = target_user_id;

  free_limit := public.get_account_free_active_limit(profile_row.account_type);

  with ranked as (
    select id,
      row_number() over (order by updated_at desc nulls last, created_at desc nulls last, id desc) as rn
    from public.listings
    where owner_id = target_user_id
      and status in ('approved', 'pending')
  )
  update public.listings
  set
    status = 'needs_renewal',
    updated_at = now()
  where id in (select id from ranked where rn > free_limit);
end;
$$;

drop function if exists public.owner_reactivate_listing(uuid);

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

grant execute on function public.get_account_free_active_limit(text) to authenticated;
grant execute on function public.get_account_paid_active_limit(text) to authenticated;
grant execute on function public.count_capacity_active_listings(uuid, uuid) to authenticated;
grant execute on function public.apply_professional_plan_loss(uuid) to service_role;
grant execute on function public.owner_reactivate_listing(uuid) to authenticated;

notify pgrst, 'reload schema';
