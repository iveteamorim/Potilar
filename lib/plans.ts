export type FeaturedPlanId = '7_days' | '15_days' | '30_days';
export type ProfessionalPlanId = 'corretor' | 'imobiliaria' | 'plus';
export type ProfessionalBillingMode = 'launch_offer' | 'standard_subscription';

export const DEFAULT_PROFESSIONAL_BILLING_MODE: ProfessionalBillingMode = 'launch_offer';

export function resolveProfessionalBillingMode(value?: string | null): ProfessionalBillingMode {
  return value === 'standard_subscription' ? 'standard_subscription' : DEFAULT_PROFESSIONAL_BILLING_MODE;
}

export const PLANS = {
  listing: {
    firstFree: true,
    /** Promocao de lancamento ate setembro/2026 */
    launchPromo: {
      freeListingLimit: 1,
      /** Fim da promo: 30/set/2026 23:59 (horario de Brasilia) */
      endsAtIso: '2026-10-01T02:59:59.999Z'
    },
    /** Apos a promo de lancamento */
    standardFreeListingLimit: 1,
    additionalPrice: 19.9,
    seasonalPrice: 29.9,
    seasonalRenewal30Price: 19.9,
    seasonalRenewal60Price: 24.9,
    seasonalRenewalPrice: 24.9,
    standardDurationDays: 60,
    seasonalDurationDays: 60,
    seasonalRenewal30DurationDays: 30,
    seasonalRenewal60DurationDays: 60,
    seasonalRenewalNoticeDays: 7
  },
  highlights: {
    '7_days': { label: 'Destaque 7 dias', days: 7, price: 9.9 },
    '15_days': { label: 'Destaque 15 dias', days: 15, price: 17.9 },
    '30_days': { label: 'Destaque 30 dias', days: 30, price: 24.9 }
  } satisfies Record<FeaturedPlanId, { label: string; days: number; price: number }>,
  professional: {
    portfolioTrial: {
      freeMonths: 2,
      freeDays: 60,
      activationName: 'Ativacao de Carteira Profissional',
      activationFees: {
        corretor: 79,
        imobiliaria: 199,
        plus: 299
      },
      minBrokerListings: 5,
      minAgencyListings: 15,
      validUntilLabel: 'campanha de lancamento'
    },
    corretor: { label: 'Plano Corretor', price: 199.9, listingLimit: 10, aiCredits: 5 },
    imobiliaria: { label: 'Plano Imobiliaria', price: 349.9, listingLimit: 30, aiCredits: 15 },
    plus: { label: 'Plano Imobiliaria Plus', price: 599.9, listingLimit: 75, aiCredits: 30 }
  } satisfies Record<ProfessionalPlanId, { label: string; price: number; listingLimit: number; aiCredits: number }> & {
    portfolioTrial: {
      freeMonths: number;
      freeDays: number;
      activationName: string;
      activationFees: Record<ProfessionalPlanId, number>;
      minBrokerListings: number;
      minAgencyListings: number;
      validUntilLabel: string;
    };
  }
} as const;

export function isLaunchPromoActive(now = new Date()) {
  const endsAt = new Date(PLANS.listing.launchPromo.endsAtIso).getTime();
  return Number.isFinite(endsAt) && now.getTime() < endsAt;
}

export function getFreeListingLimit(now = new Date()) {
  return isLaunchPromoActive(now)
    ? PLANS.listing.launchPromo.freeListingLimit
    : PLANS.listing.standardFreeListingLimit;
}

export function getLaunchPromoDeadlineLabel() {
  return 'setembro de 2026';
}

export function getLaunchPromoShortLabel() {
  return isLaunchPromoActive()
    ? `1 anúncio grátis até ${getLaunchPromoDeadlineLabel()}`
    : '1 anúncio grátis';
}

export function formatPlanPrice(value: number, options?: { perMonth?: boolean }) {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return options?.perMonth ? `R$ ${formatted}/mes` : `R$ ${formatted}`;
}

export function getProfessionalPlan(planId?: string | null) {
  if (planId === 'corretor' || planId === 'imobiliaria' || planId === 'plus') {
    return { id: planId, ...PLANS.professional[planId] };
  }

  return null;
}

export function getProfessionalAccountType(planId: ProfessionalPlanId) {
  return planId === 'corretor' ? 'corretor' : 'imobiliaria';
}

export function getHighlightPrice(plan: FeaturedPlanId) {
  return PLANS.highlights[plan].price;
}

export function getHighlightLabel(plan?: string | null) {
  if (plan === 'super_30_days') return 'Super destaque 30 dias';
  if (plan !== '7_days' && plan !== '15_days' && plan !== '30_days') return 'Destaque';
  return PLANS.highlights[plan].label;
}

export function getHighlightDurationDays(plan?: string | null) {
  if (plan === '7_days') return PLANS.highlights['7_days'].days;
  if (plan === '15_days') return PLANS.highlights['15_days'].days;
  if (plan === '30_days' || plan === 'super_30_days') return 30;
  return PLANS.highlights['30_days'].days;
}
