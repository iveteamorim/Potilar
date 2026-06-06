alter table public.profiles
add column if not exists advertiser_document text;

drop policy if exists "Admins can view profiles" on public.profiles;

create policy "Admins can view profiles"
on public.profiles for select
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'
  )
);
