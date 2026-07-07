alter table public.listing_messages
add column if not exists owner_reply text,
add column if not exists owner_replied_at timestamptz;

comment on column public.listing_messages.owner_reply is
'Reply written by the listing owner to the buyer message.';

comment on column public.listing_messages.owner_replied_at is
'Timestamp when the listing owner replied to the buyer message.';
