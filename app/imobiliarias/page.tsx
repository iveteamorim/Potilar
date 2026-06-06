import type { Metadata } from 'next';
import Link from 'next/link';
import { PLANS, formatPlanPrice } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Imobiliarias e corretores no RN',
  description: 'Planos para corretores e imobiliarias divulgarem imoveis no Rio Grande do Norte pela Potilar.',
  alternates: {
    canonical: '/imobiliarias'
  }
};

const professionalPlans = [
  {
    name: 'Corretor',
    price: formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true }),
    description: 'Para profissionais independentes com carteira enxuta.',
    features: [
      `Ate ${PLANS.professional.corretor.listingLimit} imoveis ativos`,
      'Perfil profissional',
      'WhatsApp direto',
      'Gestao dos anuncios'
    ]
  },
  {
    name: 'Imobiliaria',
    price: formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true }),
    description: 'Para equipes que precisam divulgar mais imoveis com marca propria.',
    features: [
      `Ate ${PLANS.professional.imobiliaria.listingLimit} imoveis ativos`,
      'Logo da empresa',
      'Pagina propria',
      'Gestao centralizada',
      'WhatsApp direto'
    ]
  },
  {
    name: 'Imobiliaria Plus',
    price: formatPlanPrice(PLANS.professional.plus.price, { perMonth: true }),
    description: 'Para operacoes maiores que querem mais volume e destaque.',
    features: [
      `Ate ${PLANS.professional.plus.listingLimit} imoveis ativos`,
      'Pagina propria destacada',
      '3 destaques 30 dias incluidos',
      'Prioridade no suporte'
    ]
  }
];

const highlightPlans = (['7_days', '30_days', 'super_30_days'] as const).map((planId) => ({
  title: PLANS.highlights[planId].label,
  description: 'Mais visibilidade nas buscas e na cidade',
  price: formatPlanPrice(PLANS.highlights[planId].price)
}));

const seasonalPlans = [
  [
    `Temporada ${PLANS.listing.seasonalDurationDays} dias`,
    'Anuncio para aluguel por temporada',
    formatPlanPrice(PLANS.listing.seasonalPrice)
  ],
  [
    `Renovacao ${PLANS.listing.seasonalDurationDays} dias`,
    'Renove o anuncio por mais tempo',
    formatPlanPrice(PLANS.listing.seasonalRenewalPrice)
  ],
  ...highlightPlans.map((plan) => [plan.title, plan.description, plan.price] as const)
] as const;

const whatsappHref =
  'https://wa.me/5521969724141?text=Ola%2C%20vim%20pelo%20site%20Potilar%20e%20quero%20conhecer%20os%20planos%20para%20corretores%20e%20imobiliarias.';

export default function ImobiliariasPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-12">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Profissionais</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">
            Corretores e imobiliarias do RN na Potilar.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            Planos pensados para quem precisa divulgar varios imoveis com marca propria e contato direto.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Planos mensais</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {professionalPlans.map((plan) => (
              <article key={plan.name} className="border border-sand-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{plan.name}</h3>
                <p className="mt-4 text-3xl font-semibold text-ocean-700">{plan.price}</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
                <ul className="mt-5 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="rounded-xl bg-sand-50 px-4 py-3 dark:bg-slate-800">
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
                  Falar com a Potilar
                </a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Destaques e temporada</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {seasonalPlans.map(([title, description, price]) => (
              <article key={title} className="border border-sand-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
                <p className="mt-3 text-xl font-semibold text-ocean-700">{price}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-ocean-200 bg-ocean-50 p-6 dark:border-ocean-900 dark:bg-ocean-950/40">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Ja tem conta?</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Entre na sua conta para gerenciar anuncios ou comece um novo cadastro.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
              Entrar
            </Link>
            <Link href="/anunciar" className="rounded-2xl border border-ocean-300 px-5 py-3 text-sm font-semibold text-ocean-800 dark:border-ocean-800 dark:text-ocean-200">
              Anunciar imovel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
