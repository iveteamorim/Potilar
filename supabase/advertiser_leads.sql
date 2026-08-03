create table if not exists public.advertiser_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text,
  city text not null,
  advertiser_type text not null,
  property_type text not null,
  message text,
  source text not null default 'site',
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'discarded')),
  created_at timestamptz not null default now()
);

alter table public.advertiser_leads enable row level security;

drop policy if exists "Anyone can submit advertiser leads" on public.advertiser_leads;
create policy "Anyone can submit advertiser leads"
on public.advertiser_leads for insert
to anon, authenticated
with check (
  length(trim(name)) >= 2
  and length(trim(whatsapp)) >= 8
  and length(trim(city)) >= 1
  and length(trim(advertiser_type)) >= 1
  and length(trim(property_type)) >= 1
);

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

create index if not exists advertiser_leads_created_at_idx
on public.advertiser_leads (created_at desc);
