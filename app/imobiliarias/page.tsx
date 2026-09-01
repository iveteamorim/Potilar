import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Gift,
  Info,
  Lock,
  MapPin,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound
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
    id: 'corretor' as ProfessionalPlanId,
    name: 'Corretor',
    Icon: UserRound,
    monthlyPrice: PLANS.professional.corretor.price,
    limit: PLANS.professional.corretor.listingLimit,
    activationFee: PLANS.professional.portfolioTrial.activationFees.corretor,
    featured: false,
    theme: 'blue' as const,
    features: [
      `Até ${PLANS.professional.corretor.listingLimit} imóveis ativos`,
      'Kit de divulgação profissional',
      'Perfil profissional',
      'Gestão dos anúncios',
      'Contato direto',
      'Estatísticas dos anúncios'
    ]
  },
  {
    id: 'imobiliaria' as ProfessionalPlanId,
    name: 'Imobiliária',
    Icon: Building2,
    monthlyPrice: PLANS.professional.imobiliaria.price,
    limit: PLANS.professional.imobiliaria.listingLimit,
    activationFee: PLANS.professional.portfolioTrial.activationFees.imobiliaria,
    featured: true,
    theme: 'green' as const,
    features: [
      `Até ${PLANS.professional.imobiliaria.listingLimit} imóveis ativos`,
      'Kit de divulgação profissional',
      'Tudo do plano Corretor',
      'Logo da empresa',
      'Página própria',
      'Gestão centralizada'
    ]
  },
  {
    id: 'plus' as ProfessionalPlanId,
    name: 'Imobiliária Plus',
    Icon: Sparkles,
    monthlyPrice: PLANS.professional.plus.price,
    limit: PLANS.professional.plus.listingLimit,
    activationFee: PLANS.professional.portfolioTrial.activationFees.plus,
    featured: false,
    theme: 'purple' as const,
    features: [
      `Até ${PLANS.professional.plus.listingLimit} imóveis ativos`,
      'Kit de divulgação profissional',
      'Tudo da Imobiliária',
      'Página destacada',
      '3 destaques incluídos',
      'Suporte prioritário'
    ]
  }
];

const planThemes = {
  blue: {
    card: 'border border-ocean-300',
    icon: 'bg-ocean-50 text-ocean-700',
    label: 'text-ocean-600',
    price: 'text-ocean-700',
    trial: 'bg-ocean-50 text-ocean-800',
    check: 'text-ocean-600',
    button:
      'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-60'
  },
  green: {
    card: 'border-2 border-green-500',
    icon: 'bg-green-50 text-green-700',
    label: 'text-green-600',
    price: 'text-green-600',
    trial: 'bg-green-50 text-green-800',
    check: 'text-green-600',
    button:
      'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60'
  },
  purple: {
    card: 'border border-violet-300',
    icon: 'bg-violet-50 text-violet-700',
    label: 'text-violet-600',
    price: 'text-violet-700',
    trial: 'bg-violet-50 text-violet-800',
    check: 'text-violet-600',
    button:
      'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60'
  }
};

function CheckItem({ children, className }: { children: string; className: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
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
                Pague a ativacao da carteira hoje. A mensalidade do plano comeca em {portfolioTrial.freeDays} dias.
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

        <section id="planos-profissionais" className="rounded-[2rem] bg-ocean-900 p-5 text-white shadow-soft sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <h2 className="font-display text-4xl text-white md:text-5xl">Planos</h2>
                <div className="inline-flex max-w-xl flex-wrap items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                  <span className="inline-flex items-center rounded-full bg-agreste-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-agreste-800">
                    Oferta de lançamento
                  </span>
                  <span className="text-sm font-medium text-white">
                    Ative agora e comece a mensalidade somente após {portfolioTrial.freeDays} dias.
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-ocean-50 sm:text-base">
                Escolha o plano ideal para sua atuação e comece a vender mais.
              </p>
            </div>
            <Link href="/planos" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ocean-200 hover:text-white">
              Ver detalhes dos planos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3 lg:items-start">
            {planHighlights.map((plan) => {
              const theme = planThemes[plan.theme];
              return (
                <article
                  key={plan.name}
                  className={`relative rounded-3xl bg-white p-6 text-slate-950 shadow-sm ${theme.card} ${plan.featured ? 'lg:-mt-2 lg:pb-7' : ''}`}
                >
                  {plan.featured ? (
                    <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-green-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      Mais popular
                    </span>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-full ${theme.icon}`}>
                      <plan.Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                  </div>

                  <p className={`mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] ${theme.label}`}>
                    Pague agora (ativação)
                  </p>
                  <p className={`mt-1 text-[2.15rem] font-extrabold leading-none ${theme.price}`}>
                    {formatPlanPrice(plan.activationFee)}
                  </p>
                  <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${theme.trial}`}>
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {portfolioTrial.freeDays} dias de acesso completo
                  </p>

                  <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${theme.label}`}>
                          Depois disso
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-950">
                          {formatPlanPrice(plan.monthlyPrice)}
                          <span className="text-sm font-semibold text-slate-500">/mês</span>
                        </p>
                      </div>
                      <p className="pb-1 text-right text-[11px] leading-4 text-slate-400">
                        Cobrança mensal automática
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feature) => (
                      <CheckItem key={feature} className={theme.check}>
                        {feature}
                      </CheckItem>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <ProfessionalPlanCheckoutButton
                      planId={plan.id}
                      fallbackHref={contactHref}
                      className={theme.button}
                      showRepeatIcon={false}
                    >
                      {`Ativar por ${formatPlanPrice(plan.activationFee)}`}
                    </ProfessionalPlanCheckoutButton>
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Pagamento 100% seguro
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm leading-6 text-ocean-50 ring-1 ring-white/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-ocean-200" aria-hidden="true" />
            <p>Sem fidelidade. Cancele quando quiser. Sua carteira continua ativa até o fim do período pago.</p>
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
