import HeroSearch from '@/components/HeroSearch';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import PropertyMap from '@/components/PropertyMapLoader';
import MobilePropertyMapToggle from '@/components/MobilePropertyMapToggle';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty } from '@/lib/listings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import type { Property } from '@/data/properties';
import Link from 'next/link';
import agencyMatchImage from '@/components/ayudamosencontrarimobiliaria.jpg';
import { dedupeNewsArticles, fallbackNewsArticles, formatNewsDate, getNewsImageUrl, withUniqueNewsImages, type NewsArticle } from '@/data/news';
import { SEO_INTENT_PAGES } from '@/lib/seoIntentPages';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    absolute: 'Potilar | Imoveis no Rio Grande do Norte'
  },
  description:
    'Encontre e anuncie casas, apartamentos, terrenos, alugueis e temporada no Rio Grande do Norte com contato direto.',
  alternates: {
    canonical: '/'
  }
};

type PublicListingRow = {
  id: string;
  slug: string;
  title: string;
  property_type: Property['propertyType'];
  transaction: Property['transaction'];
  price: number;
  price_period?: Property['pricePeriod'] | null;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  location: string;
  neighborhood?: string | null;
  community?: string | null;
  address_extra?: string | null;
  lat: number;
  lng: number;
  images: string[];
  featured_plan?: '7_days' | '30_days' | 'super_30_days' | null;
  featured_payment_status?: 'not_requested' | 'pix_pending' | 'confirmed' | null;
  featured_starts_at?: string | null;
  featured_expires_at?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  contact_methods?: string[] | null;
  description: string;
  features: string[];
  created_at?: string | null;
  updated_at?: string | null;
};

function toProperty(listing: PublicListingRow) {
  return listingRowToProperty({
    ...listing,
    featured_plan: listing.featured_plan ?? null,
    featured_payment_status: listing.featured_payment_status ?? null,
    featured_starts_at: listing.featured_starts_at ?? null,
    featured_expires_at: listing.featured_expires_at ?? null,
    contact_name: listing.contact_name ?? null,
    contact_phone: listing.contact_phone ?? null,
    contact_whatsapp: listing.contact_whatsapp ?? null,
    contact_email: listing.contact_email ?? null,
    contact_methods: listing.contact_methods ?? []
  });
}

async function getApprovedListings(): Promise<Property[]> {
  try {
    const supabase = createClient();
    const data = await fetchApprovedListingRows(supabase, { withContact: false });
    return orderListingsForDisplay((data as unknown as PublicListingRow[]).map(toProperty));
  } catch {
    return [];
  }
}

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

function newsRowToArticle(row: NewsRow): NewsArticle {
  const isOldAiDraft = row.excerpt.includes('Rascunho para revisao') || row.content.includes('Rascunho gerado automaticamente');

  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: isOldAiDraft
      ? `${row.title}. Entenda por que esse tema pode influenciar o mercado imobiliario no Rio Grande do Norte.`
      : row.excerpt,
    content: row.content.split('\n').filter(Boolean),
    imageUrl: getNewsImageUrl(row.category, row.image_url, row.slug),
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    publishedAt: row.published_at
  };
}

