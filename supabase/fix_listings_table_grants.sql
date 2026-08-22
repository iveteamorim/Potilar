-- Restore table privileges if SELECT/UPDATE on listings was revoked.
-- Safe to re-run. Does not weaken RLS policies.

grant usage on schema public to anon, authenticated;

grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

grant select, insert, update on public.profiles to authenticated;

-- Ensure service_role keeps full access (bypasses RLS when key is correct).
grant all on table public.listings to service_role;
grant all on table public.profiles to service_role;
