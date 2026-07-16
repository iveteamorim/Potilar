import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FavoriteAwarePropertyList from '@/components/FavoriteAwarePropertyList';
import PropertyMap from '@/components/PropertyMapLoader';
import { BASE_URL } from '@/lib/config';
import {
  FEATURED_CITY_NAMES,
  getCityPagePath,
  isKnownCitySlug,
  resolveCityNameFromSlug
} from '@/lib/cityPages';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty, type ListingRow } from '@/lib/listings';
import { enrichPublicListings } from '@/lib/advertiserProfiles';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import {
  SEO_INTENT_PAGES,
  getCityIntentSeoDescription,
  getCityIntentSeoTitle,
  getCitySeoIntentPath,
  getSeoIntentPage
} from '@/lib/seoIntentPages';
import { slugify } from '@/lib/slugify';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 300;

function cityFromLocation(location: string) {
  return location.split(',')[0]?.trim() || location.trim();
}

async function getListings(citySlug: string, intentSlug: string) {
  const intent = getSeoIntentPage(intentSlug);
  if (!intent) return [];

  try {
    const supabase = createClient();
    const rows = (await fetchApprovedListingRows(supabase, { withContact: false })) as ListingRow[];
    const listings = rows.map((row) => listingRowToProperty(row));
    const enriched = await enrichPublicListings(supabase, listings);

    return orderListingsForDisplay(
      enriched.filter((listing) => {
        if (slugify(cityFromLocation(listing.location)) !== citySlug) return false;
        if (intent.propertyType && listing.propertyType !== intent.propertyType) return false;
        if (intent.transaction && listing.transaction !== intent.transaction) return false;
        return true;
      })
    );
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  return FEATURED_CITY_NAMES.flatMap((cityName) =>
    SEO_INTENT_PAGES.map((intent) => ({
      city: slugify(cityName),
      intent: intent.slug
    }))
  );
}

export async function generateMetadata({
  params
}: {
  params: { city: string; intent: string };
}): Promise<Metadata> {
  if (!isKnownCitySlug(params.city)) return { title: 'Cidade não encontrada' };
  const cityName = resolveCityNameFromSlug(params.city)!;
  const intent = getSeoIntentPage(params.intent);
  if (!intent) return { title: 'Busca não encontrada' };

  const listings = await getListings(params.city, params.intent);
  const title = getCityIntentSeoTitle(cityName, intent);
  const description = getCityIntentSeoDescription(cityName, intent, listings.length);
  const canonical = `${BASE_URL}${getCitySeoIntentPath(cityName, intent.slug)}`;

  return {
    title,
    description,
    keywords: [
      `${intent.title.toLowerCase()} ${cityName}`,
      `${intent.title.toLowerCase()} ${cityName} RN`,
      `imoveis em ${cityName}`,
      `aluguel ${cityName}`,
      `venda ${cityName}`,
      'Potilar'
    ],
    alternates: {
      canonical
    },
    openGraph: {
      title: `${title} | Potilar`,
      description,
      url: canonical,
      type: 'website'
    }
  };
}

export default async function CityIntentPage({ params }: { params: { city: string; intent: string } }) {
  if (!isKnownCitySlug(params.city)) notFound();
  const cityName = resolveCityNameFromSlug(params.city)!;
  const intent = getSeoIntentPage(params.intent);
  if (!intent) notFound();

  const listings = await getListings(params.city, params.intent);
  const pageUrl = `${BASE_URL}${getCitySeoIntentPath(cityName, intent.slug)}`;
  const title = getCityIntentSeoTitle(cityName, intent);
  const description = getCityIntentSeoDescription(cityName, intent, listings.length);
  const searchHref = `${intent.searchHref}&city=${encodeURIComponent(cityName)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Imóveis', item: `${BASE_URL}/imoveis` },
          { '@type': 'ListItem', position: 3, name: cityName, item: `${BASE_URL}${getCityPagePath(cityName)}` },
          { '@type': 'ListItem', position: 4, name: title, item: pageUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        name: title,
        description,
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
    <main className="section-padding">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Busca local</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={searchHref} className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
              Ver busca completa
            </Link>
            <Link
              href={getCityPagePath(cityName)}
              className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700"
            >
              Todos em {cityName}
            </Link>
            <Link
              href={`/anunciar?cidade=${encodeURIComponent(cityName)}`}
              className="rounded-2xl border border-sand-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Anunciar em {cityName}
            </Link>
          </div>
        </section>

        {listings.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Anúncios em {cityName}</h2>
              <FavoriteAwarePropertyList items={listings} />
            </section>
            <aside className="glass-card h-fit p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mapa em {cityName}</h2>
              <div className="mt-4">
                <PropertyMap items={listings} height="420px" />
              </div>
            </aside>
          </div>
        ) : (
          <section className="glass-card space-y-4 p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Ainda não há anúncios nesta busca em {cityName}
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              A Potilar está ampliando o inventário no interior do RN. Publique o primeiro anúncio nesta cidade ou veja
              todos os imóveis disponíveis em {cityName}.
            </p>
            <Link
              href={`/anunciar?cidade=${encodeURIComponent(cityName)}`}
              className="inline-flex rounded-2xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Anunciar em {cityName}
            </Link>
          </section>
        )}

        <section className="rounded-3xl border border-sand-200 bg-sand-50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Outras buscas em {cityName}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEO_INTENT_PAGES.slice(0, 6).map((related) => (
              <Link
                key={related.slug}
                href={getCitySeoIntentPath(cityName, related.slug)}
                className="rounded-full border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700"
              >
                {related.title.replace(' no RN', '')}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
