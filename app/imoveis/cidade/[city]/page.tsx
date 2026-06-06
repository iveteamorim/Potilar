import type { Metadata } from 'next';
import Link from 'next/link';
import FavoriteAwarePropertyList from '@/components/FavoriteAwarePropertyList';
import PropertyMap from '@/components/PropertyMapLoader';
import { BASE_URL } from '@/lib/config';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty } from '@/lib/listings';
import { slugify } from '@/lib/slugify';
import { createClient } from '@/lib/supabase/server';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import type { Property } from '@/data/properties';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

function titleFromSlug(value: string) {
  return decodeURIComponent(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const citySlug = params.city;
  const listings = await getCityListings(citySlug);
  const cityName = listings[0] ? cityFromLocation(listings[0].location) : titleFromSlug(citySlug);

  return {
    title: `Imoveis em ${cityName}`,
    description: `Encontre casas, apartamentos, terrenos, alugueis e temporada em ${cityName}, RN, pela Potilar.`,
    alternates: {
      canonical: `${BASE_URL}/imoveis/cidade/${citySlug}`
    },
    openGraph: {
      title: `Imoveis em ${cityName} | Potilar`,
      description: `Anuncios de imoveis em ${cityName}, Rio Grande do Norte, com contato direto.`,
      url: `${BASE_URL}/imoveis/cidade/${citySlug}`
    }
  };
}

export default async function CityListingsPage({ params }: { params: { city: string } }) {
  const listings = await getCityListings(params.city);
  const cityName = listings[0] ? cityFromLocation(listings[0].location) : titleFromSlug(params.city);

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Imoveis no RN</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
            Imoveis em {cityName}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Veja casas, apartamentos, terrenos, alugueis e temporada publicados em {cityName}, Rio Grande do Norte.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/imoveis" className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700">
              Ver todos os imoveis
            </Link>
            <Link href="/anunciar" className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
              Anunciar meu imovel
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Anuncios em {cityName}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {listings.length} anuncios encontrados.
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
      </div>
    </main>
  );
}
