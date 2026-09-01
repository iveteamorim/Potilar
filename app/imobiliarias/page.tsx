import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Check,
  Gift,
  Info,
  MapPin,
  Megaphone,
  ShieldCheck
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
const portfolioTrial = PLANS.professional.portfolioTrial;

const benefits = [
  { title: 'Página própria', text: 'Uma vitrine profissional para reunir sua marca e seus imóveis em um só lugar.', Icon: Building2 },
  { title: 'Kit de divulgação', text: 'Cartazes, QR Code e materiais para redes prontos para cada imóvel publicado.', Icon: Megaphone },
  { title: 'Busca local', text: 'Seus anúncios aparecem por cidade, tipo de imóvel, filtros e mapa do RN.', Icon: MapPin }
];

const heroBenefits = ['Sem comissão', 'Página profissional', 'Contato direto', 'Divulgação incluída'];

const faqItems = [
  {
    question: 'A Potilar cobra comissão?',
    answer: 'Não. A Potilar divulga os imóveis; a negociação continua diretamente entre anunciante e interessado.'
  },
  {
    question: 'O kit de divulgação está incluído?',
    answer: 'Sim. Os planos profissionais incluem materiais para impressão, redes sociais e QR Code exclusivo por imóvel.'
  },
  {
    question: 'Posso divulgar imóveis de várias cidades do RN?',
    answer: 'Sim. A busca foi pensada para Rio Grande do Norte, com páginas por cidade, filtros e mapa.'
  }
];

const planHighlights = [
  {
    name: 'Corretor',
    price: formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true }),
    limit: PLANS.professional.corretor.listingLimit,
    aiCredits: PLANS.professional.corretor.aiCredits,
    activationFee: PLANS.professional.portfolioTrial.activationFees.corretor,
    promotionKit: true,
    features: ['Perfil profissional', 'Gestão dos anúncios', 'Contato direto', 'Estatísticas dos anúncios']
  },
  {
    name: 'Imobiliária',
    price: formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true }),
    limit: PLANS.professional.imobiliaria.listingLimit,
    aiCredits: PLANS.professional.imobiliaria.aiCredits,
    activationFee: PLANS.professional.portfolioTrial.activationFees.imobiliaria,
    featured: true,
    promotionKit: true,
    features: ['Tudo do Corretor', 'Logo da empresa', 'Página própria', 'Gestão centralizada']
  },
  {
    name: 'Imobiliária Plus',
    price: formatPlanPrice(PLANS.professional.plus.price, { perMonth: true }),
    limit: PLANS.professional.plus.listingLimit,
    aiCredits: PLANS.professional.plus.aiCredits,
    activationFee: PLANS.professional.portfolioTrial.activationFees.plus,
    promotionKit: true,
    features: ['Tudo da Imobiliária', 'Página destacada', '3 destaques incluídos', 'Suporte prioritário']
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
  if (planName === 'Corretor') return { id: 'corretor', cta: 'Ativar carteira' };
  if (planName.includes('Plus')) return { id: 'plus', cta: 'Ativar carteira' };
  return { id: 'imobiliaria', cta: 'Ativar carteira' };
}

export default function ImobiliariasPage() {
  return (
    <main className="section-padding bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-12">
        <section className="rounded-[2rem] border border-ocean-900 bg-ocean-900 p-6 text-white shadow-soft md:p-8 lg:px-10 lg:py-9">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ocean-100">Imobiliárias no RN</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-white md:text-5xl lg:text-6xl">
              Imobiliárias no Rio Grande do Norte
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ocean-50 md:text-lg">
              Organize sua carteira, divulgue seus imóveis e fortaleça sua marca em um portal feito para o RN.
            </p>
            <div className="mt-5 inline-flex max-w-xl items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-semibold leading-6 text-white ring-1 ring-white/15">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-sun-300" aria-hidden="true" />
              <span>
                Pague apenas a ativacao agora. A mensalidade do plano comeca em {portfolioTrial.freeDays} dias.
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#planos-profissionais"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-ocean-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Ver planos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {heroBenefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15">
                  <ShieldCheck className="h-4 w-4 text-sun-300" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-sun-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Oferta de lancamento</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
                Mensalidade em {portfolioTrial.freeDays} dias para quem trouxer carteira real.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Na campanha, voce paga a {portfolioTrial.activationName} agora e comeca a mensalidade depois de {portfolioTrial.freeDays} dias.
                Corretores precisam de pelo menos {portfolioTrial.minBrokerListings} imoveis completos; imobiliarias, pelo menos {portfolioTrial.minAgencyListings}.
                Os anuncios precisam ter fotos, preco, cidade e contato valido.
              </p>
            </div>
            <Link href="/mi-cuenta/importar" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
              Importar carteira
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-600">Benefícios</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">O essencial para publicar com padrão profissional.</h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {benefits.map(({ title, text, Icon }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos-profissionais" className="rounded-[2rem] border border-ocean-900 bg-ocean-900 p-6 text-white shadow-soft md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ocean-100">Planos profissionais</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Planos</h2>
            </div>
            <Link href="/planos" className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {planHighlights.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-3xl border p-6 ${
                  plan.featured
                    ? 'border-sun-300 bg-white text-slate-950 shadow-xl'
                    : 'border-white/30 bg-white text-slate-950 shadow-sm'
                }`}
              >
                {plan.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-sun-500 px-3 py-1 text-xs font-bold text-white">
                    Mais popular
                  </span>
                ) : null}
                <h3 className="text-2xl font-semibold text-slate-950">{plan.name}</h3>
                <p className="mt-4 text-3xl font-semibold text-ocean-800">{plan.price}</p>
                <p className="mt-3 rounded-2xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm font-extrabold text-ocean-900">
                  Ativacao agora: {formatPlanPrice(plan.activationFee)}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Mensalidade somente apos {portfolioTrial.freeDays} dias.
                </p>
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                  Até {plan.limit} imóveis ativos
                </p>
                {plan.promotionKit ? (
                  <div className="mt-3 rounded-2xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-ocean-900">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-extrabold">Kit de divulgação profissional</span>
                      <button
                        type="button"
                        className="group relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                        aria-label="O que inclui o kit de divulgação profissional"
                      >
                        <Info className="h-4 w-4" aria-hidden="true" />
                        <span className="pointer-events-none absolute right-0 top-6 z-20 w-72 rounded-xl bg-slate-950 px-3 py-2 text-left text-xs font-semibold leading-5 text-white opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-within:opacity-100">
                          <span className="mb-1 block">Kit de divulgação profissional</span>
                          <span className="mb-1 block font-medium">Incluído no plano.</span>
                          <span className="block">• IA para melhorar anúncios</span>
                          <span className="block">• QR Code exclusivo para cada imóvel</span>
                          <span className="block">• Cartazes para impressão</span>
                          <span className="block">• Materiais para redes sociais</span>
                          <span className="block">• Conteúdos prontos para compartilhar</span>
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}
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

        <section className="grid gap-4 md:grid-cols-3">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>
            </article>
          ))}
        </section>

      </div>
    </main>
  );
}
