import Link from 'next/link';
import FavoriteAwarePropertyList from '@/components/FavoriteAwarePropertyList';
import PropertyMap from '@/components/PropertyMapLoader';
import { getCityPagePath } from '@/lib/cityPages';
import { BASE_URL } from '@/lib/config';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { enrichPublicListings } from '@/lib/advertiserProfiles';
import { listingRowToProperty, type ListingRow } from '@/lib/listings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import { slugify } from '@/lib/slugify';
import { createClient } from '@/lib/supabase/server';

type SeoCityHouseAliasPageProps = {
  cityName: string;
  citySlug: string;
  mode: 'alugar' | 'comprar';
};

function cityFromLocation(location: string) {
  return location.split(',')[0]?.trim() || location.trim();
}

async function getListings(citySlug: string, mode: 'alugar' | 'comprar') {
  try {
    const supabase = createClient();
    const rows = (await fetchApprovedListingRows(supabase, { withContact: false })) as ListingRow[];
    const listings = rows.map((row) => listingRowToProperty(row));
    const enriched = await enrichPublicListings(supabase, listings);
    const transaction = mode === 'alugar' ? 'Aluguel' : 'Compra';

    return orderListingsForDisplay(
      enriched.filter((listing) => {
        if (slugify(cityFromLocation(listing.location)) !== citySlug) return false;
        if (listing.propertyType !== 'Casa') return false;
        if (listing.transaction !== transaction) return false;
        return true;
      })
    );
  } catch {
    return [];
  }
}

export function getCityHouseAliasPath(cityName: string, mode: 'alugar' | 'comprar') {
  return `/${mode === 'alugar' ? 'alugar' : 'comprar'}-casa-em/${slugify(cityName)}`;
}

export default async function SeoCityHouseAliasPage({ cityName, citySlug, mode }: SeoCityHouseAliasPageProps) {
  const listings = await getListings(citySlug, mode);
  const action = mode === 'alugar' ? 'Alugar' : 'Comprar';
  const title = `${action} casa em ${cityName}, RN`;
  const description =
    mode === 'alugar'
      ? `Casas para alugar em ${cityName}, Rio Grande do Norte. Veja anúncios com fotos, preço, mapa e contato direto na Potilar.`
      : `Casas para comprar em ${cityName}, Rio Grande do Norte. Veja casas a venda com fotos, preço, mapa e contato direto na Potilar.`;
  const pageUrl = `${BASE_URL}${getCityHouseAliasPath(cityName, mode)}`;
  const searchHref =
    mode === 'alugar'
      ? `/imoveis?propertyType=Casa&transaction=Aluguel&city=${encodeURIComponent(cityName)}`
      : `/imoveis?propertyType=Casa&transaction=Compra&city=${encodeURIComponent(cityName)}`;

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
        url: pageUrl
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
              Ver casas
            </Link>
            <Link href={`/anunciar?cidade=${encodeURIComponent(cityName)}&imovel=Casa`} className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700">
              Anunciar casa em {cityName}
            </Link>
          </div>
        </section>

        {listings.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Casas em {cityName}</h2>
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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Ainda não há casas nesta busca em {cityName}</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Publique o primeiro anúncio ou veja todos os imóveis disponíveis em {cityName}.
            </p>
            <Link href={getCityPagePath(cityName)} className="inline-flex rounded-2xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white">
              Ver todos em {cityName}
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
