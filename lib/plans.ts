export type FeaturedPlanId = '7_days' | '30_days' | 'super_30_days';

export const PLANS = {
  listing: {
    firstFree: true,
    /** Promocao de lancamento: anuncios gratuitos por conta antes do Pix */
    freeListingLimit: 3,
    additionalPrice: 19.9,
    seasonalPrice: 19.9,
    seasonalRenewalPrice: 9.9,
    standardDurationDays: 90,
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

export function getFreeListingLimit() {
  return PLANS.listing.freeListingLimit;
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
