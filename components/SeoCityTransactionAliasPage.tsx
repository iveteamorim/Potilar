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
import CitySeoContent from '@/components/CitySeoContent';

type Props = {
  cityName: string;
  citySlug: string;
  transaction: 'Aluguel' | 'Compra';
  path: string;
  title: string;
  description: string;
  propertyType?: 'Casa';
};

function cityFromLocation(location: string) {
  return location.split(',')[0]?.trim() || location.trim();
}

async function getListings(citySlug: string, transaction: Props['transaction'], propertyType?: Props['propertyType']) {
  try {
    const supabase = createClient();
    const rows = (await fetchApprovedListingRows(supabase, { withContact: false })) as ListingRow[];
    const listings = rows.map((row) => listingRowToProperty(row));
    const enriched = await enrichPublicListings(supabase, listings);

    return orderListingsForDisplay(
      enriched.filter((listing) => {
        if (slugify(cityFromLocation(listing.location)) !== citySlug) return false;
        if (listing.transaction !== transaction) return false;
        if (propertyType && listing.propertyType !== propertyType) return false;
        return true;
      })
    );
  } catch {
    return [];
  }
}

export default async function SeoCityTransactionAliasPage({
  cityName,
  citySlug,
  transaction,
  path,
  title,
  description,
  propertyType
}: Props) {
  const listings = await getListings(citySlug, transaction, propertyType);
  const pageUrl = `${BASE_URL}${path}`;
  const searchHref = `/imoveis?transaction=${encodeURIComponent(transaction)}&city=${encodeURIComponent(cityName)}${propertyType ? `&propertyType=${encodeURIComponent(propertyType)}` : ''}`;
  const actionLabel = transaction === 'Aluguel' ? 'alugar' : 'comprar';
  const propertyLabel = propertyType ? propertyType.toLowerCase() : 'imóvel';
  const faqItems = [
    {
      question: `Onde ${actionLabel} ${propertyLabel} em ${cityName}, RN?`,
      answer: `A Potilar organiza anúncios de ${propertyLabel}s em ${cityName}, Rio Grande do Norte, com busca por cidade, fotos, mapa e contato direto com anunciantes.`
    },
    {
      question: `Como anunciar ${propertyLabel} em ${cityName}?`,
      answer: `Anunciantes podem publicar na Potilar informando cidade, tipo de imóvel, preço, fotos e contato. A página ajuda pessoas que pesquisam imóveis em ${cityName} a encontrar oportunidades locais.`
    }
  ];

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
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      }
    ]
  };

  return (
    <main className="section-padding">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Busca local no RN</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={searchHref} className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
              Ver anúncios
            </Link>
            <Link href={`/anunciar?cidade=${encodeURIComponent(cityName)}${propertyType ? `&imovel=${propertyType}` : ''}`} className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700">
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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Ainda não há anúncios nesta busca em {cityName}</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              A Potilar está crescendo cidade por cidade no Rio Grande do Norte. Publique o primeiro anúncio ou veja todos os imóveis disponíveis em {cityName}.
            </p>
            <Link href={getCityPagePath(cityName)} className="inline-flex rounded-2xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white">
              Ver todos em {cityName}
            </Link>
          </section>
        )}

        <CitySeoContent cityName={cityName} variant={transaction === 'Aluguel' ? 'rent' : 'house-sale'} />
      </div>
    </main>
  );
}
