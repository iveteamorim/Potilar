create table if not exists public.listing_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists listing_favorites_listing_id_idx
on public.listing_favorites (listing_id);

alter table public.listing_favorites enable row level security;

drop policy if exists "Users manage own favorites" on public.listing_favorites;

create policy "Users manage own favorites"
on public.listing_favorites
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
