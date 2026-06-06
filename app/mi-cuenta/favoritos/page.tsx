import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/data/properties';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty } from '@/lib/listings';
import PropertyCard from '@/components/PropertyCard';

export const metadata: Metadata = {
  title: 'Meus favoritos | Potilar'
};

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
    properties = data.map((listing: any) => listingRowToProperty(listing));
  }

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Minha conta</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Meus favoritos</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Anuncios salvos na sua conta Potilar, sincronizados entre dispositivos.
            </p>
          </div>
          <Link href="/mi-cuenta" className="rounded-full border border-sand-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Voltar para minha conta
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum favorito salvo ainda</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Toque no coracao dos anuncios para guarda-los aqui.
            </p>
            <Link href="/imoveis" className="mt-4 inline-flex rounded-full bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
              Ver imoveis
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
