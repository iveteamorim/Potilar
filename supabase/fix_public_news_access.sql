-- Corrige noticias invisiveis na pagina publica /noticias.
-- Execute no Supabase SQL Editor (projeto Potilar).

grant usage on schema public to anon, authenticated;
grant select on public.news_articles to anon, authenticated;

alter table public.news_articles enable row level security;

drop policy if exists "Published news are public" on public.news_articles;

create policy "Published news are public"
  on public.news_articles
  for select
  using (status = 'published');

-- Publica noticias IA recentes que ja foram geradas como conteudo final.
update public.news_articles
set
  status = 'published',
  published_at = coalesce(published_at, created_at, now()),
  updated_at = now()
where ai_generated = true
  and status = 'draft'
  and content not ilike '%Rascunho gerado automaticamente%'
  and content not ilike '%Rascunho para revisao%'
  and content not ilike '%Sugestao editorial%';

drop function if exists public.get_public_published_news();

create or replace function public.get_public_published_news()
returns table (
  slug text,
  category text,
  title text,
  excerpt text,
  content text,
  image_url text,
  source_name text,
  source_url text,
  published_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    news_articles.slug,
    news_articles.category,
    news_articles.title,
    news_articles.excerpt,
    news_articles.content,
    news_articles.image_url,
    news_articles.source_name,
    news_articles.source_url,
    news_articles.published_at
  from public.news_articles
  where news_articles.status = 'published'
  order by news_articles.published_at desc nulls last, news_articles.created_at desc
  limit 24;
$$;

grant execute on function public.get_public_published_news() to anon, authenticated;

drop function if exists public.get_public_published_news_by_slug(text);

create or replace function public.get_public_published_news_by_slug(article_slug text)
returns table (
  slug text,
  category text,
  title text,
  excerpt text,
  content text,
  image_url text,
  source_name text,
  source_url text,
  published_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    news_articles.slug,
    news_articles.category,
    news_articles.title,
    news_articles.excerpt,
    news_articles.content,
    news_articles.image_url,
    news_articles.source_name,
    news_articles.source_url,
    news_articles.published_at
  from public.news_articles
  where news_articles.status = 'published'
    and news_articles.slug = article_slug
  limit 1;
$$;

grant execute on function public.get_public_published_news_by_slug(text) to anon, authenticated;
