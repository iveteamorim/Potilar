'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cities } from '@/data/cities';

export default function HeroSearch() {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState('Casa');
  const [transaction, setTransaction] = useState('Aluguel');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [city, setCity] = useState('');

  function handleSearch() {
    const params = new URLSearchParams();
    if (propertyType) params.set('propertyType', propertyType);
    if (transaction) params.set('transaction', transaction);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (city) params.set('city', city);
    router.push(`/imoveis?${params.toString()}`);
  }

  return (
    <section className="section-padding bg-hero-glow">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Seu imóvel em destaque</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            Agora ficou mais fácil encontrar seu lar no RN.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">Casas, lotes e aluguel perto de você.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/anunciar"
              className="rounded-full bg-ocean-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-ocean-700"
            >
              Anunciar meu imóvel
            </Link>
            <Link href="/contato" className="text-sm font-semibold text-ocean-700">
              Falar com atendimento
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="glass-card p-6"
        >
          <form className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tipo de imóvel</label>
                <select
                  value={propertyType}
                  onChange={(event) => setPropertyType(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-ocean-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Casa">Casa</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Apartamento">Apartamento</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Negociação</label>
                <select
                  value={transaction}
                  onChange={(event) => setTransaction(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-ocean-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Aluguel">Aluguel</option>
                  <option value="Compra">Compra</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Preço máximo</label>
                <input
                  type="number"
                  placeholder="R$ 250.000"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-ocean-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Quartos</label>
                <select
                  value={bedrooms}
                  onChange={(event) => setBedrooms(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-ocean-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cidade</label>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-ocean-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="">Selecione uma cidade</option>
                {cities.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-ocean-700"
            >
              <Search className="h-4 w-4" />
              Buscar imóveis
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
