create table if not exists public.listing_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  listing_owner_id uuid not null references auth.users(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists listing_messages_owner_idx
on public.listing_messages (listing_owner_id, created_at desc);

create index if not exists listing_messages_sender_idx
on public.listing_messages (sender_user_id, created_at desc);

create index if not exists listing_messages_listing_idx
on public.listing_messages (listing_id);

alter table public.listing_messages enable row level security;

drop policy if exists "Anyone can send listing messages" on public.listing_messages;
create policy "Anyone can send listing messages"
on public.listing_messages for insert
to anon, authenticated
with check (
  length(trim(sender_name)) >= 2
  and position('@' in sender_email) > 1
  and length(trim(message)) between 10 and 2000
  and (sender_user_id is null or sender_user_id = auth.uid())
);

drop policy if exists "Users can read own listing messages" on public.listing_messages;
create policy "Users can read own listing messages"
on public.listing_messages for select
to authenticated
using (
  listing_owner_id = auth.uid()
  or sender_user_id = auth.uid()
);

drop policy if exists "Owners can update message status" on public.listing_messages;
create policy "Owners can update message status"
on public.listing_messages for update
to authenticated
using (listing_owner_id = auth.uid())
with check (listing_owner_id = auth.uid());

grant insert on public.listing_messages to anon, authenticated;
grant select, update on public.listing_messages to authenticated;
