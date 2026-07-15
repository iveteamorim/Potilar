'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { cities } from '@/data/cities';

export type Filters = {
  q: string;
  propertyType: string;
  transaction: string;
  city: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  minArea: string;
  petFriendly: string;
  furnished: string;
  condoIncluded: string;
};

const defaultFilters: Filters = {
  q: '',
  propertyType: '',
  transaction: '',
  city: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  minArea: '',
  petFriendly: '',
  furnished: '',
  condoIncluded: ''
};

export default function PropertyFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initial = useMemo(() => {
    return {
      propertyType: searchParams.get('propertyType') ?? '',
      q: searchParams.get('q') ?? '',
      transaction: searchParams.get('transaction') ?? '',
      city: searchParams.get('city') ?? '',
      sort: searchParams.get('sort') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      bedrooms: searchParams.get('bedrooms') ?? '',
      bathrooms: searchParams.get('bathrooms') ?? '',
      parking: searchParams.get('parking') ?? '',
      minArea: searchParams.get('minArea') ?? '',
      petFriendly: searchParams.get('petFriendly') ?? '',
      furnished: searchParams.get('furnished') ?? '',
      condoIncluded: searchParams.get('condoIncluded') ?? ''
    } satisfies Filters;
  }, [searchParams]);

  const [filters, setFilters] = useState<Filters>(initial);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  useEffect(() => {
    setFilters(initial);
  }, [initial]);

  function pushParams(nextFilters: Filters) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(nextFilters).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (trimmed) {
        params.set(key, trimmed);
      } else {
        params.delete(key);
      }
    });
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateParam(key: keyof Filters, value: string) {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    pushParams(nextFilters);
  }

  function applyAllFilters() {
    pushParams(filters);
  }

  function clearFilters() {
    const preservedTransaction = filters.transaction;
    const nextFilters = { ...defaultFilters, transaction: preservedTransaction };
    setFilters(nextFilters);
    const params = new URLSearchParams();
    if (preservedTransaction) params.set('transaction', preservedTransaction);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function normalizeCity(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  const citySuggestions = useMemo(() => {
    const query = normalizeCity(filters.city.trim());
    if (!query) return cities.slice(0, 8);
    return cities.filter((cityName) => normalizeCity(cityName).includes(query)).slice(0, 8);
  }, [filters.city]);

  function selectCity(cityName: string) {
    setShowCitySuggestions(false);
    updateParam('city', cityName);
  }

  const activeChips = [
    filters.city && `Cidade: ${filters.city}`,
    filters.propertyType && `Tipo: ${filters.propertyType}`,
    filters.minPrice && `Min: R$ ${filters.minPrice}`,
    filters.maxPrice && `Max: R$ ${filters.maxPrice}`,
    filters.bedrooms && `Quartos: ${filters.bedrooms}+`,
    filters.bathrooms && `Banheiros: ${filters.bathrooms}+`,
    filters.parking && `Garagem: ${filters.parking}+`,
    filters.minArea && `Area: ${filters.minArea}+ m2`,
    filters.petFriendly === '1' && 'Aceita pet',
    filters.furnished === '1' && 'Mobiliado',
    filters.condoIncluded === '1' && 'Condomínio incluso'
  ].filter(Boolean) as string[];

  return (
    <div className="glass-card grid gap-4 p-4 sm:p-6">
      <div className="relative">
        <label className="mb-2 block text-sm font-bold text-slate-900 dark:text-white">Cidade</label>
        <input
          value={filters.city}
          onFocus={() => setShowCitySuggestions(true)}
          onBlur={() => window.setTimeout(() => setShowCitySuggestions(false), 120)}
          onChange={(event) => {
            setFilters((prev) => ({ ...prev, city: event.target.value }));
            setShowCitySuggestions(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') applyAllFilters();
          }}
          placeholder="Selecionar cidade"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        {filters.city && (
          <button
            type="button"
            onClick={() => {
              setShowCitySuggestions(false);
              updateParam('city', '');
            }}
            className="absolute right-2 top-[38px] flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Limpar cidade"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {showCitySuggestions && citySuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {citySuggestions.map((cityName) => (
              <button
                key={cityName}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCity(cityName)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-ocean-50 hover:text-ocean-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {cityName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-900 dark:text-white">Tipo de imóvel</label>
        <select
          value={filters.propertyType}
          onChange={(event) => updateParam('propertyType', event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Todos os tipos</option>
          <option value="Casa">Casa</option>
          <option value="Terreno">Terreno</option>
          <option value="Apartamento">Apartamento</option>
          <option value="Kitnet/Conjugado">Kitnet/Conjugado</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-900 dark:text-white">Preço</label>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input
            value={filters.minPrice}
            onChange={(event) => updateParam('minPrice', event.target.value)}
            type="number"
            placeholder="Minimo"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <span className="text-xs font-semibold text-slate-400">ate</span>
          <input
            value={filters.maxPrice}
            onChange={(event) => updateParam('maxPrice', event.target.value)}
            type="number"
            placeholder="Maximo"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={filters.bedrooms}
          onChange={(event) => updateParam('bedrooms', event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Quartos</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
        <select
          value={filters.bathrooms}
          onChange={(event) => updateParam('bathrooms', event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Banheiros</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
        <select
          value={filters.parking}
          onChange={(event) => updateParam('parking', event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Garagem</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
        </select>
        <input
          value={filters.minArea}
          onChange={(event) => updateParam('minArea', event.target.value)}
          type="number"
          min="0"
          placeholder="Area minima"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.petFriendly === '1'}
            onChange={(event) => updateParam('petFriendly', event.target.checked ? '1' : '')}
          />
          Aceita pet
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.furnished === '1'}
            onChange={(event) => updateParam('furnished', event.target.checked ? '1' : '')}
          />
          Mobiliado
        </label>
        {(filters.transaction === 'Aluguel' || filters.transaction === '') && (
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.condoIncluded === '1'}
              onChange={(event) => updateParam('condoIncluded', event.target.checked ? '1' : '')}
            />
            Condomínio incluso
          </label>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={applyAllFilters}
        className="w-full rounded-2xl bg-ocean-700 px-5 py-4 text-sm font-bold text-white transition hover:bg-ocean-800"
      >
        Buscar imóveis
      </button>

      <button
        type="button"
        onClick={clearFilters}
        className="justify-self-center px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        Limpar filtros
      </button>
    </div>
  );
}
