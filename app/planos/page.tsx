import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp
} from 'lucide-react';
import ProfessionalPlanCards from '@/components/ProfessionalPlanCards';
import { PLANS, formatPlanPrice, getFreeListingLimit, getProfessionalPlanPublicLabel } from '@/lib/plans';
import { getFreeActiveLimit } from '@/lib/listingCapacity';

export const metadata: Metadata = {
  title: 'Planos para Corretores e Imobiliárias | Potilar',
  description: 'Comece grátis na Potilar. Corretores e imobiliárias anunciam no Rio Grande do Norte e só pagam quando precisam de mais capacidade.',
  alternates: {
    canonical: '/planos'
  }
};

const contactHref = '/contato';

const benefits = [
  { title: 'Contato direto', text: 'Interessados falam com você pelo canal escolhido no anúncio.', Icon: MessageCircle },
  { title: 'Sem comissão', text: 'A Potilar divulga. A negociação continua entre anunciante e interessado.', Icon: CheckCircle2 },
  { title: 'Página própria', text: 'Corretores e imobiliárias podem reunir seus imóveis em uma vitrine local.', Icon: Building2 },
  { title: 'Marca da imobiliária', text: 'Plano profissional com identidade, logo e presença mais forte.', Icon: BadgeCheck },
  { title: 'Foco no RN', text: 'Busca, cidades e conteúdo pensados para o Rio Grande do Norte.', Icon: MapPin },
  { title: 'Gestão centralizada', text: 'Anúncios, contatos e mensagens organizados na sua conta Potilar.', Icon: LayoutDashboard }
];

const particularPlans = [
  {
    name: `Até ${getFreeListingLimit()} anúncios grátis`,
    price: 'R$ 0',
    description: 'Para casas, apartamentos e terrenos de compra ou aluguel.',
    details: `Cada anúncio comum fica ativo por ${PLANS.listing.additionalDurationDays} dias.`
  },
  {
    name: 'Anúncio comum adicional',
    price: formatPlanPrice(PLANS.listing.additionalPrice),
    description: 'Quando o particular já usou o limite grátis.',
    details: `${PLANS.listing.additionalDurationDays} dias para compra ou aluguel.`
  }
];

const comparison = [
  [
    'Entrada',
    `Até ${getFreeActiveLimit('corretor')} imóveis grátis`,
    `Até ${getFreeActiveLimit('imobiliaria')} imóveis grátis`,
    '—'
  ],
  [
    'Plano pago',
    `${formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true })} até ${PLANS.professional.corretor.listingLimit}`,
    `${formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true })} até ${PLANS.professional.imobiliaria.listingLimit}`,
    `${formatPlanPrice(PLANS.professional.plus.price, { perMonth: true })} até ${PLANS.professional.plus.listingLimit}`
  ],
  [
    '✨ Melhorias com IA / mês',
    String(PLANS.professional.corretor.aiCredits),
    String(PLANS.professional.imobiliaria.aiCredits),
    String(PLANS.professional.plus.aiCredits)
  ],
  ['Página profissional', '✔', '✔', '⭐ Em destaque'],
  ['Destaques incluídos', '—', '—', '3/mês'],
  ['Suporte', 'Padrão', 'Padrão', 'Prioritário']
];

const extras = [
  {
    title: `Temporada ${PLANS.listing.seasonalDurationDays} dias`,
    text: 'Anúncio para aluguel por temporada.',
    price: formatPlanPrice(PLANS.listing.seasonalPrice)
  },
  {
    title: `Renovação ${PLANS.listing.seasonalRenewal30DurationDays} dias`,
    text: 'Renove apenas pelo período que precisa.',
    price: formatPlanPrice(PLANS.listing.seasonalRenewal30Price)
  },
  {
    title: `Renovação ${PLANS.listing.seasonalRenewal60DurationDays} dias`,
    text: 'Mais tempo por R$ 5 a mais que a renovação curta.',
    price: formatPlanPrice(PLANS.listing.seasonalRenewal60Price)
  },
  {
    title: PLANS.highlights['7_days'].label,
    text: 'Mais visibilidade por uma semana.',
    price: formatPlanPrice(PLANS.highlights['7_days'].price)
  },
  {
    title: PLANS.highlights['15_days'].label,
    text: 'Boa visibilidade por duas semanas.',
    price: formatPlanPrice(PLANS.highlights['15_days'].price)
  },
  {
    title: PLANS.highlights['30_days'].label,
    text: 'Presença reforçada durante o mês.',
    price: formatPlanPrice(PLANS.highlights['30_days'].price)
  }
];

