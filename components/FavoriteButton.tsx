'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const FAVORITES_KEY = 'potilar:favorites';

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('potilar:favorites-changed'));
}

export function getFavoriteIds() {
  if (typeof window === 'undefined') return [];
  return readFavorites();
}

async function syncRemoteFavorites() {
  try {
    const response = await fetch('/api/favorites', { cache: 'no-store' });
    if (!response.ok) return;

    const payload = (await response.json()) as { favorites?: string[] };
    if (!Array.isArray(payload.favorites)) return;

    const local = readFavorites();
    const merged = Array.from(new Set([...local, ...payload.favorites]));
    writeFavorites(merged);
  } catch {
    // Mantem favoritos locais quando a conta remota nao estiver disponivel.
  }
}

async function persistFavorite(listingId: string, favorite: boolean) {
  try {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, favorite })
    });
  } catch {
    // Favorito local continua funcionando offline.
  }
}

export default function FavoriteButton({
  propertyId,
  title,
  variant = 'floating'
}: {
  propertyId: string;
  title: string;
  variant?: 'floating' | 'inline';
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    function sync() {
      setIsFavorite(readFavorites().includes(propertyId));
    }

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('potilar:favorites-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('potilar:favorites-changed', sync);
    };
  }, [propertyId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        void syncRemoteFavorites();
      }
    });
  }, []);

  function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const favorites = readFavorites();
    const nextFavorite = !favorites.includes(propertyId);
    const next = nextFavorite ? [...favorites, propertyId] : favorites.filter((id) => id !== propertyId);

    writeFavorites(next);
    setIsFavorite(nextFavorite);
    void persistFavorite(propertyId, nextFavorite);
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={isFavorite ? `Remover ${title} dos favoritos` : `Salvar ${title} nos favoritos`}
      className={`${variant === 'floating' ? 'absolute right-3 top-3 z-20 h-10 w-10' : 'h-11 px-4'} flex items-center justify-center gap-2 rounded-full shadow-soft transition ${
        isFavorite ? 'bg-red-500 text-white' : 'bg-white/95 text-slate-700 hover:text-red-500'
      }`}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
      {variant === 'inline' && <span className="text-sm font-semibold">{isFavorite ? 'Favorito' : 'Salvar favorito'}</span>}
    </button>
  );
}
