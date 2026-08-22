-- Allow profile banner/photo/bio updates without re-validating CPF/CNPJ/CRECI
-- on every UPDATE. Document rules only apply when those fields (or account_type) change.
-- Run in Supabase SQL Editor.

create or replace function public.validate_profile_security()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean := public.current_user_is_admin();
  document_digits text := public.only_digits(new.advertiser_document);
  should_validate_document boolean := false;
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

  should_validate_document :=
    tg_op = 'INSERT'
    or new.account_type is distinct from old.account_type
    or new.advertiser_document is distinct from old.advertiser_document
    or new.creci is distinct from old.creci;

  if should_validate_document then
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
  end if;

  return new;
end;
$$;

-- Ensure banner/photo columns exist and are writable by owners.
alter table public.profiles
  add column if not exists profile_image_url text,
  add column if not exists banner_image_url text;

grant update (banner_image_url, profile_image_url, public_slug, company_name, bio, creci, languages, phone, full_name)
  on public.profiles to authenticated;
