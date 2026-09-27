-- First-party news analytics. Run in the Supabase SQL editor.
-- Stores anonymous article views and share actions. No IP, user agent, or user id.

create table if not exists public.news_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  kind text not null check (kind in ('view', 'share_whatsapp', 'share_copy', 'share_native')),
  surface text,
  share_channel text,
  created_at timestamptz not null default now(),
  constraint news_events_surface_check
    check (surface is null or surface in ('article', 'card')),
  constraint news_events_share_channel_check
    check (share_channel is null or share_channel in ('whatsapp', 'copy', 'native')),
  constraint news_events_view_surface_null
    check (kind <> 'view' or surface is null),
  constraint news_events_share_surface_required
    check (kind = 'view' or surface in ('article', 'card')),
  constraint news_events_share_channel_null
    check (kind = 'view' or share_channel is null)
);

create index if not exists news_events_article_id_idx on public.news_events(article_id);
create index if not exists news_events_article_kind_idx on public.news_events(article_id, kind);
create index if not exists news_events_created_at_idx on public.news_events(created_at);

alter table public.news_events enable row level security;

revoke all on public.news_events from anon, authenticated, public;
grant select on public.news_events to authenticated;

drop policy if exists "Admins can read news events" on public.news_events;
create policy "Admins can read news events"
on public.news_events for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create or replace function public.track_news_event(
  p_slug text,
  p_kind text,
  p_surface text default null,
  p_share_channel text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_article_id uuid;
  v_surface text;
  v_share_channel text;
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return false;
  end if;

  if p_kind is null or p_kind not in ('view', 'share_whatsapp', 'share_copy', 'share_native') then
    return false;
  end if;

  v_surface := nullif(trim(p_surface), '');
  v_share_channel := nullif(trim(p_share_channel), '');

  if p_kind = 'view' then
    if v_surface is not null then
      return false;
    end if;
    if v_share_channel is not null and v_share_channel not in ('whatsapp', 'copy', 'native') then
      return false;
    end if;
  else
    if v_surface is null or v_surface not in ('article', 'card') then
      return false;
    end if;
    v_share_channel := null;
  end if;

  select news_articles.id
  into v_article_id
  from public.news_articles
  where news_articles.slug = trim(p_slug)
    and news_articles.status = 'published'
  limit 1;

  if v_article_id is null then
    return false;
  end if;

  insert into public.news_events (article_id, kind, surface, share_channel)
  values (v_article_id, p_kind, v_surface, v_share_channel);

  return true;
end;
$$;

revoke all on function public.track_news_event(text, text, text, text) from public;
grant execute on function public.track_news_event(text, text, text, text) to anon, authenticated;

create or replace function public.get_news_article_metrics(p_article_ids uuid[])
returns table (
  article_id uuid,
  views bigint,
  share_actions bigint,
  share_whatsapp bigint,
  share_copy bigint,
  share_native bigint,
  visits_from_share bigint,
  visits_from_whatsapp bigint,
  visits_from_copy bigint,
  visits_from_native bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    events.article_id,
    count(*) filter (where events.kind = 'view')::bigint as views,
    count(*) filter (where events.kind in ('share_whatsapp', 'share_copy', 'share_native'))::bigint as share_actions,
    count(*) filter (where events.kind = 'share_whatsapp')::bigint as share_whatsapp,
    count(*) filter (where events.kind = 'share_copy')::bigint as share_copy,
    count(*) filter (where events.kind = 'share_native')::bigint as share_native,
    count(*) filter (where events.kind = 'view' and events.share_channel is not null)::bigint as visits_from_share,
    count(*) filter (where events.kind = 'view' and events.share_channel = 'whatsapp')::bigint as visits_from_whatsapp,
    count(*) filter (where events.kind = 'view' and events.share_channel = 'copy')::bigint as visits_from_copy,
    count(*) filter (where events.kind = 'view' and events.share_channel = 'native')::bigint as visits_from_native
  from public.news_events as events
  where events.article_id = any(p_article_ids)
  group by events.article_id;
end;
$$;

revoke all on function public.get_news_article_metrics(uuid[]) from public, anon;
grant execute on function public.get_news_article_metrics(uuid[]) to authenticated;
