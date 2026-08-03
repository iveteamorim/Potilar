-- Hardening anti-bypass para perfis, planos profissionais e anuncios.
-- Execute no SQL Editor do Supabase depois de aplicar o schema principal.

alter table public.profiles add column if not exists professional_plan text;

create or replace function public.only_digits(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(input, ''), '\D', '', 'g');
$$;

create or replace function public.is_valid_cpf(input text)
returns boolean
language plpgsql
immutable
as $$
declare
  cpf text := public.only_digits(input);
  sum_value integer;
  check_one integer;
  check_two integer;
  i integer;
begin
  if length(cpf) <> 11 or cpf ~ '^(\d)\1{10}$' then
    return false;
  end if;

  sum_value := 0;
  for i in 1..9 loop
    sum_value := sum_value + substring(cpf, i, 1)::integer * (11 - i);
  end loop;
  check_one := (sum_value * 10) % 11;
  if check_one = 10 then
    check_one := 0;
  end if;

  sum_value := 0;
  for i in 1..10 loop
    sum_value := sum_value + substring(cpf, i, 1)::integer * (12 - i);
  end loop;
  check_two := (sum_value * 10) % 11;
  if check_two = 10 then
    check_two := 0;
  end if;

  return check_one = substring(cpf, 10, 1)::integer
    and check_two = substring(cpf, 11, 1)::integer;
end;
$$;

create or replace function public.is_valid_cnpj(input text)
returns boolean
language plpgsql
immutable
as $$
declare
  cnpj text := public.only_digits(input);
  weights_one integer[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  weights_two integer[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  sum_value integer;
  digit integer;
  i integer;
begin
  if length(cnpj) <> 14 or cnpj ~ '^(\d)\1{13}$' then
    return false;
  end if;

  sum_value := 0;
  for i in 1..12 loop
    sum_value := sum_value + substring(cnpj, i, 1)::integer * weights_one[i];
  end loop;
  digit := sum_value % 11;
  digit := case when digit < 2 then 0 else 11 - digit end;
  if digit <> substring(cnpj, 13, 1)::integer then
    return false;
  end if;

  sum_value := 0;
  for i in 1..13 loop
    sum_value := sum_value + substring(cnpj, i, 1)::integer * weights_two[i];
  end loop;
  digit := sum_value % 11;
  digit := case when digit < 2 then 0 else 11 - digit end;

  return digit = substring(cnpj, 14, 1)::integer;
end;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    );
$$;

create or replace function public.validate_profile_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean := public.current_user_is_admin();
  document_digits text := public.only_digits(new.advertiser_document);
begin
  if coalesce(auth.role(), '') <> 'service_role' and auth.uid() is not null and new.id <> auth.uid() then
    raise exception 'PROFILE_OWNER_MISMATCH';
  end if;

  if tg_op = 'INSERT' and not is_admin then
    new.role := 'owner';
    new.professional_plan := null;
  end if;

  if tg_op = 'UPDATE' and not is_admin then
    if new.role is distinct from old.role then
      raise exception 'ROLE_CHANGE_NOT_ALLOWED';
    end if;

    if new.professional_plan is distinct from old.professional_plan then
      raise exception 'PLAN_CHANGE_NOT_ALLOWED';
    end if;

    if new.account_type is distinct from old.account_type then
      raise exception 'ACCOUNT_TYPE_CHANGE_NOT_ALLOWED';
    end if;
  end if;

  if new.account_type = 'corretor' then
    if not public.is_valid_cpf(new.advertiser_document) then
      raise exception 'INVALID_CPF';
    end if;

    if length(trim(coalesce(new.creci, ''))) < 3 then
      raise exception 'CRECI_REQUIRED';
    end if;
  elsif new.account_type = 'imobiliaria' then
    if not public.is_valid_cnpj(new.advertiser_document) then
      raise exception 'INVALID_CNPJ';
    end if;

    if length(trim(coalesce(new.creci, ''))) < 3 then
      raise exception 'CRECI_REQUIRED';
    end if;
  elsif new.account_type = 'particular' then
    if length(document_digits) > 0 and not public.is_valid_cpf(new.advertiser_document) then
      raise exception 'INVALID_CPF';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_security_guard on public.profiles;
create trigger profiles_security_guard
before insert or update on public.profiles
for each row execute function public.validate_profile_security();

create or replace function public.get_professional_listing_limit(plan_id text, account_type text)
returns integer
language sql
immutable
as $$
  select case
    when plan_id = 'plus' then 75
    when plan_id = 'imobiliaria' then 30
    when plan_id = 'corretor' then 10
    when account_type = 'imobiliaria' then 30
    when account_type = 'corretor' then 10
    else null
  end;
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
  listing_limit integer;
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
  elsif tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id then
      raise exception 'LISTING_OWNER_CHANGE_NOT_ALLOWED';
    end if;

    if new.status = 'approved' and old.status <> 'approved' then
      raise exception 'OWNER_CANNOT_APPROVE_LISTING';
    end if;
  end if;

  select account_type, professional_plan
  into owner_profile
  from public.profiles
  where id = new.owner_id;

  listing_limit := public.get_professional_listing_limit(owner_profile.professional_plan, owner_profile.account_type);

  if listing_limit is not null and new.status in ('approved', 'pending', 'paused') then
    select count(*)
    into active_count
    from public.listings
    where owner_id = new.owner_id
      and status in ('approved', 'pending', 'paused')
      and (tg_op = 'INSERT' or id <> old.id);

    if active_count >= listing_limit then
      raise exception 'LISTING_LIMIT_REACHED';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists listings_security_guard on public.listings;
create trigger listings_security_guard
before insert or update on public.listings
for each row execute function public.validate_listing_security();

revoke update (role, professional_plan) on public.profiles from authenticated;

grant execute on function public.only_digits(text) to anon, authenticated;
grant execute on function public.is_valid_cpf(text) to anon, authenticated;
grant execute on function public.is_valid_cnpj(text) to anon, authenticated;
