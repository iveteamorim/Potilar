'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cities } from '@/data/cities';

export type Filters = {
  propertyType: string;
  transaction: string;
  city: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  petFriendly: boolean;
  condo: boolean;
};

const defaultFilters: Filters = {
  propertyType: '',
  transaction: '',
  city: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  petFriendly: false,
  condo: false
};

export default function PropertyFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initial = useMemo(() => {
    return {
      propertyType: searchParams.get('propertyType') ?? '',
      transaction: searchParams.get('transaction') ?? '',
      city: searchParams.get('city') ?? '',
      sort: searchParams.get('sort') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      bedrooms: searchParams.get('bedrooms') ?? '',
      bathrooms: searchParams.get('bathrooms') ?? '',
      parking: searchParams.get('parking') ?? '',
      petFriendly: searchParams.get('petFriendly') === 'true',
      condo: searchParams.get('condo') === 'true'
    } satisfies Filters;
  }, [searchParams]);

  const [filters, setFilters] = useState<Filters>(initial);

  useEffect(() => {
    setFilters(initial);
  }, [initial]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    router.push(pathname);
  }

  const activeChips = [
    filters.propertyType && `Tipo: ${filters.propertyType}`,
    filters.transaction && `Negociação: ${filters.transaction}`,
    filters.city && `Cidade: ${filters.city}`,
    filters.sort && `Ordenação: ${filters.sort === 'price-asc' ? 'Mais barato' : 'Mais caro'}`,
    filters.minPrice && `Min: R$ ${filters.minPrice}`,
    filters.maxPrice && `Max: R$ ${filters.maxPrice}`,
    filters.bedrooms && `Quartos: ${filters.bedrooms}+`,
    filters.bathrooms && `Banheiros: ${filters.bathrooms}+`,
    filters.parking && `Garagem: ${filters.parking}+`,
    filters.petFriendly && 'Aceita pet',
    filters.condo && 'Condomínio'
  ].filter(Boolean) as string[];

  return (
    <div className="glass-card grid gap-4 p-6">
      <div className="grid gap-3 md:grid-cols-4">
        <select
          value={filters.propertyType}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((prev) => ({ ...prev, propertyType: value }));
            updateParam('propertyType', value);
          }}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Tipo de imóvel</option>
          <option value="Casa">Casa</option>
          <option value="Terreno">Terreno</option>
          <option value="Apartamento">Apartamento</option>
        </select>
        <select
          value={filters.transaction}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((prev) => ({ ...prev, transaction: value }));
            updateParam('transaction', value);
          }}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Negociação</option>
          <option value="Aluguel">Aluguel</option>
          <option value="Compra">Compra</option>
        </select>
        <select
          value={filters.city}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((prev) => ({ ...prev, city: value }));
            updateParam('city', value);
          }}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Cidade</option>
          {cities.map((cityName) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((prev) => ({ ...prev, sort: value }));
            updateParam('sort', value);
          }}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Ordenar</option>
          <option value="price-asc">Mais barato</option>
          <option value="price-desc">Mais caro</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Preço mínimo</label>
          <input
            value={filters.minPrice}
            onChange={(event) => {
              const value = event.target.value;
              setFilters((prev) => ({ ...prev, minPrice: value }));
              updateParam('minPrice', value);
            }}
            type="number"
            className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Preço máximo</label>
          <input
            value={filters.maxPrice}
            onChange={(event) => {
              const value = event.target.value;
              setFilters((prev) => ({ ...prev, maxPrice: value }));
              updateParam('maxPrice', value);
            }}
            type="number"
            className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={filters.bedrooms}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((prev) => ({ ...prev, bedrooms: value }));
            updateParam('bedrooms', value);
          }}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Quartos</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
        <select
          value={filters.bathrooms}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((prev) => ({ ...prev, bathrooms: value }));
            updateParam('bathrooms', value);
          }}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Banheiros</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
        <select
          value={filters.parking}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((prev) => ({ ...prev, parking: value }));
            updateParam('parking', value);
          }}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Garagem</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.petFriendly}
            onChange={(event) => {
              const value = event.target.checked;
              setFilters((prev) => ({ ...prev, petFriendly: value }));
              updateParam('petFriendly', value ? 'true' : '');
            }}
          />
          Aceita pet
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.condo}
            onChange={(event) => {
              const value = event.target.checked;
              setFilters((prev) => ({ ...prev, condo: value }));
              updateParam('condo', value ? 'true' : '');
            }}
          />
          Condomínio
        </label>
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
