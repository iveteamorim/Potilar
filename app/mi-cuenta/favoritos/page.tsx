import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/data/properties';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty } from '@/lib/listings';
import { enrichPublicListings } from '@/lib/advertiserProfiles';
import { getListingHref } from '@/lib/listingUrls';
import AccountTabs from '@/components/AccountTabs';

export const metadata: Metadata = {
  title: 'Meus favoritos | Potilar'
};

function formatPrice(property: Property) {
  const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.price);
  if (property.transaction === 'Aluguel') return `${price} / mes`;
  if (property.transaction === 'Temporada') return `${price} / ${property.pricePeriod ?? 'dia'}`;
  return price;
}

export default async function FavoritosPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta/favoritos');

  const { data: favoriteRows } = await supabase.from('listing_favorites').select('listing_id').eq('user_id', user.id);
  const favoriteIds = (favoriteRows ?? []).map((row) => row.listing_id);

  let properties: Property[] = [];

  if (favoriteIds.length > 0) {
    const data = await fetchApprovedListingRows(supabase, {
      withContact: false,
      listingIds: favoriteIds
    });
    properties = await enrichPublicListings(supabase, data.map((listing: any) => listingRowToProperty(listing)));
  }

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Meus favoritos</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Anuncios salvos na sua conta Potilar, sincronizados entre dispositivos.
            </p>
          </div>
        </div>

        <AccountTabs active="favoritos" />

        {properties.length > 0 ? (
          <div className="grid gap-4">
            {properties.map((property) => {
              const image = property.images[0];

              return (
                <article key={property.id} className="grid gap-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center">
                  <Link href={getListingHref(property)} className="relative block h-32 overflow-hidden rounded-xl bg-sand-100 sm:h-28">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={property.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Sem foto</span>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-sun-100 px-3 py-1 text-sun-700">{property.transaction}</span>
                      <span className="rounded-full bg-sand-100 px-3 py-1 text-slate-700">{property.propertyType}</span>
                    </div>
                    <Link href={getListingHref(property)} className="mt-2 block text-xl font-bold leading-tight text-ocean-800 hover:text-ocean-950">
                      {property.title}
                    </Link>
                    <p className="mt-1 text-sm font-medium text-slate-500">{property.location}</p>
                    <p className="mt-3 text-lg font-bold text-ocean-950 dark:text-white">{formatPrice(property)}</p>
                  </div>
                  <Link href={getListingHref(property)} className="inline-flex h-11 items-center justify-center rounded-xl border border-ocean-200 bg-white px-5 text-sm font-bold text-ocean-800 shadow-sm hover:border-ocean-500">
                    Ver anúncio
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum favorito salvo ainda</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Toque no coração dos anúncios para guardá-los aqui.
            </p>
            <Link href="/imoveis" className="mt-4 inline-flex rounded-full bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
              Ver imóveis
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
