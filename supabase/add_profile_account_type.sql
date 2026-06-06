alter table public.profiles
add column if not exists account_type text not null default 'particular';

alter table public.profiles
add column if not exists creci text;

alter table public.profiles
add column if not exists advertiser_document text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_type_check'
  ) then
    alter table public.profiles
    add constraint profiles_account_type_check
    check (account_type in ('particular', 'corretor', 'imobiliaria'));
  end if;
end $$;
