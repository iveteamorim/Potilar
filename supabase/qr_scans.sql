create table if not exists public.qr_scans (
  id bigint generated always as identity primary key,
  campaign text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint qr_scans_campaign_content_check check (
    campaign = 'cartao_rn_2026'
    and content in ('frente_anunciar', 'verso_buscar')
  )
);

alter table public.qr_scans enable row level security;

create or replace function public.can_read_qr_scans()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

revoke all on public.qr_scans from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant insert on public.qr_scans to anon, authenticated;
grant select on public.qr_scans to authenticated;
grant all on public.qr_scans to service_role;
revoke all on function public.can_read_qr_scans() from public, anon;
grant execute on function public.can_read_qr_scans() to authenticated, service_role;
grant usage, select on sequence public.qr_scans_id_seq to anon, authenticated, service_role;

drop policy if exists "Public can insert physical card QR scans" on public.qr_scans;
create policy "Public can insert physical card QR scans"
on public.qr_scans for insert
to anon, authenticated
with check (
  campaign = 'cartao_rn_2026'
  and content in ('frente_anunciar', 'verso_buscar')
);

drop policy if exists "Admin can read physical card QR scans" on public.qr_scans;
create policy "Admin can read physical card QR scans"
on public.qr_scans for select
to authenticated
using (public.can_read_qr_scans());

create index if not exists qr_scans_campaign_created_at_idx
on public.qr_scans (campaign, created_at desc);

create index if not exists qr_scans_campaign_content_created_at_idx
on public.qr_scans (campaign, content, created_at desc);