async function getHomeNews(): Promise<NewsArticle[]> {
  try {
    const supabase = createClient();
    const rpc = await supabase.rpc('get_public_published_news');

    if (!rpc.error && rpc.data?.length) {
      return withUniqueNewsImages(dedupeNewsArticles((rpc.data as NewsRow[]).map(newsRowToArticle))).slice(0, 3);
    }

    const { data, error } = await supabase
      .from('news_articles')
      .select('slug,category,title,excerpt,content,image_url,source_name,source_url,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    if (error || !data?.length) return fallbackNewsArticles.slice(0, 3);
    return withUniqueNewsImages(dedupeNewsArticles((data as NewsRow[]).map(newsRowToArticle))).slice(0, 3);
  } catch {
    return fallbackNewsArticles.slice(0, 3);
  }
}

export default async function HomePage() {
  const approvedListings = await getApprovedListings();
  const newsArticles = await getHomeNews();
  const featured = orderListingsForDisplay(
    approvedListings.filter((listing) => listing.featuredPlan)
  ).slice(0, 10);

  return (
    <main>
      <HeroSearch />

      <section className="border-b border-sand-200 bg-white py-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 sm:px-6">
          <span className="mr-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Buscas populares
          </span>
          {SEO_INTENT_PAGES.slice(0, 6).map((page) => (
            <Link
              key={page.slug}
              href={`/imoveis/${page.slug}`}
              className="rounded-full border border-ocean-200 bg-ocean-50 px-4 py-2 text-xs font-semibold text-ocean-800 transition hover:bg-ocean-100 dark:border-ocean-900 dark:bg-ocean-950/30 dark:text-ocean-100"
            >
              {page.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-padding">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Imoveis em destaque</h2>
            <Link href="/imoveis" className="text-sm font-semibold text-ocean-700">
              Ver todos
            </Link>
          </div>
          {featured.length > 0 ? (
            <FeaturedCarousel items={featured} />
          ) : (
            <div className="glass-card mt-6 p-6 text-sm text-slate-600 dark:text-slate-300">
              Nenhum imovel publicado ainda.
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-white dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl items-center gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden border border-sand-200 bg-sand-100 dark:border-slate-800 dark:bg-slate-900">
            <img
              src={agencyMatchImage.src}
              alt="Sala de imovel preparada para venda"
              className="h-[300px] w-full object-cover object-[50%_30%] sm:h-[380px]"
            />
          </div>
          <div className="border border-sand-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 lg:-ml-12">
            <h2 className="text-2xl font-semibold leading-tight text-ocean-700 dark:text-ocean-300 sm:text-3xl">
              Recomendamos as imobiliarias mais adequadas para vender ou alugar seu imovel
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              A Potilar ajuda voce a divulgar o anuncio e encontrar corretores ou imobiliarias do RN quando precisar de
              apoio profissional.
            </p>
            <Link href="/anunciar" className="mt-6 inline-flex text-base font-bold text-ocean-700 hover:text-ocean-900">
              Anunciar meu imovel
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-sand-100/70 dark:bg-slate-900">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold text-ocean-700 dark:text-ocean-300">
              Busca por mapa
            </h2>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
              Encontre imoveis pela regiao que voce procura.
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Veja os anuncios publicados no Rio Grande do Norte e use a localizacao para comparar cidades, bairros e
              oportunidades com mais clareza.
            </p>
            <Link
              href="/imoveis#mapa"
              className="mt-6 inline-flex rounded-full bg-sun-500 px-6 py-3 text-sm font-semibold text-white shadow-soft"
            >
              Ver imoveis no mapa
            </Link>
          </div>
          <div className="hidden md:block">
            <PropertyMap items={approvedListings} height="360px" />
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl md:hidden">
          <MobilePropertyMapToggle items={approvedListings} height="360px" />
        </div>
      </section>

      <section className="section-padding bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="border-b border-sand-200 pb-4 dark:border-slate-800">
            <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">
              Potilar<span className="text-slate-500">/noticias</span>
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              Noticias e orientacoes sobre mercado imobiliario, aluguel, compra e seguranca no RN.
            </p>
            <div className="mt-5 flex flex-wrap gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
              <span className="border-b-4 border-ocean-700 pb-3 text-ocean-700">Noticias destacadas</span>
              <span>Imobiliario</span>
              <span>Financiamento</span>
              <span>Temporada</span>
              <span>Seguranca</span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {newsArticles.map((article) => (
              <article key={article.slug} className="border border-sand-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <img src={article.imageUrl} alt="" className="h-44 w-full object-cover" />
                <div className="p-5">
                  {formatNewsDate(article.publishedAt) && (
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ocean-600">
                      {formatNewsDate(article.publishedAt)}
                    </p>
                  )}
                  <h3 className="text-xl font-semibold leading-snug text-slate-950 dark:text-white">{article.title}</h3>
                  <Link href={`/noticias/${article.slug}`} className="mt-6 inline-flex text-base font-bold text-ocean-700">
                    Ler mais
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/noticias" className="text-lg font-bold text-ocean-700">
              Ver mais noticias imobiliarias
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="mx-auto max-w-6xl rounded-3xl bg-ocean-700 px-6 py-10 text-white shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Quer divulgar seu imovel?</h3>
              <p className="mt-2 text-sm text-sand-100">Publique seu anuncio e fale diretamente com interessados.</p>
            </div>
            <Link href="/anunciar" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ocean-700">
              Anunciar meu imovel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
