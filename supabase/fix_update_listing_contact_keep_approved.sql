-- Contact-only edits should update WhatsApp/phone immediately
-- without sending the listing back to moderation (pending).
-- Owner or admin can update. Avoids "permission denied for table listings"
-- by owning the function as postgres (SECURITY DEFINER).
-- Run in Supabase SQL Editor.

create or replace function public.update_listing_contact(
  listing_id uuid,
  new_contact_name text,
  new_contact_phone text,
  new_contact_whatsapp text,
  new_contact_email text,
  new_contact_methods text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_owner uuid;
  current_role text;
begin
  select owner_id into listing_owner
  from public.listings
  where id = listing_id;

  if listing_owner is null then
    raise exception 'Listing not found';
  end if;

  select role into current_role
  from public.profiles
  where id = auth.uid();

  if auth.uid() is distinct from listing_owner and coalesce(current_role, '') is distinct from 'admin' then
    raise exception 'Only the listing owner can update contact data';
  end if;

  update public.listings
  set contact_name = new_contact_name,
      contact_phone = new_contact_phone,
      contact_whatsapp = new_contact_whatsapp,
      contact_email = new_contact_email,
      contact_methods = coalesce(new_contact_methods, '{}'),
      updated_at = now()
  where id = listing_id;
end;
$$;

alter function public.update_listing_contact(uuid, text, text, text, text, text[]) owner to postgres;

grant execute on function public.update_listing_contact(uuid, text, text, text, text, text[]) to authenticated;
