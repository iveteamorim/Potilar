export type FeaturedPlanId = '7_days' | '30_days' | 'super_30_days';

export const PLANS = {
  listing: {
    firstFree: true,
    /** Promocao de lancamento ate setembro/2026 */
    launchPromo: {
      freeListingLimit: 3,
      /** Fim da promo: 30/set/2026 23:59 (horario de Brasilia) */
      endsAtIso: '2026-10-01T02:59:59.999Z'
    },
    /** Apos a promo de lancamento */
    standardFreeListingLimit: 1,
    additionalPrice: 19.9,
    seasonalPrice: 19.9,
    seasonalRenewalPrice: 9.9,
    standardDurationDays: 60,
    seasonalDurationDays: 60,
    seasonalRenewalNoticeDays: 7
  },
  highlights: {
    '7_days': { label: 'Destaque 7 dias', days: 7, price: 9.99 },
    '30_days': { label: 'Destaque 30 dias', days: 30, price: 19.99 },
    super_30_days: { label: 'Super destaque 30 dias', days: 30, price: 49.99 }
  } satisfies Record<FeaturedPlanId, { label: string; days: number; price: number }>,
  professional: {
    corretor: { label: 'Plano Corretor', price: 149.9, listingLimit: 10 },
    imobiliaria: { label: 'Plano Imobiliaria', price: 249.9, listingLimit: 50 },
    plus: { label: 'Plano Imobiliaria Plus', price: 399.9, listingLimit: 100 }
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
    ? `3 anuncios gratis ate ${getLaunchPromoDeadlineLabel()}`
    : '1 anuncio gratis';
}

export function formatPlanPrice(value: number, options?: { perMonth?: boolean }) {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return options?.perMonth ? `R$ ${formatted}/mes` : `R$ ${formatted}`;
}

export function getHighlightPrice(plan: FeaturedPlanId) {
  return PLANS.highlights[plan].price;
}

export function getHighlightLabel(plan: FeaturedPlanId) {
  return PLANS.highlights[plan].label;
}

export function getHighlightDurationDays(plan?: string | null) {
  if (plan === '7_days') return PLANS.highlights['7_days'].days;
  if (plan === '30_days') return PLANS.highlights['30_days'].days;
  if (plan === 'super_30_days') return PLANS.highlights.super_30_days.days;
  return PLANS.highlights['30_days'].days;
}
