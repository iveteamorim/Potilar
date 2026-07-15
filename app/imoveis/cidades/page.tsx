import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/config';
import { FEATURED_CITY_NAMES, RN_CITY_PAGES, getCityPagePath, groupCitiesAlphabetically } from '@/lib/cityPages';

export const metadata: Metadata = {
  title: 'Imóveis por cidade no Rio Grande do Norte',
  description:
    'Encontre anúncios de casas, apartamentos, terrenos, aluguel e temporada em todas as cidades do RN. Navegue por município na Potilar.',
  alternates: {
    canonical: `${BASE_URL}/imoveis/cidades`
  },
  openGraph: {
    title: 'Imóveis por cidade no RN | Potilar',
    description: 'Portal imobiliário regional com páginas para todos os municípios do Rio Grande do Norte.',
    url: `${BASE_URL}/imoveis/cidades`
  }
};

export default function CitiesIndexPage() {
  const groups = groupCitiesAlphabetically();

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Rio Grande do Norte</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
            Imóveis em todas as cidades do RN
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            A Potilar cobre os {RN_CITY_PAGES.length} municípios do Rio Grande do Norte. Escolha uma cidade para ver
            anúncios de aluguel, compra e temporada — ou publique na promoção de lançamento da sua região.
          </p>
          <Link
            href="/anunciar"
            className="mt-5 inline-flex rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Anunciar meu imóvel
          </Link>
        </div>

        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cidades em destaque</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {FEATURED_CITY_NAMES.map((city) => (
              <Link
                key={city}
                href={getCityPagePath(city)}
                className="rounded-full border border-ocean-200 bg-ocean-50 px-4 py-2 text-sm font-semibold text-ocean-800 transition hover:bg-ocean-100 dark:border-ocean-900 dark:bg-ocean-950/30 dark:text-ocean-100"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          {groups.map(([letter, cities]) => (
            <div key={letter}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{letter}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={getCityPagePath(city.name)}
                      className="block rounded-xl border border-sand-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-ocean-200 hover:bg-ocean-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-ocean-950/20"
                    >
                      Imóveis em {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
