import type { Metadata } from 'next';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyList from '@/components/PropertyList';
import PropertyMap from '@/components/PropertyMap';
import { properties } from '@/data/properties';
import MobileMapToggle from './mobile-map-toggle';

export const metadata: Metadata = {
  title: 'Imóveis | RN Lar',
  description: 'Explore casas, lotes e aluguéis no RN com filtros avançados e atendimento digital.',
  alternates: {
    canonical: 'https://rnlar.com.br/imoveis'
  }
};

function applyFilters(searchParams: { [key: string]: string | string[] | undefined }) {
  const filtered = properties.filter((property) => {
    const minPrice = Number(searchParams.minPrice ?? 0);
    const maxPrice = Number(searchParams.maxPrice ?? 0);
    const bedrooms = Number(searchParams.bedrooms ?? 0);
    const bathrooms = Number(searchParams.bathrooms ?? 0);
    const parking = Number(searchParams.parking ?? 0);
    const petFriendly = searchParams.petFriendly === 'true';
    const condo = searchParams.condo === 'true';
    const propertyType = typeof searchParams.propertyType === 'string' ? searchParams.propertyType : '';
    const transaction = typeof searchParams.transaction === 'string' ? searchParams.transaction : '';
    const city = typeof searchParams.city === 'string' ? searchParams.city : '';

    if (minPrice && property.price < minPrice) return false;
    if (maxPrice && property.price > maxPrice) return false;
    if (bedrooms && property.bedrooms < bedrooms) return false;
    if (bathrooms && property.bathrooms < bathrooms) return false;
    if (parking && property.parking < parking) return false;
    if (petFriendly && !property.isPetFriendly) return false;
    if (condo && !property.condoFee) return false;
    if (propertyType && property.propertyType !== propertyType) return false;
    if (transaction && property.transaction !== transaction) return false;
    if (city && !property.location.startsWith(city)) return false;
    return true;
  });

  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : '';
  if (sort === 'price-asc') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }
  if (sort === 'price-desc') {
    return [...filtered].sort((a, b) => b.price - a.price);
  }
  return filtered;
}

export default function ImoveisPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filtered = applyFilters(searchParams);

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Imóveis</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Lista completa de imóveis</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Use filtros avançados para encontrar casas, lotes e aluguéis dentro do seu orçamento.
          </p>
        </div>
        <PropertyFilters />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Resultados</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {filtered.length} anúncios encontrados. Use o mapa para localizar e a lista para comparar detalhes.
              </p>
            </div>
            <PropertyList items={filtered} />
          </div>
          <div className="space-y-4">
            <div className="glass-card lg:sticky lg:top-24 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mapa de anúncios</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Clique nos pins para abrir o anúncio e explorar o entorno.
              </p>
              <MobileMapToggle>
                <PropertyMap items={filtered} height="300px" />
              </MobileMapToggle>
              <div className="mt-4 hidden lg:block">
                <PropertyMap items={filtered} height="520px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
