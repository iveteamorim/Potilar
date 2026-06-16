import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FavoriteAwarePropertyList from '@/components/FavoriteAwarePropertyList';
import PropertyMap from '@/components/PropertyMapLoader';
import { BASE_URL } from '@/lib/config';
import { PLANS } from '@/lib/plans';
import {
  getCityPagePath,
  getCitySeoDescription,
  getCitySeoTitle,
  getAllCitySlugs,
  isKnownCitySlug,
  resolveCityNameFromSlug
} from '@/lib/cityPages';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty } from '@/lib/listings';
import { slugify } from '@/lib/slugify';
import { createClient } from '@/lib/supabase/server';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import { SEO_INTENT_PAGES, getCitySeoIntentPath } from '@/lib/seoIntentPages';
import type { Property } from '@/data/properties';

export const revalidate = 300;

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

function cityFromLocation(location: string) {
  return location.split(',')[0]?.trim() || location.trim();
}

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

async function getApprovedListings() {
  try {
    const supabase = createClient();
    const data = await fetchApprovedListingRows(supabase, { withContact: false });
    return (data as unknown as PublicListingRow[]).map(toProperty);
  } catch {
    return [];
  }
}

async function getCityListings(citySlug: string) {
  const listings = await getApprovedListings();
  const filtered = listings.filter((listing) => slugify(cityFromLocation(listing.location)) === citySlug);
  return orderListingsForDisplay(filtered);
}

export function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const citySlug = params.city;
  if (!isKnownCitySlug(citySlug)) {
    return { title: 'Cidade nao encontrada' };
  }

  const cityName = resolveCityNameFromSlug(citySlug)!;
  const listings = await getCityListings(citySlug);
  const description = getCitySeoDescription(cityName, listings.length);
  const title = getCitySeoTitle(cityName);

  return {
    title,
    description,
    keywords: [
      `imoveis ${cityName}`,
      `aluguel ${cityName}`,
      `casas ${cityName} RN`,
      `apartamentos ${cityName}`,
      `terrenos ${cityName}`,
      `temporada ${cityName}`,
      'imoveis Rio Grande do Norte'
    ],
    alternates: {
      canonical: `${BASE_URL}/imoveis/cidade/${citySlug}`
    },
    openGraph: {
      title: `${title} | Potilar`,
      description,
      url: `${BASE_URL}/imoveis/cidade/${citySlug}`,
      type: 'website'
    }
  };
}

function CityStructuredData({
  cityName,
  citySlug,
  listingCount
}: {
  cityName: string;
  citySlug: string;
  listingCount: number;
}) {
  const pageUrl = `${BASE_URL}/imoveis/cidade/${citySlug}`;
  const payload = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Imoveis', item: `${BASE_URL}/imoveis` },
          { '@type': 'ListItem', position: 3, name: 'Cidades', item: `${BASE_URL}/imoveis/cidades` },
          { '@type': 'ListItem', position: 4, name: cityName, item: pageUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        name: getCitySeoTitle(cityName),
        description: getCitySeoDescription(cityName, listingCount),
        url: pageUrl,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Potilar',
          url: BASE_URL
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export default async function CityListingsPage({ params }: { params: { city: string } }) {
  if (!isKnownCitySlug(params.city)) {
    notFound();
  }

  const cityName = resolveCityNameFromSlug(params.city)!;
  const listings = await getCityListings(params.city);
  const anunciarHref = `/anunciar?cidade=${encodeURIComponent(cityName)}`;

  return (
    <main className="section-padding">
      <CityStructuredData cityName={cityName} citySlug={params.city} listingCount={listings.length} />

      <div className="mx-auto max-w-6xl space-y-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Imoveis no RN</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
            Imoveis em {cityName}, RN
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {getCitySeoDescription(cityName, listings.length)}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/imoveis?city=${encodeURIComponent(cityName)}`}
              className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700"
            >
              Buscar em {cityName}
            </Link>
            <Link href={anunciarHref} className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
              Anunciar em {cityName}
            </Link>
            <Link href="/imoveis/cidades" className="rounded-2xl border border-sand-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Todas as cidades
            </Link>
          </div>
        </div>

        {listings.length === 0 ? (
          <section className="glass-card space-y-4 p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Ainda nao ha anuncios publicados em {cityName}
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Seja o primeiro a anunciar casas, apartamentos, terrenos ou temporada em {cityName}. Na promocao de lancamento,
              particulares podem publicar ate {PLANS.listing.freeListingLimit} anuncios gratuitos na Potilar, com contato direto
              entre anunciante e interessado.
            </p>
            <Link href={anunciarHref} className="inline-flex rounded-2xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white">
              Anunciar gratis em {cityName}
            </Link>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Anuncios em {cityName}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {listings.length} anuncio{listings.length === 1 ? '' : 's'} encontrado{listings.length === 1 ? '' : 's'}.
                </p>
              </div>
              <FavoriteAwarePropertyList items={listings} />
            </section>

            <aside className="glass-card h-fit p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mapa em {cityName}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Explore os anuncios publicados na cidade.
              </p>
              <div className="mt-4">
                <PropertyMap items={listings} height="420px" />
              </div>
            </aside>
          </div>
        )}

        <section className="rounded-3xl border border-sand-200 bg-sand-50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Por que buscar imoveis em {cityName} na Potilar?
          </h2>
          <ul className="mt-3 grid gap-2 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <li>Portal focado no Rio Grande do Norte, com busca por cidade e mapa.</li>
            <li>Contato direto com proprietarios, corretores e imobiliarias.</li>
            <li>Aluguel, compra e temporada em um so lugar.</li>
            <li>Primeiro anuncio de particular gratuito para ajudar o mercado local.</li>
          </ul>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Voce tambem pode explorar{' '}
            <Link href={getCityPagePath('Natal')} className="font-semibold text-ocean-700">
              imoveis em Natal
            </Link>{' '}
            ou ver{' '}
            <Link href="/imoveis/cidades" className="font-semibold text-ocean-700">
              todas as cidades do RN
            </Link>
            .
          </p>
        </section>

        <section className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Buscas populares em {cityName}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEO_INTENT_PAGES.slice(0, 6).map((intent) => (
              <Link
                key={intent.slug}
                href={getCitySeoIntentPath(cityName, intent.slug)}
                className="rounded-full border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700"
              >
                {intent.title.replace(' no RN', '')}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
