import { Suspense } from 'react';
import type { Metadata } from 'next';
import PropertyFilters from '@/components/PropertyFilters';
import PaginatedPropertyList from '@/components/PaginatedPropertyList';
import PropertyMap from '@/components/PropertyMapLoader';
import MobileListingsControls from '@/components/MobileListingsControls';
import SaveSearchAlert from '@/components/SaveSearchAlert';
import { createClient } from '@/lib/supabase/server';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty } from '@/lib/listings';
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

export const metadata: Metadata = {
  title: 'Imoveis no RN',
  description: 'Encontre casas, apartamentos, terrenos, alugueis e imoveis de temporada no Rio Grande do Norte.',
  alternates: {
    canonical: '/imoveis'
  },
  openGraph: {
    title: 'Imoveis no RN | Potilar',
    description: 'Busque imoveis no Rio Grande do Norte por cidade, tipo, preco e negociacao.',
    url: '/imoveis'
  }
};

function normalizeFilterText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function applyFilters(items: Property[], searchParams: { [key: string]: string | string[] | undefined }) {
  const filtered = items.filter((property) => {
    const minPrice = Number(searchParams.minPrice ?? 0);
    const maxPrice = Number(searchParams.maxPrice ?? 0);
    const bedrooms = Number(searchParams.bedrooms ?? 0);
    const bathrooms = Number(searchParams.bathrooms ?? 0);
    const parking = Number(searchParams.parking ?? 0);
    const minArea = Number(searchParams.minArea ?? 0);
    const petFriendly = searchParams.petFriendly === '1';
    const propertyType = typeof searchParams.propertyType === 'string' ? searchParams.propertyType : '';
    const transaction = typeof searchParams.transaction === 'string' ? searchParams.transaction : '';
    const city = typeof searchParams.city === 'string' ? searchParams.city : '';
    const q = typeof searchParams.q === 'string' ? normalizeFilterText(searchParams.q) : '';
    const haystack = normalizeFilterText(
      [
        property.title,
        property.location,
        property.neighborhood,
        property.community,
        property.addressExtra,
        property.description,
        property.features.join(' ')
      ]
        .filter(Boolean)
        .join(' ')
    );

    if (minPrice && property.price < minPrice) return false;
    if (maxPrice && property.price > maxPrice) return false;
    if (bedrooms && property.bedrooms < bedrooms) return false;
    if (bathrooms && property.bathrooms < bathrooms) return false;
    if (parking && property.parking < parking) return false;
    if (minArea && (property.areaSqm ?? 0) < minArea) return false;
    if (petFriendly && !property.isPetFriendly) return false;
    if (propertyType && property.propertyType !== propertyType) return false;
    if (transaction && property.transaction !== transaction) return false;
    if (city && !normalizeFilterText(property.location).includes(normalizeFilterText(city))) return false;
    if (q && !haystack.includes(q)) return false;
    return true;
  });

  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : '';
  if (sort === 'price-asc') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }
  if (sort === 'price-desc') {
    return [...filtered].sort((a, b) => b.price - a.price);
  }
  return orderListingsForDisplay(filtered);
}

function PropertyFiltersSkeleton() {
  return (
    <div className="glass-card animate-pulse space-y-4 p-4 sm:p-6">
      <div className="h-12 rounded-2xl bg-sand-200 dark:bg-slate-800" />
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 rounded-2xl bg-sand-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
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

export default async function ImoveisPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let approvedListings: Property[] = [];

  try {
    const supabase = createClient();
    const data = await fetchApprovedListingRows(supabase, { withContact: false });
    approvedListings = orderListingsForDisplay((data as unknown as PublicListingRow[]).map(toProperty));
  } catch {
    approvedListings = [];
  }

  const filtered = applyFilters(approvedListings, searchParams);

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">Imoveis</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.65fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Resultados</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {filtered.length} anuncios encontrados.
              </p>
            </div>
            <Suspense fallback={null}>
              <SaveSearchAlert />
            </Suspense>
            <MobileListingsControls items={filtered} />
            <Suspense fallback={<div className="glass-card h-40 animate-pulse" />}>
              <PaginatedPropertyList items={filtered} />
            </Suspense>
          </div>
          <div className="hidden space-y-4 lg:block">
            <div className="hidden lg:block">
              <PropertyFilters />
            </div>
            <div id="mapa" className="scroll-mt-24 lg:sticky lg:top-24">
              <PropertyMap items={filtered} height="420px" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
