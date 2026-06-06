'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, Map, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { Property } from '@/data/properties';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyMap from '@/components/PropertyMapLoader';

type Props = {
  items: Property[];
};

export default function MobileListingsControls({ items }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const sort = searchParams.get('sort') ?? '';

  function updateSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3 lg:hidden">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-bold ${
            showFilters
              ? 'border-ocean-700 bg-ocean-700 text-white'
              : 'border-sand-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtrar
        </button>
        <label className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          </span>
          <select
            value={sort}
            onChange={(event) => updateSort(event.target.value)}
            className="h-11 w-full appearance-none rounded-2xl border border-sand-200 bg-white pl-9 pr-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Ordenar anuncios"
          >
            <option value="">Ordenar</option>
            <option value="price-asc">Menor preco</option>
            <option value="price-desc">Maior preco</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setShowMap((current) => !current)}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-bold ${
            showMap
              ? 'border-ocean-700 bg-ocean-700 text-white'
              : 'border-sand-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
          }`}
          aria-expanded={showMap}
        >
          <Map className="h-4 w-4" aria-hidden="true" />
          Mapa
        </button>
      </div>

      {showFilters && <PropertyFilters />}

      {showMap && (
        <div id="mapa-mobile" className="scroll-mt-24">
          <PropertyMap items={items} height="360px" mapActive />
        </div>
      )}
    </div>
  );
}
