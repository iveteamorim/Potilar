create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  listing_owner_id uuid not null references auth.users(id) on delete cascade,
  seeker_user_id uuid not null references auth.users(id) on delete cascade,
  seeker_name text not null,
  seeker_email text not null,
  advertiser_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, seeker_user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists chat_conversations_owner_idx
on public.chat_conversations (listing_owner_id, updated_at desc);

create index if not exists chat_conversations_seeker_idx
on public.chat_conversations (seeker_user_id, updated_at desc);

create index if not exists chat_messages_conversation_idx
on public.chat_messages (conversation_id, created_at asc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Participants can read conversations" on public.chat_conversations;
create policy "Participants can read conversations"
on public.chat_conversations for select
to authenticated
using (
  listing_owner_id = auth.uid()
  or seeker_user_id = auth.uid()
);

drop policy if exists "Seekers can create conversations" on public.chat_conversations;
create policy "Seekers can create conversations"
on public.chat_conversations for insert
to authenticated
with check (
  seeker_user_id = auth.uid()
  and seeker_user_id <> listing_owner_id
  and length(trim(seeker_name)) >= 2
  and position('@' in seeker_email) > 1
);

drop policy if exists "Participants can update conversations" on public.chat_conversations;
create policy "Participants can update conversations"
on public.chat_conversations for update
to authenticated
using (
  listing_owner_id = auth.uid()
  or seeker_user_id = auth.uid()
)
with check (
  listing_owner_id = auth.uid()
  or seeker_user_id = auth.uid()
);

drop policy if exists "Participants can read chat messages" on public.chat_messages;
create policy "Participants can read chat messages"
on public.chat_messages for select
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and (c.listing_owner_id = auth.uid() or c.seeker_user_id = auth.uid())
  )
);

drop policy if exists "Participants can send chat messages" on public.chat_messages;
create policy "Participants can send chat messages"
on public.chat_messages for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and length(trim(body)) between 1 and 2000
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and (c.listing_owner_id = auth.uid() or c.seeker_user_id = auth.uid())
  )
);

drop policy if exists "Participants can update read receipts" on public.chat_messages;
create policy "Participants can update read receipts"
on public.chat_messages for update
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and (c.listing_owner_id = auth.uid() or c.seeker_user_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and (c.listing_owner_id = auth.uid() or c.seeker_user_id = auth.uid())
  )
);

grant select, insert, update on public.chat_conversations to authenticated;
grant select, insert, update on public.chat_messages to authenticated;
