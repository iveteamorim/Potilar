grant select, update, delete on public.advertiser_leads to authenticated;

drop policy if exists "Admin can manage advertiser leads" on public.advertiser_leads;

create policy "Admin can manage advertiser leads"
on public.advertiser_leads for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
