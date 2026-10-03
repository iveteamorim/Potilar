import Link from 'next/link';
import { Building2, Check, Sparkles, UserRound } from 'lucide-react';
import ProfessionalPlanCheckoutButton from '@/components/ProfessionalPlanCheckoutButton';
import { getFreeActiveLimit } from '@/lib/listingCapacity';
import { PLANS, formatPlanPrice, type ProfessionalPlanId } from '@/lib/plans';

const signupHref = (account: 'corretor' | 'imobiliaria') =>
  `/login?mode=signup&account=${account}`;

const cards = [
  {
    id: 'corretor' as ProfessionalPlanId,
    name: 'Corretor',
    Icon: UserRound,
    theme: 'blue' as const,
    featured: false,
    eyebrow: 'Comece grátis',
    freeLimit: getFreeActiveLimit('corretor'),
    paidIntro: 'Quando precisar de mais:',
    monthlyPrice: PLANS.professional.corretor.price,
    paidLimit: PLANS.professional.corretor.listingLimit,
    features: [
      'Kit de divulgação profissional',
      'Perfil profissional',
      'Gestão dos anúncios',
      'Contato direto',
      'Estatísticas'
    ],
    primary: { kind: 'signup' as const, href: signupHref('corretor'), label: 'Criar conta grátis' },
    secondary: { label: 'Já quero o plano Corretor' }
  },
  {
    id: 'imobiliaria' as ProfessionalPlanId,
    name: 'Imobiliária',
    Icon: Building2,
    theme: 'green' as const,
    featured: true,
    eyebrow: 'Comece grátis',
    freeLimit: getFreeActiveLimit('imobiliaria'),
    paidIntro: 'Quando sua carteira crescer:',
    monthlyPrice: PLANS.professional.imobiliaria.price,
    paidLimit: PLANS.professional.imobiliaria.listingLimit,
    features: [
      'Kit de divulgação profissional',
      'Logo da empresa',
      'Página própria',
      'Gestão centralizada',
      'Contato direto'
    ],
    primary: { kind: 'signup' as const, href: signupHref('imobiliaria'), label: 'Criar conta grátis' },
    secondary: { label: 'Ativar plano Imobiliária' }
  },
  {
    id: 'plus' as ProfessionalPlanId,
    name: 'Imobiliária Pro',
    Icon: Sparkles,
    theme: 'purple' as const,
    featured: false,
    eyebrow: 'Para carteiras maiores',
    freeLimit: null,
    paidIntro: null,
    monthlyPrice: PLANS.professional.plus.price,
    paidLimit: PLANS.professional.plus.listingLimit,
    features: [
      'Tudo da Imobiliária',
      'Página destacada',
      '3 destaques incluídos',
      'Suporte prioritário'
    ],
    primary: { kind: 'checkout' as const, href: null, label: 'Ativar Imobiliária Pro' },
    secondary: null
  }
];

const themes = {
  blue: {
    card: 'border border-ocean-300',
    icon: 'bg-ocean-50 text-ocean-700',
    eyebrow: 'bg-ocean-50 text-ocean-800',
    price: 'text-ocean-700',
    check: 'text-ocean-600',
    primary:
      'inline-flex w-full items-center justify-center rounded-xl bg-ocean-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ocean-800',
    secondary: 'text-ocean-800'
  },
  green: {
    card: 'border-2 border-green-500',
    icon: 'bg-green-50 text-green-700',
    eyebrow: 'bg-green-50 text-green-800',
    price: 'text-green-600',
    check: 'text-green-600',
    primary:
      'inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-green-700',
    secondary: 'text-green-800'
  },
  purple: {
    card: 'border border-violet-300',
    icon: 'bg-violet-50 text-violet-700',
    eyebrow: 'bg-violet-50 text-violet-800',
    price: 'text-violet-700',
    check: 'text-violet-600',
    primary:
      'inline-flex w-full items-center justify-center rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-800',
    secondary: 'text-violet-800'
  }
};

type Props = {
  contactHref: string;
};

export default function ProfessionalPlanCards({ contactHref }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
      {cards.map((plan) => {
        const theme = themes[plan.theme];

        return (
          <article
            key={plan.id}
            className={`relative flex h-full flex-col rounded-3xl bg-white p-6 text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white ${theme.card}`}
          >
            {plan.featured ? (
              <span className="absolute -top-3 right-5 rounded-full bg-green-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
                Mais popular
              </span>
            ) : null}

            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${theme.icon}`}>
                <plan.Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="whitespace-nowrap text-xl font-bold">{plan.name}</h3>
            </div>

            <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] ${theme.eyebrow}`}>
              {plan.eyebrow}
            </p>

            <p className="mt-3 min-h-[1.75rem] text-lg font-semibold text-slate-950 dark:text-white">
              {plan.freeLimit != null ? `Até ${plan.freeLimit} imóveis ativos grátis` : '\u00A0'}
            </p>

            <p className="mt-4 min-h-[1rem] text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              {plan.paidIntro ?? '\u00A0'}
            </p>

            <p className={`mt-1 text-[2.05rem] font-extrabold leading-none ${theme.price}`}>
              {formatPlanPrice(plan.monthlyPrice)}
              <span className="text-base font-semibold text-slate-500">/mês</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Até {plan.paidLimit} imóveis ativos
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${theme.check}`} aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3">
              {plan.primary.kind === 'signup' && plan.primary.href ? (
                <Link href={plan.primary.href} className={theme.primary}>
                  {plan.primary.label}
                </Link>
              ) : (
                <ProfessionalPlanCheckoutButton
                  planId={plan.id}
                  fallbackHref={contactHref}
                  className={theme.primary}
                  showRepeatIcon={false}
                  showArrow={false}
                  loadingLabel="Abrindo checkout..."
                >
                  {plan.primary.label}
                </ProfessionalPlanCheckoutButton>
              )}

              {plan.secondary ? (
                <ProfessionalPlanCheckoutButton
                  planId={plan.id}
                  fallbackHref={contactHref}
                  className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold underline-offset-2 hover:underline ${theme.secondary}`}
                  showRepeatIcon={false}
                  showArrow={false}
                  loadingLabel="Abrindo checkout..."
                >
                  {plan.secondary.label}
                </ProfessionalPlanCheckoutButton>
              ) : (
                <div className="h-10" aria-hidden="true" />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
