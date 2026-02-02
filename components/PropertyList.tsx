'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Property } from '@/data/properties';
import PropertyCard from './PropertyCard';

const PAGE_SIZE = 6;

type Props = {
  items: Property[];
};

export default function PropertyList({ items }: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const visibleItems = useMemo(() => items.slice(0, visible), [items, visible]);

  useEffect(() => {
    setLoading(true);
    setVisible(PAGE_SIZE);
    const timeout = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(timeout);
  }, [items]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-64 rounded-3xl border border-sand-200 bg-sand-100 animate-pulse dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum anúncio encontrado</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Ajuste os filtros ou tente outra cidade para ver novas opções.
        </p>
        <button
          type="button"
          onClick={() => (window.location.href = '/imoveis')}
          className="mt-4 rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          Limpar filtros
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      {visible < items.length && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((prev) => prev + PAGE_SIZE)}
            className="rounded-2xl border border-ocean-200 bg-white px-6 py-3 text-sm font-semibold text-ocean-700 shadow-sm transition hover:bg-ocean-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Mostrar mais {Math.min(PAGE_SIZE, items.length - visible)}
          </button>
        </div>
      )}
    </div>
  );
}
