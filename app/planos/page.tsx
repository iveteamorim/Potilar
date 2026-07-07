import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp
} from 'lucide-react';
import { PLANS, formatPlanPrice } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Planos para Corretores e Imobiliárias | Potilar',
  description: 'Planos para corretores e imobiliárias anunciarem imóveis no Rio Grande do Norte com marca própria e contato direto.',
  alternates: {
    canonical: '/planos'
  }
};

const whatsappHref =
  'https://wa.me/5521969724141?text=Ola%2C%20vim%20pelo%20site%20Potilar%20e%20quero%20conhecer%20os%20planos%20para%20corretores%20e%20imobiliarias.';

const benefits = [
  { title: 'Contato direto', text: 'Interessados falam com você pelo canal escolhido no anúncio.', Icon: MessageCircle },
  { title: 'Sem comissão', text: 'A Potilar divulga. A negociação continua entre anunciante e interessado.', Icon: CheckCircle2 },
  { title: 'Página própria', text: 'Corretores e imobiliárias podem reunir seus imóveis em uma vitrine local.', Icon: Building2 },
  { title: 'Marca da imobiliária', text: 'Plano profissional com identidade, logo e presença mais forte.', Icon: BadgeCheck },
  { title: 'Foco no RN', text: 'Busca, cidades e conteúdo pensados para o Rio Grande do Norte.', Icon: MapPin },
  { title: 'Gestão centralizada', text: 'Anúncios, contatos e mensagens organizados na sua conta Potilar.', Icon: LayoutDashboard }
];

const professionalPlans = [
  {
    name: 'Corretor',
    price: formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true }),
    description: 'Para profissionais independentes com carteira enxuta.',
    limit: PLANS.professional.corretor.listingLimit,
    features: ['Perfil profissional', 'WhatsApp direto', 'Gestão dos anúncios', 'Renovação automática']
  },
  {
    name: 'Imobiliária',
    price: formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true }),
    description: 'Para equipes que precisam divulgar mais imóveis com marca própria.',
    limit: PLANS.professional.imobiliaria.listingLimit,
    popular: true,
    features: ['Logo da empresa', 'Página própria', 'Gestão centralizada', 'WhatsApp direto']
  },
  {
    name: 'Imobiliária Plus',
    price: formatPlanPrice(PLANS.professional.plus.price, { perMonth: true }),
    description: 'Para operações maiores que querem volume, destaque e prioridade.',
    limit: PLANS.professional.plus.listingLimit,
    features: ['Página própria destacada', '3 destaques de 30 dias', 'Prioridade no suporte', 'Mais visibilidade']
  }
];

const extras = [
  {
    title: `Temporada ${PLANS.listing.seasonalDurationDays} dias`,
    text: 'Anúncio para aluguel por temporada.',
    price: formatPlanPrice(PLANS.listing.seasonalPrice)
  },
  {
    title: `Renovação ${PLANS.listing.seasonalDurationDays} dias`,
    text: 'Renove o anúncio por mais tempo.',
    price: formatPlanPrice(PLANS.listing.seasonalRenewalPrice)
  },
  {
    title: PLANS.highlights['7_days'].label,
    text: 'Mais visibilidade por uma semana.',
    price: formatPlanPrice(PLANS.highlights['7_days'].price)
  },
  {
    title: PLANS.highlights['30_days'].label,
    text: 'Presença reforçada durante o mês.',
    price: formatPlanPrice(PLANS.highlights['30_days'].price)
  },
  {
    title: PLANS.highlights.super_30_days.label,
    text: 'Maior exposição para imóveis prioritários.',
    price: formatPlanPrice(PLANS.highlights.super_30_days.price)
  }
];

const comparison = [
  ['Imóveis ativos', '10', '50', '100'],
  ['Página profissional', 'Sim', 'Sim', 'Destacada'],
  ['Logo e marca', 'Perfil', 'Empresa', 'Empresa'],
  ['Destaques incluidos', '-', '-', '3 por mes'],
  ['Suporte', 'Padrão', 'Padrão', 'Prioritário']
];