const faqs = [
  [
    'Preciso pagar comissão para a Potilar?',
    'Não. A Potilar funciona como plataforma de divulgação. A conversa e a negociação acontecem diretamente com você.'
  ],
  [
    'Preciso pagar para criar conta de Corretor ou Imobiliária?',
    'Não. A conta é grátis. Corretor começa com 3 imóveis ativos grátis. Imobiliária começa com 10. O plano mensal só entra quando você quiser mais capacidade.'
  ],
  [
    'O plano tem fidelidade?',
    'Não. Você pode cancelar quando quiser. Sua carteira continua ativa até o fim do período pago.'
  ],
  [
    'Destaques podem ser contratados depois?',
    'Sim. Você pode publicar primeiro e destacar os imóveis que precisam de mais visibilidade.'
  ]
];

export default function PlanosPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-7xl space-y-20">
        <section>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ocean-600">Planos para profissionais</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-slate-950 dark:text-white md:text-6xl">
              Comece grátis. Pague só quando precisar de mais capacidade.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Corretores e imobiliárias do Rio Grande do Norte publicam com marca própria e contato direto. A cota grátis
              faz parte do produto. O plano mensal entra quando a carteira cresce.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#planos"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg"
              >
                Ver planos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={contactHref}
                className="inline-flex items-center justify-center rounded-2xl border border-sand-300 bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:border-ocean-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                Falar com a Potilar
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-ocean-700" />
                Sem comissão
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-ocean-700" />
                100% focado no RN
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ocean-700" />
                Destaques opcionais
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Por que anunciar na Potilar?</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
              Um portal local para transformar anúncios em conversas reais.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ title, text, Icon }) => (
              <article key={title} className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="particular" className="rounded-[2rem] border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Particular</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
                Preços para anunciar seu próprio imóvel.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Estes valores são para anúncios comuns de compra ou aluguel. Temporada, renovações e destaques ficam na seção separada abaixo.
              </p>
            </div>
            <Link href="/anunciar" className="inline-flex items-center gap-2 rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
              Anunciar imóvel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {particularPlans.map((plan) => (
              <article key={plan.name} className="rounded-3xl border border-sand-200 bg-sand-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-3xl font-semibold text-ocean-800">{plan.price}</p>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.description}</p>
                <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                  {plan.details}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Planos profissionais</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
                Gratis para começar. Plano só quando a carteira cresce.
              </h2>
            </div>
            <Link href={contactHref} className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-800">
              Falar com a Potilar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            <ProfessionalPlanCards contactHref={contactHref} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Comparação</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Veja o que muda em cada plano.</h2>
            </div>
          </div>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">Recurso</th>
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">{getProfessionalPlanPublicLabel('corretor')}</th>
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">{getProfessionalPlanPublicLabel('imobiliaria')}</th>
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">{getProfessionalPlanPublicLabel('plus')}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([resource, corretor, imobiliaria, plus]) => (
                  <tr key={resource}>
                    <td className="border-b border-sand-100 px-4 py-4 font-semibold text-slate-950 dark:border-slate-800 dark:text-white">
                      {resource}
                    </td>
                    <td className="border-b border-sand-100 px-4 py-4 text-slate-600 dark:border-slate-800 dark:text-slate-300">{corretor}</td>
                    <td className="border-b border-sand-100 px-4 py-4 text-slate-600 dark:border-slate-800 dark:text-slate-300">{imobiliaria}</td>
                    <td className="border-b border-sand-100 px-4 py-4 text-slate-600 dark:border-slate-800 dark:text-slate-300">{plus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Destaques e temporada</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
              Impulsos opcionais quando um imóvel precisa de mais atenção.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {extras.map((extra) => (
              <article key={extra.title} className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <Star className="h-5 w-5 shrink-0 text-sun-500" />
                  <p className="text-lg font-semibold text-ocean-800">{extra.price}</p>
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-950 dark:text-white">{extra.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{extra.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Perguntas frequentes</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Antes de escolher seu plano.</h2>
          </div>
          <div className="mt-8 divide-y divide-sand-200 rounded-3xl border border-sand-200 bg-white text-left shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {faqs.map(([question, answer]) => (
              <article key={question} className="p-6">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-ocean-800 p-8 text-white shadow-soft md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-ocean-100">
                <TrendingUp className="h-4 w-4" />
                Potilar profissionais
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold">Leve sua carteira de imóveis para um portal feito para o RN.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ocean-50">
                Crie a conta grátis e publique. O plano mensal fica para quando você precisar de mais imóveis ativos.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#planos"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Ver planos
              </Link>
              <Link
                href={contactHref}
                className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Falar com a Potilar
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
