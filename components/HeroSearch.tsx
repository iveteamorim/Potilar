'use client';

import { MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cities } from '@/data/cities';

export default function HeroSearch() {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState('Casa');
  const [transaction, setTransaction] = useState('Aluguel');
  const [city, setCity] = useState('');

  function handleSearch() {
    const params = new URLSearchParams();
    if (propertyType) params.set('propertyType', propertyType);
    if (transaction) params.set('transaction', transaction);
    if (city) params.set('city', city);
    router.push(`/imoveis?${params.toString()}`);
  }

  return (
    <section className="relative min-h-[76vh] border-b border-slate-200 bg-slate-950 text-white dark:border-slate-800 lg:min-h-[82vh]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-95"
        style={{
          backgroundImage: "url('/colourful-mexican-house.jpg')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/78 via-slate-950/42 to-slate-950/12" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/30 to-transparent" />

      <div className="relative mx-auto flex min-h-[76vh] max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 lg:min-h-[82vh] lg:px-8 lg:py-20">
        <div className="max-w-5xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-ocean-800 shadow-sm">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            O maior portal de imóveis do Rio Grande do Norte
          </p>
          <h1 className="mt-7 max-w-[1040px] font-display text-4xl font-semibold leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
            Encontre o imóvel
            <span className="block">certo para você.</span>
          </h1>
        </div>

        <div className="mt-10 border-t-4 border-agreste-500 bg-white/[0.72] p-5 text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.34)] backdrop-blur-md sm:p-6 lg:p-7">
          <div className="grid gap-4 lg:grid-cols-[auto_240px_minmax(360px,1fr)_auto] lg:items-end">
            <div>
              <label className="sr-only">Negociação</label>
              <div className="grid grid-cols-3 overflow-hidden border border-slate-200 bg-slate-50">
                {(['Aluguel', 'Compra', 'Temporada'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTransaction(option)}
                  className={`px-5 py-4 text-sm font-bold transition ${
                      transaction === option
                      ? 'bg-ocean-900 text-white'
                        : 'text-slate-700 hover:bg-white hover:text-ocean-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="sr-only">Tipo de imóvel</label>
              <select
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                className="h-14 w-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 outline-none transition focus:border-ocean-700 focus:ring-2 focus:ring-ocean-100"
              >
                <option value="Casa">Casa</option>
                <option value="Terreno">Terreno</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Kitnet/Conjugado">Kitnet/Conjugado</option>
              </select>
            </div>

            <div>
              <label className="sr-only">Cidade</label>
              <input
                list="hero-rn-cities"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Digite a cidade no RN"
                className="h-14 w-full border border-slate-200 bg-white px-6 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ocean-700 focus:ring-2 focus:ring-ocean-100"
              />
              <datalist id="hero-rn-cities">
                {cities.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </datalist>
            </div>

            <button
              type="button"
              onClick={handleSearch}
                className="inline-flex h-14 items-center justify-center gap-2 bg-ocean-800 px-10 text-base font-bold text-white transition hover:bg-ocean-900"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              Buscar
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
