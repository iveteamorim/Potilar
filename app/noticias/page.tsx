import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { dedupeNewsArticles, fallbackNewsArticles, formatNewsDate, getNewsImageUrl, sanitizeNewsArticle, withUniqueNewsImages, type NewsArticle } from '@/data/news';

export const metadata: Metadata = {
  title: 'Potilar Notícias | Mercado imobiliário no RN',
  description:
    'Notícias, orientações e tendências sobre imóveis, aluguel, compra, construção e documentação no Rio Grande do Norte.',
  alternates: {
    canonical: '/noticias'
  }
};

type NewsRow = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
};

function rowToArticle(row: NewsRow): NewsArticle {
  const isOldAiDraft = row.excerpt.includes('Rascunho para revisão') || row.content.includes('Rascunho gerado automaticamente');

  return sanitizeNewsArticle({
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: isOldAiDraft
      ? `${row.title}. Entenda por que esse tema pode influenciar o mercado imobiliário no Rio Grande do Norte.`
      : row.excerpt,
    content: row.content.split('\n').filter(Boolean),
    imageUrl: getNewsImageUrl(row.category, row.image_url, row.slug),
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    publishedAt: row.published_at
  });
}

async function getNewsArticles() {
  try {
    const supabase = createClient();
    const rpc = await supabase.rpc('get_public_published_news');

    if (!rpc.error && rpc.data?.length) {
      return withUniqueNewsImages(dedupeNewsArticles((rpc.data as NewsRow[]).map(rowToArticle)));
    }

    const { data, error } = await supabase
      .from('news_articles')
      .select('slug,category,title,excerpt,content,image_url,source_name,source_url,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(12);

    if (error || !data?.length) return fallbackNewsArticles;
    return withUniqueNewsImages(dedupeNewsArticles((data as NewsRow[]).map(rowToArticle)));
  } catch {
    return fallbackNewsArticles;
  }
}

function normalizeTopic(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function NewsPage({
  searchParams
}: {
  searchParams?: { tema?: string; view?: string };
}) {
  const articles = await getNewsArticles();
  const categories = Array.from(new Set(articles.map((article) => article.category))).filter(Boolean);
  const activeTopic = String(searchParams?.tema ?? '');
  const isListView = searchParams?.view === 'lista' || Boolean(activeTopic);
  const visibleArticles = activeTopic
    ? articles.filter((article) => normalizeTopic(article.category) === activeTopic)
    : articles;
  const [leadArticle, ...otherArticles] = visibleArticles;
  const sideArticles = otherArticles.slice(0, 3);
  const gridArticles = otherArticles.slice(3);

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-7xl">
        <section className="border-b border-sand-200 pb-8 dark:border-slate-800">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Potilar Notícias</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-5xl">
                Mercado imobiliário do RN em foco.
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Atualizações sobre imóveis, construção, financiamento, aluguel, documentação e segurança para quem compra,
              vende, aluga ou anuncia no Rio Grande do Norte.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Link
              href="/noticias?view=lista"
              className={`border px-4 py-2 text-sm font-bold transition ${
                isListView && !activeTopic
                  ? 'border-ocean-700 bg-ocean-700 text-white'
                  : 'border-ocean-200 bg-white text-ocean-700 hover:border-ocean-700'
              }`}
            >
              Ver todas
            </Link>
            {categories.map((category) => {
              const topicSlug = normalizeTopic(category);
              const active = activeTopic === topicSlug;
              return (
                <Link
                  key={category}
                  href={`/noticias?tema=${topicSlug}`}
                  className={`border px-4 py-2 text-sm font-bold transition ${
                    active
                      ? 'border-ocean-700 bg-ocean-700 text-white'
                      : 'border-sand-200 bg-white text-slate-700 hover:border-ocean-700 hover:text-ocean-700'
                  }`}
                >
                  {category}
                </Link>
              );
            })}
            {(isListView || activeTopic) && (
              <Link href="/noticias" className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-ocean-700">
                Destaques
              </Link>
            )}
          </div>
        </section>

        {isListView ? (
          <section className="grid gap-5 py-10">
            {visibleArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/noticias/${article.slug}`}
                className="group grid gap-4 border border-sand-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[220px_1fr]"
              >
                <img src={article.imageUrl} alt="" className="h-44 w-full object-cover sm:h-full" />
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-ocean-600">
                      {article.category}
                      {formatNewsDate(article.publishedAt) ? ` · ${formatNewsDate(article.publishedAt)}` : ''}
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold leading-snug text-slate-950 group-hover:text-ocean-800 dark:text-white">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{article.excerpt}</p>
                  </div>
                  <span className="mt-4 text-sm font-bold text-ocean-700">Ler noticia</span>
                </div>
              </Link>
            ))}
          </section>
        ) : leadArticle ? (
          <section className="grid gap-8 py-10 lg:grid-cols-[1.35fr_0.65fr]">
            <Link
              href={`/noticias/${leadArticle.slug}`}
              className="group grid overflow-hidden border border-sand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.95fr_1.05fr]"
            >
              <img src={leadArticle.imageUrl} alt="" className="h-72 w-full object-cover lg:h-full" />
              <div className="flex min-h-[360px] flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-ocean-600">
                    <span>{leadArticle.category}</span>
                    {formatNewsDate(leadArticle.publishedAt) && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{formatNewsDate(leadArticle.publishedAt)}</span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 group-hover:text-ocean-800 dark:text-white sm:text-4xl">
                    {leadArticle.title}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{leadArticle.excerpt}</p>
                </div>
                <span className="mt-6 inline-flex text-base font-bold text-ocean-700">Ler noticia</span>
              </div>
            </Link>

            <aside className="space-y-4">
              <div className="border-b border-sand-200 pb-3 dark:border-slate-800">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Ultimas atualizacoes</h2>
              </div>
              {sideArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/noticias/${article.slug}`}
                  className="block border-b border-sand-200 pb-4 transition hover:text-ocean-800 dark:border-slate-800"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-ocean-600">
                    {article.category}
                    {formatNewsDate(article.publishedAt) ? ` · ${formatNewsDate(article.publishedAt)}` : ''}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold leading-snug text-slate-950 dark:text-white">{article.title}</h3>
                </Link>
              ))}
              <div className="border border-sand-200 bg-sand-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Temas</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((topic) => (
                    <Link
                      key={topic}
                      href={`/noticias?tema=${normalizeTopic(topic)}`}
                      className="border border-sand-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-ocean-700 hover:text-ocean-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      {topic}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        ) : null}

        {!isListView && gridArticles.length > 0 && (
          <section className="grid gap-6 border-t border-sand-200 pt-8 dark:border-slate-800 md:grid-cols-3">
            {gridArticles.map((article) => (
              <Link key={article.slug} href={`/noticias/${article.slug}`} className="group block">
                <img src={article.imageUrl} alt="" className="h-44 w-full object-cover" />
                <div className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-ocean-600">
                  {article.category}
                  {formatNewsDate(article.publishedAt) ? ` · ${formatNewsDate(article.publishedAt)}` : ''}
                </div>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-slate-950 group-hover:text-ocean-800 dark:text-white">
                  {article.title}
                </h3>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
