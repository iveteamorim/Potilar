import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fallbackNewsArticles, formatNewsDate, getNewsImageUrl, sanitizeNewsArticle, type NewsArticle } from '@/data/news';

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
  const isOldAiDraft =
    row.excerpt.includes('Rascunho para revisao') ||
    row.content.includes('Rascunho gerado automaticamente') ||
    row.content.includes('Sugestao editorial');

  if (isOldAiDraft) {
    return sanitizeNewsArticle({
      slug: row.slug,
      category: row.category,
      title: row.title,
      excerpt: `${row.title}. Entenda por que esse tema pode influenciar proprietários, compradores, inquilinos e profissionais do mercado imobiliário no Rio Grande do Norte.`,
      content: [
        `${row.title} é um tema relevante para quem acompanha o mercado imobiliário e a construção civil no Rio Grande do Norte.`,
        `Notícias ligadas a ${row.category.toLowerCase()} podem influenciar decisões de compra, venda, aluguel, investimento e divulgação de imóveis, principalmente quando envolvem atividade econômica, obras, financiamento, documentação ou novas oportunidades de negócio.`,
        `Para proprietários e anunciantes, acompanhar esse tipo de informação ajuda a entender melhor o momento do mercado, ajustar expectativas e comparar oportunidades com mais critério.`,
        `A Potilar recomenda sempre conferir os dados completos na fonte original antes de tomar decisões comerciais, jurídicas ou financeiras.`
      ],
      imageUrl: getNewsImageUrl(row.category, row.image_url, row.slug),
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      publishedAt: row.published_at
    });
  }

  return sanitizeNewsArticle({
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content.split('\n').filter(Boolean),
    imageUrl: getNewsImageUrl(row.category, row.image_url, row.slug),
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    publishedAt: row.published_at
  });
}

async function getArticle(slug: string): Promise<NewsArticle | null> {
  try {
    const supabase = createClient();
    const rpc = await supabase.rpc('get_public_published_news_by_slug', {
      article_slug: slug
    });

    if (!rpc.error && rpc.data?.[0]) return rowToArticle(rpc.data[0] as NewsRow);

    let { data, error } = await supabase
      .from('news_articles')
      .select('slug,category,title,excerpt,content,image_url,source_name,source_url,published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!error && data) return rowToArticle(data as NewsRow);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role === 'admin') {
        const draft = await supabase
          .from('news_articles')
          .select('slug,category,title,excerpt,content,image_url,source_name,source_url,published_at')
          .eq('slug', slug)
          .single();

        data = draft.data;
        error = draft.error;

        if (!error && data) return rowToArticle(data as NewsRow);
      }
    }
  } catch {
    // Fallback below.
  }

  return fallbackNewsArticles.find((article) => article.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Artigo não encontrado' };

  return {
    title: `${article.title} | Potilar Notícias`,
    description: article.excerpt,
    alternates: {
      canonical: `/noticias/${params.slug}`
    }
  };
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) return notFound();
  const articleUrl = `https://potilar.com.br/noticias/${article.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: article.publishedAt || undefined,
    dateModified: article.publishedAt || undefined,
    mainEntityOfPage: articleUrl,
    author: {
      '@type': 'Organization',
      name: 'Potilar'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Potilar',
      logo: {
        '@type': 'ImageObject',
        url: 'https://potilar.com.br/POTILAR-LOGO.png'
      }
    },
    about: ['mercado imobiliario', 'Rio Grande do Norte', article.category]
  };

  return (
    <main className="section-padding">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl">
        <Link href="/noticias" className="text-sm font-bold text-ocean-700">
          Potilar Noticias
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-ocean-600">
          <span>{article.category}</span>
          {formatNewsDate(article.publishedAt) && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{formatNewsDate(article.publishedAt)}</span>
            </>
          )}
        </div>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 dark:text-white">{article.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{article.excerpt}</p>

        {article.imageUrl && (
          <img src={article.imageUrl} alt="" className="mt-8 h-72 w-full object-cover" />
        )}

        <div className="mt-10 space-y-6">
          {article.content.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-slate-600 dark:text-slate-300">
              {paragraph}
            </p>
          ))}
        </div>

        {(article.sourceName || article.sourceUrl) && (
          <div className="mt-10 border-t border-sand-200 pt-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            Fonte:{' '}
            {article.sourceUrl ? (
              <a href={article.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-ocean-700">
                {article.sourceName || article.sourceUrl}
              </a>
            ) : (
              <span className="font-bold">{article.sourceName}</span>
            )}
          </div>
        )}

        <div className="mt-10 border-t border-sand-200 pt-6 dark:border-slate-800">
          <Link href="/imoveis" className="text-sm font-bold text-ocean-700">
            Ver imóveis publicados na Potilar
          </Link>
        </div>
      </article>
    </main>
  );
}
