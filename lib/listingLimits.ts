import { getProfessionalPlan } from '@/lib/plans';
import {
  CAPACITY_ACTIVE_STATUSES,
  getCoveredActiveLimit,
  getFreeActiveLimit,
  normalizeAccountType
} from '@/lib/listingCapacity';

export type AccountType = 'particular' | 'corretor' | 'imobiliaria';

export function getActiveListingStatuses() {
  return CAPACITY_ACTIVE_STATUSES;
}

export function getListingLimitForAccount(
  accountType: AccountType | string | null | undefined,
  isAdmin = false,
  professionalPlan?: string | null
) {
  if (isAdmin) return Number.POSITIVE_INFINITY;
  return getCoveredActiveLimit(accountType, professionalPlan);
}

export function getListingLimitLabel(accountType: AccountType | string | null | undefined, professionalPlan?: string | null) {
  const selectedPlan = getProfessionalPlan(professionalPlan);
  const limit = getListingLimitForAccount(accountType, false, professionalPlan);
  if (!Number.isFinite(limit)) return 'sem limite fixo de anuncios ativos';

  if (selectedPlan) {
    return `ate ${limit} anuncios ativos no ${selectedPlan.label}`;
  }

  const normalized = normalizeAccountType(accountType);
  if (normalized === 'corretor') {
    return `ate ${getFreeActiveLimit(normalized)} imoveis ativos gratis`;
  }

  if (normalized === 'imobiliaria') {
    return `ate ${getFreeActiveLimit(normalized)} imoveis ativos gratis`;
  }

  return `ate ${limit} anuncios ativos gratis`;
}
