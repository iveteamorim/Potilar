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
    <section className="relative border-b border-sand-200 bg-slate-950 text-white dark:border-slate-800">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=80')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/25" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-ocean-800">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Imoveis no Rio Grande do Norte
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.04] sm:text-5xl lg:text-6xl">
            Encontre seu lugar no RN.
          </h1>
        </div>

        <div className="mt-8 border-t-4 border-green-500 bg-white/95 p-4 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.35)] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[auto_auto_1fr_auto] lg:items-end">
            <div>
              <label className="sr-only">Negociacao</label>
              <div className="grid grid-cols-3 border border-slate-950/20 bg-white">
                {(['Aluguel', 'Compra', 'Temporada'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTransaction(option)}
                    className={`px-4 py-3 text-sm font-bold transition ${
                      transaction === option
                      ? 'bg-ocean-800 text-white'
                        : 'text-slate-800 hover:bg-sand-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="sr-only">Tipo de imovel</label>
              <select
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                className="h-12 w-full min-w-40 border border-slate-950/20 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-ocean-700"
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
                placeholder="Cidade"
                className="h-12 w-full border border-slate-950/20 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-ocean-700"
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
                className="inline-flex h-12 items-center justify-center gap-2 bg-sun-500 px-7 text-base font-bold text-white transition hover:bg-sun-600"
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
