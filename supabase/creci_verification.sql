alter table public.profiles
add column if not exists creci_verified boolean not null default false;

alter table public.profiles
add column if not exists creci_verified_at timestamptz;

comment on column public.profiles.creci is
'Professional CRECI registration number informed by the broker or real estate company.';

comment on column public.profiles.creci_verified is
'True when Potilar manually verified the CRECI registration against CRECI-RN/COFECI public records.';

comment on column public.profiles.creci_verified_at is
'Timestamp when Potilar marked the CRECI registration as verified.';

create index if not exists profiles_creci_verified_idx
on public.profiles (creci_verified)
where creci_verified = true;
