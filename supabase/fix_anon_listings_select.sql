-- Restore public SELECT on approved listings for visitors (anon).
-- The admin policy used to apply to ALL roles and read public.profiles;
-- anon has no GRANT on profiles, so the whole listings query failed with
-- "permission denied for table profiles". Home/map then fell back to RPC only.

grant usage on schema public to anon, authenticated;
grant select on public.listings to anon, authenticated;

drop policy if exists "Admins can view all listings" on public.listings;
create policy "Admins can view all listings"
on public.listings
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Approved listings are public" on public.listings;
create policy "Approved listings are public"
on public.listings
for select
using (status = 'approved' or auth.uid() = owner_id);

-- Paid/approved ads without listing_expires_at were hidden by older RPCs
-- that required listing_expires_at > now(). Give them the standard window.
update public.listings
set
  listing_expires_at =
    coalesce(payment_confirmed_at, updated_at, created_at, now())
    + case
      when transaction = 'Temporada' then interval '60 days'
      else interval '60 days'
    end,
  updated_at = now()
where status = 'approved'
  and listing_expires_at is null;
