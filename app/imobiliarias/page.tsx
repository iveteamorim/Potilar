import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Info,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import ProfessionalPlanCheckoutButton from '@/components/ProfessionalPlanCheckoutButton';
import { PLANS, formatPlanPrice, type ProfessionalPlanId } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Imobiliárias e corretores no RN | Potilar',
  description:
    'Página para corretores e imobiliárias do Rio Grande do Norte divulgarem imóveis na Potilar com marca própria, página profissional e contato direto.',
  alternates: {
    canonical: '/imobiliarias'
  }
};

const contactHref = '/contato';
const advertiseHref = '/anunciar';

const benefits = [
  { title: 'Carteira organizada', text: 'Divulgue vários imóveis em uma vitrine focada no RN.', Icon: LayoutDashboard },
  { title: 'Marca própria', text: 'Mostre nome, logo e identidade da imobiliária nos anúncios.', Icon: BadgeCheck },
  { title: 'Contato direto', text: 'Receba interessados pelo canal escolhido em cada anúncio.', Icon: MessageCircle },
  { title: 'Busca e mapa', text: 'Imóveis aparecem por cidade, bairro, filtros e mapa.', Icon: MapPin }
];

const planHighlights = [
  {
    name: 'Corretor',
    price: formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true }),
    limit: PLANS.professional.corretor.listingLimit,
    aiCredits: PLANS.professional.corretor.aiCredits,
    features: ['Perfil profissional', 'Gestão dos anúncios', 'Contato direto']
  },
  {
    name: 'Imobiliária',
    price: formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true }),
    limit: PLANS.professional.imobiliaria.listingLimit,
    aiCredits: PLANS.professional.imobiliaria.aiCredits,
    featured: true,
    features: ['Logo da empresa', 'Página própria', 'Gestão centralizada']
  },
  {
    name: 'Imobiliária Plus',
    price: formatPlanPrice(PLANS.professional.plus.price, { perMonth: true }),
    limit: PLANS.professional.plus.listingLimit,
    aiCredits: PLANS.professional.plus.aiCredits,
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

function getPlanAction(planName: string): { id: ProfessionalPlanId; cta: string } {
  if (planName === 'Corretor') return { id: 'corretor', cta: 'Assinar Corretor' };
  if (planName.includes('Plus')) return { id: 'plus', cta: 'Assinar Plus' };
  return { id: 'imobiliaria', cta: 'Assinar Imobiliária' };
}

export default function ImobiliariasPage() {
  return (
    <main className="section-padding bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ocean-600">Imobiliárias no RN</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-slate-950 dark:text-white md:text-6xl">
              Divulgue imóveis no portal feito para o Rio Grande do Norte.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Publique sua carteira de imóveis com rapidez e organize todos os anúncios em uma página profissional.
              Ganhe presença local e receba contatos de quem procura casas, apartamentos, terrenos e pontos comerciais no RN.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Nas redes sociais, os imóveis somem no feed, ficam difíceis de comparar e obrigam o corretor a repetir as
              mesmas informações no WhatsApp. Na Potilar, cada anúncio tem uma página organizada, fácil de compartilhar e
              encontrada por cidade.
            </p>
            <p className="mt-4 max-w-2xl rounded-2xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm font-semibold text-ocean-900">
              Comece com anúncio grátis. Use planos profissionais apenas quando precisar de mais volume, destaque ou
              página da imobiliária.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={advertiseHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg"
              >
                Anunciar grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={contactHref}
                className="inline-flex items-center justify-center rounded-2xl border border-ocean-200 bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:border-ocean-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                Falar com a Potilar
              </Link>
              <Link
                href="/planos"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:border-ocean-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
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

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Página profissional</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Presença local para sua marca</h2>
                </div>
                <Building2 className="h-8 w-8 text-ocean-700" />
              </div>
              <div className="mt-6 rounded-3xl bg-white p-5 dark:bg-slate-900">
                <ul className="space-y-4">
                  {[
                    'Página da imobiliária com seus anúncios',
                    'Imóveis encontrados por cidade e tipo',
                    'Links fáceis para compartilhar com clientes',
                    'Contato direto pelo canal escolhido'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-700">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 rounded-2xl border border-ocean-100 bg-ocean-50 p-4 text-sm font-semibold text-ocean-900">
                Seus imóveis aparecem na busca da Potilar, nas páginas por cidade e no mapa.
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Para profissionais</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">O essencial para divulgar melhor.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ title, text, Icon }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Planos profissionais</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Para quem precisa publicar mais.</h2>
            </div>
            <Link href="/planos" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-800">
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {planHighlights.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-3xl border p-6 ${
                  plan.featured ? 'border-ocean-500 bg-ocean-50/60' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
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
                <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-ocean-50 px-4 py-3 text-sm font-semibold text-ocean-800 dark:bg-ocean-950/40 dark:text-ocean-100">
                  <span>IA para melhorar anúncios</span>
                  <button
                    type="button"
                    className="group relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                    aria-label={`Até ${plan.aiCredits} utilizações por mês`}
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                    <span className="pointer-events-none absolute right-0 top-6 z-20 w-52 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-white opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-within:opacity-100">
                      Até {plan.aiCredits} utilizações por mês.
                    </span>
                  </button>
                </div>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <CheckItem key={feature}>{feature}</CheckItem>
                  ))}
                </ul>
                <div className="mt-7">
                  <ProfessionalPlanCheckoutButton planId={getPlanAction(plan.name).id} fallbackHref={contactHref}>
                    {getPlanAction(plan.name).cta}
                  </ProfessionalPlanCheckoutButton>
                </div>
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
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold">Quer publicar uma carteira de imóveis?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ocean-50">
                Fale com a equipe para trazer seus anúncios com marca própria e suporte direto.
              </p>
            </div>
            <Link
              href={contactHref}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Falar com a Potilar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
