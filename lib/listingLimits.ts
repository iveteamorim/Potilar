import { PLANS } from '@/lib/plans';

export type AccountType = 'particular' | 'corretor' | 'imobiliaria';

const ACTIVE_LISTING_STATUSES = ['approved', 'pending', 'paused'] as const;

export function getActiveListingStatuses() {
  return ACTIVE_LISTING_STATUSES;
}

export function getListingLimitForAccount(accountType: AccountType | string | null | undefined, isAdmin = false) {
  if (isAdmin) return Number.POSITIVE_INFINITY;

  if (accountType === 'corretor') {
    return PLANS.professional.corretor.listingLimit;
  }

  if (accountType === 'imobiliaria') {
    return PLANS.professional.imobiliaria.listingLimit;
  }

  return Number.POSITIVE_INFINITY;
}

export function getListingLimitLabel(accountType: AccountType | string | null | undefined) {
  const limit = getListingLimitForAccount(accountType);
  if (!Number.isFinite(limit)) return 'sem limite fixo de anuncios ativos';

  if (accountType === 'corretor') {
    return `ate ${limit} anuncios ativos no Plano Corretor`;
  }

  if (accountType === 'imobiliaria') {
    return `ate ${limit} anuncios ativos no Plano Imobiliaria`;
  }

  return `ate ${limit} anuncios ativos`;
}
