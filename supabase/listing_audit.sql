begin;

create table if not exists public.listing_audit_events (
  id bigint generated always as identity primary key,
  listing_id uuid not null,
  listing_title text,
  owner_id uuid,
  event_type text not null check (event_type in ('created', 'deleted', 'status_changed', 'expiration_changed')),
  old_status text,
  new_status text,
  old_expires_at timestamptz,
  new_expires_at timestamptz,
  actor_id uuid,
  actor_role text not null,
  occurred_at timestamptz not null default clock_timestamp()
);

-- No foreign keys: evidence must survive deletion of the listing or account.
create index if not exists listing_audit_events_time_idx
  on public.listing_audit_events (occurred_at desc, id desc);
create index if not exists listing_audit_events_listing_idx
  on public.listing_audit_events (listing_id, occurred_at desc);

alter table public.listing_audit_events enable row level security;
revoke all on public.listing_audit_events from public, anon, authenticated;
grant select on public.listing_audit_events to authenticated;
drop policy if exists listing_audit_admin_read on public.listing_audit_events;
create policy listing_audit_admin_read on public.listing_audit_events
  for select to authenticated using (public.current_user_is_admin());

create or replace function public.record_listing_audit_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  event_kind text;
  before_row jsonb := '{}'::jsonb;
  after_row jsonb := '{}'::jsonb;
  snapshot jsonb;
begin
  if tg_op <> 'INSERT' then before_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then after_row := to_jsonb(new); end if;

  if tg_op = 'DELETE' then
    event_kind := 'deleted';
    snapshot := before_row;
  elsif tg_op = 'INSERT' then
    event_kind := 'created';
    snapshot := after_row;
  else
    snapshot := after_row;
    if before_row->>'status' is distinct from after_row->>'status' then
      event_kind := 'status_changed';
    elsif before_row->>'listing_expires_at' is distinct from after_row->>'listing_expires_at' then
      event_kind := 'expiration_changed';
    else
      return null;
    end if;
  end if;

  insert into public.listing_audit_events (
    listing_id, listing_title, owner_id, event_type,
    old_status, new_status, old_expires_at, new_expires_at,
    actor_id, actor_role
  ) values (
    (snapshot->>'id')::uuid, snapshot->>'title', (snapshot->>'owner_id')::uuid, event_kind,
    before_row->>'status', after_row->>'status',
    (before_row->>'listing_expires_at')::timestamptz,
    (after_row->>'listing_expires_at')::timestamptz,
    auth.uid(), case
      when auth.uid() is not null and public.current_user_is_admin() then 'admin'
      when auth.uid() = (snapshot->>'owner_id')::uuid then 'owner'
      else coalesce(auth.role(), nullif(current_setting('role', true), 'none'), session_user)
    end
  );
  return null;
end;
$$;

revoke all on function public.record_listing_audit_event() from public, anon, authenticated;
drop trigger if exists listing_audit_event on public.listings;
create trigger listing_audit_event
  after insert or update or delete on public.listings
  for each row execute function public.record_listing_audit_event();

notify pgrst, 'reload schema';
commit;
