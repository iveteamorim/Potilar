'use client';

import { Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Property } from '@/data/properties';
import PropertyCard from './PropertyCard';
import { getFavoriteIds } from './FavoriteButton';

type Props = {
  items: Property[];
  variant?: 'grid' | 'horizontal';
};

export default function FavoriteAwarePropertyList({ items, variant = 'grid' }: Props) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    function sync() {
      setFavoriteIds(getFavoriteIds());
    }

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('potilar:favorites-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('potilar:favorites-changed', sync);
    };
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const visibleItems = showFavorites ? items.filter((property) => favoriteSet.has(property.id)) : items;

  if (items.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum anúncio encontrado</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Ajuste os filtros ou tente outra cidade para ver novas opcoes.
        </p>
        <a
          href="/imoveis"
          className="mt-4 inline-flex rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          Limpar filtros
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowFavorites((current) => !current)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold shadow-sm transition ${
            showFavorites
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-sand-200 bg-white text-slate-600 hover:border-ocean-200 hover:text-ocean-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          <Heart className={`h-4 w-4 ${showFavorites ? 'fill-current' : ''}`} aria-hidden="true" />
          {showFavorites ? 'Ver todos' : `Favoritos (${favoriteIds.length})`}
        </button>
      </div>

      {visibleItems.length > 0 ? (
        <div className={variant === 'horizontal' ? 'space-y-5' : 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'}>
          {visibleItems.map((property) => (
            <PropertyCard key={property.id} property={property} variant={variant} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum favorito nesta busca</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Toque no coração dos anúncios para guardar favoritos. Com login, eles sincronizam na sua conta.
          </p>
        </div>
      )}
    </div>
  );
}