const faqs = [
  [
    'Preciso pagar comissão para a Potilar?',
    'Não. A Potilar funciona como plataforma de divulgação. A conversa e a negociação acontecem diretamente com você.'
  ],
  ['Como ativo um plano profissional?', 'Fale com a Potilar pelo WhatsApp. Nossa equipe confirma seus dados, o volume de imóveis e o melhor plano para sua carteira.'],
  ['O plano tem fidelidade?', 'Não. Fale com a Potilar para ativar, ajustar ou cancelar quando precisar.'],
  ['Destaques podem ser contratados depois?', 'Sim. Você pode publicar primeiro e destacar os imóveis que precisam de mais visibilidade.']
];

function PlanButton({ children, href = whatsappHref }: { children: string; href?: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function CheckItem({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-700">
        <Check className="h-3.5 w-3.5" />
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function PlanosPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-7xl space-y-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ocean-600">Planos para profissionais</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-slate-950 dark:text-white md:text-6xl">
              Mais clientes. Menos trabalho.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A Potilar ajuda corretores e imobiliárias do Rio Grande do Norte a divulgar seus imóveis com marca própria,
              contato direto e uma vitrine feita para o mercado local.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg"
              >
                Falar sobre planos
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-sand-300 bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:border-ocean-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                Falar com a Potilar
              </a>
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

          <div className="rounded-[2rem] border border-sand-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-[1.5rem] bg-sand-50 p-5 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Painel profissional</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Sua carteira no RN</h2>
                </div>
                <span className="rounded-full bg-ocean-700 px-3 py-1 text-xs font-semibold text-white">Ao vivo</span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Imóveis ativos', '50'],
                  ['Contatos', '32'],
                  ['Cidades', '8']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-2xl font-semibold text-ocean-800">{value}</p>
                    <p className="mt-1 text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-3xl bg-white p-4 dark:bg-slate-900">
                <div className="flex gap-4">
                  <div className="h-24 w-28 shrink-0 rounded-2xl bg-gradient-to-br from-ocean-100 via-sand-100 to-sun-100" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Casa para venda em Natal</p>
                    <p className="mt-2 text-2xl font-semibold text-ocean-800">R$ 450.000</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>3 quartos</span>
                      <span>2 banheiros</span>
                      <span>1 vaga</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-3xl border border-ocean-100 bg-ocean-50 p-4 text-sm font-semibold text-ocean-900">
                Novo contato recebido pelo chat da Potilar.
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

        <section id="planos">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Planos mensais</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
                Escolha o tamanho da sua carteira.
              </h2>
            </div>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-800">
              Falar com a Potilar
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {professionalPlans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900 ${
                  plan.popular ? 'border-ocean-500 shadow-soft lg:-mt-4' : 'border-sand-200 dark:border-slate-800'
                }`}
              >
                {plan.popular ? (
                  <span className="absolute right-5 top-5 rounded-full bg-sun-500 px-3 py-1 text-xs font-bold text-white">
                    Mais popular
                  </span>
                ) : null}
                <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">{plan.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.description}</p>
                <p className="mt-5 text-4xl font-semibold text-ocean-800">{plan.price}</p>
                <p className="mt-3 rounded-2xl bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Até {plan.limit} imóveis ativos
                </p>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <CheckItem key={feature}>{feature}</CheckItem>
                  ))}
                </ul>
                <div className="mt-7">
                  <PlanButton>{plan.popular ? 'Começar com Imobiliária' : 'Começar'}</PlanButton>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Comparacao</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Veja o que muda em cada plano.</h2>
            </div>
          </div>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">Recurso</th>
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">Corretor</th>
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">Imobiliária</th>
                  <th className="border-b border-sand-200 px-4 py-3 font-semibold">Plus</th>
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
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                Fale com a Potilar para escolher o plano ideal para sua carteira e divulgar seus imóveis com marca própria.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#planos"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Ver planos
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Falar com a Potilar
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
