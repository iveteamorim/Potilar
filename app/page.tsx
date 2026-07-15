import HeroSearch from '@/components/HeroSearch';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import PropertyMap from '@/components/PropertyMapLoader';
import MobilePropertyMapToggle from '@/components/MobilePropertyMapToggle';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty } from '@/lib/listings';
import { enrichPublicListings } from '@/lib/advertiserProfiles';
import { getHomeFeaturedListings } from '@/lib/homeFeaturedListings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import type { Property } from '@/data/properties';
import Link from 'next/link';
import { getFreeListingLimit, getLaunchPromoDeadlineLabel, isLaunchPromoActive } from '@/lib/plans';
import { POTILAR_DEFINITION } from '@/lib/siteIdentity';
import agencyMatchImage from '@/components/ayudamosencontrarimobiliaria.jpg';
import { dedupeNewsArticles, fallbackNewsArticles, formatNewsDate, getNewsImageUrl, withUniqueNewsImages, type NewsArticle } from '@/data/news';


export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    absolute: 'Potilar | Imóveis no Rio Grande do Norte'
  },
  description:
    'Encontre e anuncie casas, apartamentos, terrenos, aluguéis e temporada no Rio Grande do Norte com contato direto.',
  alternates: {
    canonical: '/'
  }
};

type PublicListingRow = {
  id: string;
  owner_id?: string | null;
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
    owner_id: listing.owner_id ?? null,
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
    const properties = orderListingsForDisplay((data as unknown as PublicListingRow[]).map(toProperty));
    try {
      return await enrichPublicListings(supabase, properties);
    } catch {
      return properties;
    }
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
  const { items: featured } = getHomeFeaturedListings(approvedListings);

  return (
    <main>
      <HeroSearch />

      <section className="border-b border-sand-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-3xl">
              Tem um imóvel no Rio Grande do Norte?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isLaunchPromoActive()
                ? 'Publique seus 2 primeiros anúncios grátis na Potilar.'
                : 'Anuncie seu primeiro imóvel grátis na Potilar.'}
            </p>
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <Link
              href="/anunciar"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-ocean-700 px-6 py-4 text-sm font-bold text-white shadow-soft transition hover:bg-ocean-800 sm:w-auto"
            >
              Anunciar imóvel grátis
            </Link>
            <a
              href={`https://wa.me/5521969724141?text=${encodeURIComponent('Olá, vim pelo site Potilar e quero ajuda para anunciar meu imóvel.')}`}
              target="_blank"
              rel="noreferrer"
              className="block text-xs font-semibold text-ocean-700 underline-offset-4 hover:underline dark:text-ocean-300"
            >
              Quero ajuda para anunciar meu imóvel
            </a>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Imóveis em destaque</h2>
            <Link href="/imoveis" className="text-sm font-semibold text-ocean-700">
              Ver todos
            </Link>
          </div>
          {featured.length > 0 ? (
            <FeaturedCarousel items={featured} />
          ) : approvedListings.length > 0 ? (
            <div className="glass-card mt-6 p-6 text-sm text-slate-600 dark:text-slate-300">
              Nenhum imóvel em destaque no momento.
            </div>
          ) : (
            <div className="glass-card mt-6 p-6 text-sm text-slate-600 dark:text-slate-300">
              Nenhum imóvel publicado ainda.
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-white dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl items-center gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden border border-sand-200 bg-sand-100 dark:border-slate-800 dark:bg-slate-900">
            <img
              src={agencyMatchImage.src}
              alt="Sala de imóvel preparada para venda"
              className="h-[300px] w-full object-cover object-[50%_30%] sm:h-[380px]"
            />
          </div>
          <div className="border border-sand-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 lg:-ml-12">
            <h2 className="text-2xl font-semibold leading-tight text-ocean-700 dark:text-ocean-300 sm:text-3xl">
              Recomendamos as imobiliárias mais adequadas para vender ou alugar seu imóvel
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              A Potilar ajuda você a divulgar o anúncio e encontrar corretores ou imobiliárias do RN quando precisar de
              apoio profissional.
            </p>
            <Link href="/anunciar" className="mt-6 inline-flex text-base font-bold text-ocean-700 hover:text-ocean-900">
              Anunciar meu imóvel
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
              Encontre imóveis pela região que você procura.
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Veja os anúncios publicados no Rio Grande do Norte e use a localização para comparar cidades, bairros e
              oportunidades com mais clareza.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/imoveis?transaction=Compra#mapa"
                className="inline-flex min-w-32 justify-center rounded-full bg-sun-500 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-sun-600"
              >
                Comprar
              </Link>
              <Link
                href="/imoveis?transaction=Aluguel#mapa"
                className="inline-flex min-w-32 justify-center rounded-full border border-ocean-700 bg-white px-6 py-3 text-sm font-semibold text-ocean-700 shadow-soft transition hover:border-ocean-900 hover:text-ocean-900 dark:border-ocean-300 dark:bg-slate-950 dark:text-ocean-200"
              >
                Alugar
              </Link>
              <Link
                href="/imoveis#mapa"
                className="inline-flex min-w-32 justify-center rounded-full border border-sand-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-ocean-300 hover:text-ocean-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Ver todos
              </Link>
            </div>
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
              Notícias e orientações sobre mercado imobiliário, aluguel, compra e segurança no RN.
            </p>
            <div className="mt-5 flex flex-wrap gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
              <span className="border-b-4 border-ocean-700 pb-3 text-ocean-700">Notícias destacadas</span>
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
              Ver mais notícias imobiliárias
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-sand-200 bg-sand-50/70 py-6 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Sobre a Potilar</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">{POTILAR_DEFINITION}</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="mx-auto max-w-6xl rounded-3xl bg-ocean-700 px-6 py-10 text-white shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Quer divulgar seu imóvel?</h3>
              <p className="mt-2 text-sm text-sand-100">Publique seu anúncio e fale diretamente com interessados.</p>
            </div>
            <Link href="/anunciar" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ocean-700">
              Anunciar meu imóvel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
