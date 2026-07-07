import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import { PLANS, formatPlanPrice } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Imobiliárias e corretores no RN | Potilar',
  description: 'Página para corretores e imobiliárias do Rio Grande do Norte divulgarem imóveis na Potilar com marca própria, página profissional e contato direto.',
  alternates: {
    canonical: '/imobiliarias'
  }
};

const whatsappHref =
  'https://wa.me/5521969724141?text=Ola%2C%20vim%20pelo%20site%20Potilar%20e%20quero%20anunciar%20imoveis%20como%20corretor%20ou%20imobiliaria.';

const benefits = [
  { title: 'Carteira organizada', text: 'Divulgue vários imóveis em uma vitrine profissional focada no RN.', Icon: LayoutDashboard },
  { title: 'Marca própria', text: 'Mostre nome, logo e identidade da imobiliária nos anúncios.', Icon: BadgeCheck },
  { title: 'Contato direto', text: 'Receba interessados por WhatsApp, telefone, email ou chat da Potilar.', Icon: MessageCircle },
  { title: 'Busca e mapa', text: 'Imóveis aparecem por cidade, bairro, filtros e mapa.', Icon: MapPin }
];

const planHighlights = [
  {
    name: 'Corretor',
    price: formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true }),
    limit: PLANS.professional.corretor.listingLimit,
    features: ['Perfil profissional', 'Gestão dos anúncios', 'Contato direto']
  },
  {
    name: 'Imobiliária',
    price: formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true }),
    limit: PLANS.professional.imobiliaria.listingLimit,
    featured: true,
    features: ['Logo da empresa', 'Página própria', 'Gestão centralizada']
  },
  {
    name: 'Imobiliária Plus',
    price: formatPlanPrice(PLANS.professional.plus.price, { perMonth: true }),
    limit: PLANS.professional.plus.listingLimit,
    features: ['Página destacada', '3 destaques incluídos', 'Suporte prioritário']
  }
];

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

export default function ImobiliariasPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-7xl space-y-18">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ocean-600">Imobiliárias no RN</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-slate-950 dark:text-white md:text-6xl">
              Divulgue sua carteira em um portal feito para o Rio Grande do Norte.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A Potilar ajuda corretores e imobiliárias a ganhar presença local, organizar anúncios e receber contatos
              diretos de quem procura imóveis no RN.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg"
              >
                Falar com a Potilar
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/planos"
                className="inline-flex items-center justify-center rounded-2xl border border-sand-300 bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:border-ocean-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                Ver planos
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-ocean-700" />
                Sem comissão
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-ocean-700" />
                Corretores e equipes
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-ocean-700" />
                Destaques opcionais
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-sand-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-[1.5rem] bg-sand-50 p-5 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Página da imobiliária</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Sua marca com seus imóveis</h2>
                </div>
                <Building2 className="h-8 w-8 text-ocean-700" />
              </div>
              <div className="mt-6 rounded-3xl bg-white p-5 dark:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ocean-700 text-lg font-bold text-white">RN</div>
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">Imobiliária em Natal</p>
                    <p className="text-sm text-slate-500">50 imóveis ativos</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Aluguel', '18'],
                    ['Compra', '27'],
                    ['Temporada', '5']
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-sand-50 p-4 dark:bg-slate-800">
                      <p className="text-2xl font-semibold text-ocean-800">{value}</p>
                      <p className="mt-1 text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 rounded-3xl border border-ocean-100 bg-ocean-50 p-4 text-sm font-semibold text-ocean-900">
                Seus anúncios aparecem na busca, no mapa e na sua página profissional.
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Para profissionais</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
              O que a Potilar entrega para sua imobiliária.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <section className="rounded-[2rem] border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Planos profissionais</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Escolha pelo volume de imóveis.</h2>
            </div>
            <Link href="/planos" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-800">
              Ver detalhes dos planos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {planHighlights.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-3xl border p-6 ${
                  plan.featured ? 'border-ocean-500 bg-ocean-50/60' : 'border-sand-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {plan.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-sun-500 px-3 py-1 text-xs font-bold text-white">
                    Mais popular
                  </span>
                ) : null}
                <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">{plan.name}</h3>
                <p className="mt-4 text-3xl font-semibold text-ocean-800">{plan.price}</p>
                <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                  Até {plan.limit} imóveis ativos
                </p>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <CheckItem key={feature}>{feature}</CheckItem>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-ocean-800 p-8 text-white shadow-soft md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-ocean-100">
                <Star className="h-4 w-4" />
                Potilar para imobiliárias
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold">Queremos trazer sua carteira para a Potilar.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ocean-50">
                Fale com a equipe para publicar vários imóveis com marca própria e suporte direto.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Falar com a Potilar
              </a>
              <Link
                href="/planos"
                className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
