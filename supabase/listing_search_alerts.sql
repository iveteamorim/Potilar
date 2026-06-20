-- Alertas de busca salvas (executar no Supabase SQL Editor se ainda nao existir)

create table if not exists public.listing_search_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  filters jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_search_alerts_user_id_idx on public.listing_search_alerts(user_id);

alter table public.listing_search_alerts enable row level security;

drop policy if exists "Users manage own search alerts" on public.listing_search_alerts;
create policy "Users manage own search alerts"
on public.listing_search_alerts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.listing_search_alerts to authenticated;
