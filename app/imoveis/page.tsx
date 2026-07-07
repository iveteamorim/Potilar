import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PropertyFilters from '@/components/PropertyFilters';
import PaginatedPropertyList from '@/components/PaginatedPropertyList';
import PropertyMap from '@/components/PropertyMapLoader';
import MobileListingsControls from '@/components/MobileListingsControls';
import SaveSearchAlert from '@/components/SaveSearchAlert';
import MapModalButton from '@/components/MapModalButton';
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
  video_url?: string | null;
  featured_plan?: '7_days' | '30_days' | 'super_30_days' | null;
  featured_payment_status?: 'not_requested' | 'pix_pending' | 'confirmed' | null;
  featured_starts_at?: string | null;
  featured_expires_at?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  contact_methods?: string[] | null;
  condo_included?: boolean | null;
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
    const furnished = searchParams.furnished === '1';
    const condoIncluded = searchParams.condoIncluded === '1';
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
    if (furnished && !property.isFurnished) return false;
    if (condoIncluded && !property.condoIncluded) return false;
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

function buildTransactionHref(
  searchParams: { [key: string]: string | string[] | undefined },
  transaction: '' | 'Compra' | 'Aluguel'
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === 'transaction' || key === 'page') return;
    if (typeof value === 'string' && value) params.set(key, value);
  });

  if (transaction) params.set('transaction', transaction);
  const query = params.toString();
  return query ? `/imoveis?${query}` : '/imoveis';
}

function TransactionTabs({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const current = typeof searchParams.transaction === 'string' ? searchParams.transaction : '';
  const tabs = [
    ['', 'Todos'],
    ['Aluguel', 'Alugar'],
    ['Compra', 'Comprar']
  ] as const;

  return (
    <div className="grid grid-cols-3 rounded-2xl border border-sand-200 bg-white p-1 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:inline-flex sm:gap-8 sm:border-0 sm:bg-transparent sm:p-0 sm:text-left sm:shadow-none">
      {tabs.map(([value, label]) => {
        const active =
          current === value ||
          (!current && value === '') ||
          (value === 'Aluguel' && current === 'Temporada');
        return (
          <Link
            key={label}
            href={buildTransactionHref(searchParams, value)}
            className={`inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-extrabold transition sm:min-w-24 sm:rounded-none sm:border-b-4 sm:px-1 sm:pb-4 sm:pt-2 sm:text-base ${
              active
                ? 'bg-ocean-700 text-white sm:border-ocean-700 sm:bg-transparent sm:text-ocean-700'
                : 'text-slate-500 hover:bg-ocean-50 hover:text-ocean-700 sm:border-transparent sm:hover:border-ocean-200 sm:hover:bg-transparent dark:text-slate-300'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
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
    contact_methods: listing.contact_methods ?? [],
    video_url: listing.video_url ?? null,
    condo_included: listing.condo_included ?? false
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
    <main className="border-t border-sand-200 bg-sand-50/40 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-4 overflow-y-auto pr-2">
              <Suspense fallback={null}>
                <SaveSearchAlert />
              </Suspense>
              <div id="mapa" className="relative overflow-hidden rounded-lg border border-sand-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <PropertyMap items={filtered} height="390px" />
                <MapModalButton items={filtered} floating />
              </div>
              <PropertyFilters />
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-2xl border border-sand-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ocean-700 dark:text-ocean-300">Busca no RN</p>
                  <h1 className="mt-1.5 font-sans text-2xl font-extrabold tracking-normal text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">
                    Imóveis no RN
                  </h1>
                  <p className="mt-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 sm:mt-2">
                    {filtered.length} anúncios encontrados
                  </p>
                </div>
                <TransactionTabs searchParams={searchParams} />
              </div>
            </div>
            <MobileListingsControls items={filtered} />
            <div className="lg:hidden">
              <Suspense fallback={null}>
                <SaveSearchAlert />
              </Suspense>
            </div>
            <Suspense fallback={<div className="glass-card h-40 animate-pulse" />}>
              <PaginatedPropertyList items={filtered} variant="horizontal" />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}


