import Link from 'next/link';
import FavoriteAwarePropertyList from '@/components/FavoriteAwarePropertyList';
import PropertyMap from '@/components/PropertyMapLoader';
import { BASE_URL } from '@/lib/config';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { enrichPublicListings } from '@/lib/advertiserProfiles';
import { listingRowToProperty, type ListingRow } from '@/lib/listings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import type { SeoIntentPage } from '@/lib/seoIntentPages';
import { createClient } from '@/lib/supabase/server';

async function getListings(page: SeoIntentPage) {
  try {
    const supabase = createClient();
    const rows = (await fetchApprovedListingRows(supabase, { withContact: false })) as ListingRow[];
    const listings = rows.map((row) => listingRowToProperty(row));
    const enriched = await enrichPublicListings(supabase, listings);
    return orderListingsForDisplay(
      enriched.filter((listing) => {
        if (page.propertyType && listing.propertyType !== page.propertyType) return false;
        if (page.transaction && listing.transaction !== page.transaction) return false;
        return true;
      })
    );
  } catch {
    return [];
  }
}

export default async function SeoIntentListingPage({ page, pagePath }: { page: SeoIntentPage; pagePath?: string }) {
  const listings = await getListings(page);
  const pageUrl = `${BASE_URL}${pagePath ?? `/imoveis/${page.slug}`}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Imóveis', item: `${BASE_URL}/imoveis` },
          { '@type': 'ListItem', position: 3, name: page.h1, item: pageUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        name: page.h1,
        description: page.description,
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Imóveis no RN</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{page.h1}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{page.intro}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={page.searchHref} className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
              Ver anúncios
            </Link>
            <Link
              href="/imoveis/cidades"
              className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700"
            >
              Buscar por cidade
            </Link>
            <Link
              href="/anunciar"
              className="rounded-2xl border border-sand-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Anunciar imóvel
            </Link>
          </div>
        </section>

        {listings.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Anúncios encontrados</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {listings.length} anúncio{listings.length === 1 ? '' : 's'} nesta busca.
                </p>
              </div>
              <FavoriteAwarePropertyList items={listings} />
            </section>
            <aside className="glass-card h-fit p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mapa dos anúncios</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Veja onde estão as opções publicadas.</p>
              <div className="mt-4">
                <PropertyMap items={listings} height="420px" />
              </div>
            </aside>
          </div>
        ) : (
          <section className="glass-card space-y-4 p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Ainda não há anúncios nesta busca</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              A Potilar está crescendo no Rio Grande do Norte. Você pode buscar por cidade ou publicar o primeiro anúncio
              para esta categoria.
            </p>
            <Link href="/anunciar" className="inline-flex rounded-2xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white">
              Anunciar grátis
            </Link>
          </section>
        )}

        <section className="rounded-3xl border border-sand-200 bg-sand-50 p-6 dark:border-slate-800 dark:bg-slate-950/40">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Buscas relacionadas no RN</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/imoveis/casas-para-alugar" className="rounded-full border border-ocean-200 px-4 py-2 font-semibold text-ocean-700">
              Casas para alugar
            </Link>
            <Link href="/imoveis/casas-a-venda" className="rounded-full border border-ocean-200 px-4 py-2 font-semibold text-ocean-700">
              Casas a venda
            </Link>
            <Link href="/imoveis/apartamentos-para-alugar" className="rounded-full border border-ocean-200 px-4 py-2 font-semibold text-ocean-700">
              Apartamentos para alugar
            </Link>
            <Link href="/imoveis/terrenos-a-venda" className="rounded-full border border-ocean-200 px-4 py-2 font-semibold text-ocean-700">
              Terrenos a venda
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
