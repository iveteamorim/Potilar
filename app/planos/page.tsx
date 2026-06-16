import type { Metadata } from 'next';
import Link from 'next/link';
import { PLANS, formatPlanPrice } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Planos e Destaques | Potilar',
  description: 'Planos para proprietarios, corretores e imobiliarias anunciarem imoveis no Rio Grande do Norte.',
  alternates: {
    canonical: '/planos'
  }
};

const ownerPlans = [
  {
    title: 'Promocao de lancamento',
    price: 'Gratis',
    features: [
      `Ate ${PLANS.listing.freeListingLimit} anuncios ativos gratuitos`,
      `Ate ${PLANS.listing.standardDurationDays} dias de publicacao`,
      'Renovacao gratuita mediante confirmacao',
      'WhatsApp direto',
      'Fotos ilimitadas'
    ]
  },
  {
    title: 'Imovel adicional',
    price: formatPlanPrice(PLANS.listing.additionalPrice),
    features: [
      `Ate ${PLANS.listing.standardDurationDays} dias de publicacao`,
      'Renovacao gratuita mediante confirmacao',
      'WhatsApp direto'
    ]
  },
  {
    title: 'Temporada',
    price: formatPlanPrice(PLANS.listing.seasonalPrice),
    features: [
      `Ate ${PLANS.listing.seasonalDurationDays} dias de publicacao`,
      'Renovacao disponivel',
      'WhatsApp direto'
    ]
  }
];

const professionalPlans = [
  {
    title: PLANS.professional.corretor.label,
    tag: 'Corretor',
    price: formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true }),
    features: [
      `Ate ${PLANS.professional.corretor.listingLimit} imoveis ativos`,
      'Perfil profissional verificado',
      'WhatsApp direto',
      'Gestao dos anuncios',
      'Renovacao automatica dos anuncios'
    ]
  },
  {
    title: PLANS.professional.imobiliaria.label,
    tag: 'Mais popular',
    price: formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true }),
    featured: true,
    features: [
      `Ate ${PLANS.professional.imobiliaria.listingLimit} imoveis ativos`,
      'Perfil empresarial verificado',
      'Logo da empresa',
      'Pagina propria',
      'Gestao centralizada',
      'WhatsApp direto',
      'Renovacao automatica dos anuncios'
    ]
  },
  {
    title: PLANS.professional.plus.label,
    tag: 'Plus',
    price: formatPlanPrice(PLANS.professional.plus.price, { perMonth: true }),
    features: [
      `Ate ${PLANS.professional.plus.listingLimit} imoveis ativos`,
      'Perfil empresarial verificado',
      'Pagina propria destacada',
      'Imoveis prioritarios nas buscas',
      'Estatisticas e desempenho',
      '3 destaques de 30 dias incluidos por mes',
      'Prioridade no suporte'
    ]
  }
];

const highlightDescriptions: Record<'7_days' | '30_days' | 'super_30_days', { description: string; features: string[] }> = {
  '7_days': {
    description: 'Ideal para impulsionar rapidamente um anuncio.',
    features: ['Mais visibilidade nas buscas', 'Mais destaque na cidade']
  },
  '30_days': {
    description: 'Mais visibilidade durante todo o mes.',
    features: ['Prioridade nos resultados', 'Mais contatos potenciais']
  },
  super_30_days: {
    description: 'A opcao com maior visibilidade da plataforma.',
    features: ['Topo dos resultados', 'Selo Premium', 'Maxima exposicao', 'Prioridade maxima nas pesquisas']
  }
};

const faqs = [
  [
    'Quantos anuncios posso publicar de graca?',
    `Durante o lancamento, todo proprietario pode publicar ate ${PLANS.listing.freeListingLimit} imoveis gratuitamente na plataforma. A partir do ${PLANS.listing.freeListingLimit + 1}º, cada anuncio adicional custa ${formatPlanPrice(PLANS.listing.additionalPrice)} via Pix.`
  ],
  ['Preciso de contrato ou fidelidade?', 'Nao. Voce pode cancelar ou deixar de renovar quando desejar.'],
  ['Como recebo contatos?', 'Os interessados entram em contato diretamente pelo WhatsApp informado no anuncio.'],
  ['Posso anunciar terrenos?', 'Sim. Voce pode anunciar casas, apartamentos, terrenos e imoveis para temporada.'],
  [
    'Por quanto tempo fica ativo um anuncio de temporada?',
    `Anuncios de temporada ficam ativos por ate ${PLANS.listing.seasonalDurationDays} dias. Depois disso, podem ser renovados se o imovel continuar disponivel.`
  ],
  ['Posso destacar meu anuncio depois de publicar?', 'Sim. Os destaques podem ser ativados a qualquer momento em anuncios ja publicados.']
];

const whatsappHref =
  'https://wa.me/5521969724141?text=Ola%2C%20vim%20pelo%20site%20Potilar%20e%20quero%20conhecer%20os%20planos%20e%20destaques.';

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-5 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
      {items.map((item) => (
        <li key={item} className="rounded-xl bg-sand-50 px-4 py-3 dark:bg-slate-800">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PlanosPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-12">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Planos e destaques</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 dark:text-white">
            Para proprietarios, corretores e imobiliarias do Rio Grande do Norte.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            Mais visibilidade, mais contatos e mais oportunidades para seus imoveis.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Particular</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {ownerPlans.map((plan) => (
              <article key={plan.title} className="border border-sand-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{plan.title}</h3>
                <p className="mt-4 text-3xl font-semibold text-ocean-700">{plan.price}</p>
                <FeatureList items={plan.features} />
                <Link href="/anunciar" className="mt-6 inline-flex rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
                  Anunciar agora
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Corretores e imobiliarias</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {professionalPlans.map((plan) => (
              <article key={plan.title} className={`border bg-white p-6 dark:bg-slate-900 ${plan.featured ? 'border-ocean-500 shadow-soft' : 'border-sand-200 dark:border-slate-800'}`}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ocean-600">{plan.tag}</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">{plan.title}</h3>
                <p className="mt-4 text-3xl font-semibold text-ocean-700">{plan.price}</p>
                <FeatureList items={plan.features} />
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-2xl bg-sun-500 px-5 py-3 text-sm font-semibold text-white">
                  Quero anunciar
                </a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Destaques</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Mais visibilidade para imoveis que precisam vender ou alugar mais rapido.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {(['7_days', '30_days', 'super_30_days'] as const).map((planId) => {
              const plan = PLANS.highlights[planId];
              const copy = highlightDescriptions[planId];

              return (
                <article key={planId} className="border border-sand-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{plan.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.description}</p>
                  <p className="mt-4 text-2xl font-semibold text-ocean-700">{formatPlanPrice(plan.price)}</p>
                  <FeatureList items={copy.features} />
                </article>
              );
            })}
          </div>
        </section>

        <section className="border border-sand-200 bg-sand-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Renovacao dos anuncios</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Anuncios comuns permanecem ativos por ate {PLANS.listing.standardDurationDays} dias. Anuncios de temporada
            permanecem ativos por ate {PLANS.listing.seasonalDurationDays} dias. Antes da expiracao, enviaremos uma
            confirmacao para verificar se o imovel continua disponivel. Anuncios sem confirmacao serao pausados
            automaticamente.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Perguntas frequentes</h2>
          <div className="mt-6 divide-y divide-sand-200 border-y border-sand-200 dark:divide-slate-800 dark:border-slate-800">
            {faqs.map(([question, answer]) => (
              <article key={question} className="py-5">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
