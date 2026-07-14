import { PLANS, getProfessionalPlan } from '@/lib/plans';

export type AccountType = 'particular' | 'corretor' | 'imobiliaria';

const ACTIVE_LISTING_STATUSES = ['approved', 'pending', 'paused'] as const;

export function getActiveListingStatuses() {
  return ACTIVE_LISTING_STATUSES;
}

export function getListingLimitForAccount(
  accountType: AccountType | string | null | undefined,
  isAdmin = false,
  professionalPlan?: string | null
) {
  if (isAdmin) return Number.POSITIVE_INFINITY;

  const selectedPlan = getProfessionalPlan(professionalPlan);
  if (selectedPlan) {
    return selectedPlan.listingLimit;
  }

  if (accountType === 'corretor') {
    return PLANS.professional.corretor.listingLimit;
  }

  if (accountType === 'imobiliaria') {
    return PLANS.professional.imobiliaria.listingLimit;
  }

  return Number.POSITIVE_INFINITY;
}

export function getListingLimitLabel(accountType: AccountType | string | null | undefined, professionalPlan?: string | null) {
  const selectedPlan = getProfessionalPlan(professionalPlan);
  const limit = getListingLimitForAccount(accountType, false, professionalPlan);
  if (!Number.isFinite(limit)) return 'sem limite fixo de anuncios ativos';

  if (selectedPlan) {
    return `ate ${limit} anuncios ativos no ${selectedPlan.label}`;
  }

  if (accountType === 'corretor') {
    return `ate ${limit} anuncios ativos no Plano Corretor`;
  }

  if (accountType === 'imobiliaria') {
    return `ate ${limit} anuncios ativos no Plano Imobiliaria`;
  }

  return `ate ${limit} anuncios ativos`;
}
