import { PLANS, getProfessionalPlan, type ProfessionalPlanId } from '@/lib/plans';

export type CapacityAccountType = 'particular' | 'corretor' | 'imobiliaria';

export const CAPACITY_ACTIVE_STATUSES = ['approved', 'pending'] as const;
export const CAPACITY_INACTIVE_STATUSES = ['paused', 'needs_renewal', 'rejected', 'draft'] as const;

export type CapacityActiveStatus = (typeof CAPACITY_ACTIVE_STATUSES)[number];
export type PublicationKind = 'free' | 'avulso' | 'plan';

export type CapacityListing = {
  id?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  publication_kind?: string | null;
  payment_status?: string | null;
  payment_confirmed_at?: string | null;
  listing_expires_at?: string | null;
  payment_amount?: number | string | null;
};

export type CapacityDecision =
  | {
      action: 'allow_free';
      publicationKind: 'free';
    }
  | {
      action: 'allow_plan';
      publicationKind: 'plan';
    }
  | {
      action: 'require_avulso';
      publicationKind: 'avulso';
      product: 'listing_publication';
      amount: number;
      durationDays: number;
    };

export type CapacityInput = {
  accountType?: string | null;
  professionalPlan?: string | null;
  activeCount: number;
  isAdmin?: boolean;
  isSeasonal?: boolean;
};

export type CapacitySnapshot = {
  accountType: CapacityAccountType;
  professionalPlan: ProfessionalPlanId | null;
  hasPlan: boolean;
  isAdmin: boolean;
  activeCount: number;
  freeLimit: number;
  paidLimit: number | null;
  coveredLimit: number;
  freeUsed: number;
  extraActiveCount: number;
  avulsoActiveCount: number;
  importableSlots: number;
  decision: CapacityDecision;
  avulsoCostAfterPublish: number;
  recommendedPlan: ProfessionalPlanId | null;
  recommendPlan: boolean;
  highlightPlan: boolean;
  nearPlan: boolean;
};

export const OWNER_WRITABLE_PAYMENT_STATUSES = ['not_required', 'pix_pending'] as const;

export type OwnerPaymentWrite = {
  payment_status?: string | null;
  payment_confirmed_at?: string | null;
  listing_expires_at?: string | null;
  featured_payment_status?: string | null;
};

export type OwnerPaymentWriteResult = { ok: true } | { ok: false; reason: string };

// Future improvement: a dedicated purchase ledger (individual_listing_purchase)
// for full avulso history and renewals. listings.* is enough for this release
// if confirmation stays server-side and expiration/renewal keep operational state.

export function normalizeAccountType(value?: string | null): CapacityAccountType {
  if (value === 'corretor' || value === 'imobiliaria') return value;
  return 'particular';
}

export function getFreeActiveLimit(accountType?: string | null): number {
  const normalized = normalizeAccountType(accountType);
  if (normalized === 'corretor') return 3;
  if (normalized === 'imobiliaria') return 10;
  return 2;
}

export function getPaidActiveLimit(professionalPlan?: string | null): number | null {
  const selectedPlan = getProfessionalPlan(professionalPlan);
  return selectedPlan?.listingLimit ?? null;
}

export function getCoveredActiveLimit(accountType?: string | null, professionalPlan?: string | null): number {
  return getPaidActiveLimit(professionalPlan) ?? getFreeActiveLimit(accountType);
}

export function isCapacityActiveStatus(status?: string | null): boolean {
  return status === 'approved' || status === 'pending';
}

export function countCapacityActiveListings(listings: CapacityListing[], excludeListingId?: string | null): number {
  return listings.filter((listing) => {
    if (excludeListingId && listing.id === excludeListingId) return false;
    return isCapacityActiveStatus(listing.status);
  }).length;
}

export function isTrustedPaidAvulso(listing: CapacityListing): boolean {
  return (
    listing.payment_status === 'confirmed' &&
    Boolean(listing.payment_confirmed_at) &&
    Boolean(listing.listing_expires_at)
  );
}

export function isAvulsoListing(listing: CapacityListing): boolean {
  return isTrustedPaidAvulso(listing);
}

export function listingCanOccupyExtraSlot(listing: Pick<CapacityListing, 'payment_status' | 'payment_confirmed_at'>): boolean {
  if (listing.payment_status === 'pix_pending') return true;
  return listing.payment_status === 'confirmed' && Boolean(listing.payment_confirmed_at);
}

export function ownerPaymentWriteAllowed(
  incoming: OwnerPaymentWrite,
  previous?: OwnerPaymentWrite | null
): OwnerPaymentWriteResult {
  const isInsert = previous == null;

  if (incoming.payment_status === 'confirmed') {
    if (isInsert || previous.payment_status !== 'confirmed') {
      return { ok: false, reason: 'PAYMENT_CONFIRMATION_NOT_ALLOWED' };
    }
  } else if (
    incoming.payment_status != null &&
    !OWNER_WRITABLE_PAYMENT_STATUSES.includes(incoming.payment_status as (typeof OWNER_WRITABLE_PAYMENT_STATUSES)[number])
  ) {
    return { ok: false, reason: 'PAYMENT_STATUS_NOT_ALLOWED' };
  }

  if (isInsert) {
    if (incoming.payment_confirmed_at) return { ok: false, reason: 'PAYMENT_EVIDENCE_NOT_ALLOWED' };
    if (incoming.listing_expires_at) return { ok: false, reason: 'PAYMENT_EVIDENCE_NOT_ALLOWED' };
    if (incoming.featured_payment_status === 'confirmed') {
      return { ok: false, reason: 'PAYMENT_CONFIRMATION_NOT_ALLOWED' };
    }
    return { ok: true };
  }

  if (
    incoming.payment_confirmed_at !== undefined &&
    incoming.payment_confirmed_at !== previous.payment_confirmed_at
  ) {
    return { ok: false, reason: 'PAYMENT_EVIDENCE_NOT_ALLOWED' };
  }

  if (incoming.listing_expires_at !== undefined && incoming.listing_expires_at !== previous.listing_expires_at) {
    return { ok: false, reason: 'PAYMENT_EVIDENCE_NOT_ALLOWED' };
  }

  if (incoming.featured_payment_status === 'confirmed' && previous.featured_payment_status !== 'confirmed') {
    return { ok: false, reason: 'PAYMENT_CONFIRMATION_NOT_ALLOWED' };
  }

  return { ok: true };
}

export function getRecommendedCapacityPlan(
  accountType?: string | null,
  professionalPlan?: string | null
): ProfessionalPlanId | null {
  const normalized = normalizeAccountType(accountType);
  const currentPlan = getProfessionalPlan(professionalPlan);

  if (normalized === 'corretor' && currentPlan == null) return 'corretor';
  if (normalized === 'imobiliaria' && currentPlan == null) return 'imobiliaria';
  if (normalized === 'imobiliaria' && currentPlan?.id === 'imobiliaria') return 'plus';
  return null;
}

export function extrasNeededToBeatPlan(planPrice: number, avulsoPrice = PLANS.listing.avulsoPrice): number {
  if (avulsoPrice <= 0) return Number.POSITIVE_INFINITY;
  return Math.ceil(planPrice / avulsoPrice);
}

export function resolvePlanRecommendation(input: {
  accountType?: string | null;
  professionalPlan?: string | null;
  extrasAfterPublish: number;
}) {
  const recommendedPlan = getRecommendedCapacityPlan(input.accountType, input.professionalPlan);
  if (!recommendedPlan) {
    return { recommendedPlan: null, recommendPlan: false, highlightPlan: false, nearPlan: false };
  }

  const currentPlan = getProfessionalPlan(input.professionalPlan);
  const currentPlanPrice = currentPlan?.price ?? 0;
  const planPrice = Math.max(0, PLANS.professional[recommendedPlan].price - currentPlanPrice);
  const avulsoPrice = PLANS.listing.avulsoPrice;
  const extrasNeeded = extrasNeededToBeatPlan(planPrice, avulsoPrice);
  const avulsoTotal = input.extrasAfterPublish * avulsoPrice;
  const highlightPlan = avulsoTotal >= planPrice;
  const nearPlan = !highlightPlan && input.extrasAfterPublish === extrasNeeded - 1;

  return {
    recommendedPlan,
    recommendPlan: highlightPlan || nearPlan,
    highlightPlan,
    nearPlan
  };
}

export function getAvulsoOffer(_accountType?: string | null) {
  return {
    product: 'listing_publication' as const,
    amount: PLANS.listing.avulsoPrice,
    durationDays: PLANS.listing.avulsoDurationDays
  };
}

export function isPlanAllowedForAccount(accountType?: string | null, planId?: string | null) {
  const normalized = normalizeAccountType(accountType);
  if (normalized === 'corretor') return planId === 'corretor';
  if (normalized === 'imobiliaria') return planId === 'imobiliaria' || planId === 'plus';
  return false;
}

export function resolveListingCapacity(input: CapacityInput): CapacityDecision {
  if (input.isAdmin) {
    return { action: 'allow_free', publicationKind: 'free' };
  }

  const accountType = normalizeAccountType(input.accountType);
  const paidLimit = getPaidActiveLimit(input.professionalPlan);
  const freeLimit = getFreeActiveLimit(accountType);
  const hasPlan = paidLimit != null;

  const coveredLimit = hasPlan && paidLimit != null ? paidLimit : freeLimit;

  if (input.activeCount < coveredLimit) {
    return hasPlan ? { action: 'allow_plan', publicationKind: 'plan' } : { action: 'allow_free', publicationKind: 'free' };
  }

  const avulso = getAvulsoOffer(accountType);
  return {
    action: 'require_avulso',
    publicationKind: 'avulso',
    product: avulso.product,
    amount: avulso.amount,
    durationDays: avulso.durationDays
  };
}

export function getImportableSlotCount(input: Omit<CapacityInput, 'isSeasonal'>): number {
  if (input.isAdmin) return Number.POSITIVE_INFINITY;

  const decision = resolveListingCapacity({ ...input, isSeasonal: false });
  if (decision.action === 'allow_free' || decision.action === 'allow_plan') {
    const coveredLimit = getCoveredActiveLimit(input.accountType, input.professionalPlan);
    return Math.max(0, coveredLimit - input.activeCount);
  }

  return 0;
}

export function selectListingsToKeepAfterPlanLoss<T extends CapacityListing>(listings: T[], freeLimit: number): T[] {
  return [...listings]
    .filter((listing) => isCapacityActiveStatus(listing.status))
    .sort((left, right) => {
      const leftUpdated = new Date(left.updated_at || left.created_at || 0).getTime();
      const rightUpdated = new Date(right.updated_at || right.created_at || 0).getTime();
      if (rightUpdated !== leftUpdated) return rightUpdated - leftUpdated;
      return String(right.id ?? '').localeCompare(String(left.id ?? ''));
    })
    .slice(0, Math.max(0, freeLimit));
}

export function buildCapacitySnapshot(input: CapacityInput & { listings?: CapacityListing[] }): CapacitySnapshot {
  const accountType = normalizeAccountType(input.accountType);
  const selectedPlan = getProfessionalPlan(input.professionalPlan);
  const professionalPlan: ProfessionalPlanId | null = selectedPlan?.id === 'corretor' || selectedPlan?.id === 'imobiliaria' || selectedPlan?.id === 'plus'
    ? selectedPlan.id
    : null;
  const freeLimit = getFreeActiveLimit(accountType);
  const paidLimit = getPaidActiveLimit(professionalPlan);
  const decision = resolveListingCapacity(input);
  const listings = input.listings ?? [];
  const avulsoActiveCount = listings.filter(
    (listing) => isCapacityActiveStatus(listing.status) && isAvulsoListing(listing)
  ).length;
  const coveredLimit = getCoveredActiveLimit(accountType, professionalPlan);
  const freeUsed = Math.min(input.activeCount, freeLimit);
  const extraActiveCount = Math.max(0, input.activeCount - coveredLimit);
  const extrasAfterPublish = Math.max(0, input.activeCount + 1 - coveredLimit);
  const avulsoOffer = getAvulsoOffer(accountType);
  const planRecommendation = resolvePlanRecommendation({
    accountType,
    professionalPlan,
    extrasAfterPublish
  });

  return {
    accountType,
    professionalPlan,
    hasPlan: paidLimit != null,
    isAdmin: Boolean(input.isAdmin),
    activeCount: input.activeCount,
    freeLimit,
    paidLimit,
    coveredLimit,
    freeUsed,
    extraActiveCount,
    avulsoActiveCount,
    importableSlots: getImportableSlotCount(input),
    decision,
    avulsoCostAfterPublish: extrasAfterPublish * avulsoOffer.amount,
    recommendedPlan: planRecommendation.recommendedPlan,
    recommendPlan: planRecommendation.recommendPlan,
    highlightPlan: planRecommendation.highlightPlan,
    nearPlan: planRecommendation.nearPlan
  };
}

export function getDashboardUsageLabel(
  snapshot: Pick<CapacitySnapshot, 'hasPlan' | 'activeCount' | 'paidLimit' | 'freeUsed' | 'freeLimit' | 'avulsoActiveCount' | 'extraActiveCount' | 'coveredLimit'>
): string {
  const extras = snapshot.extraActiveCount > 0 ? snapshot.extraActiveCount : snapshot.avulsoActiveCount;

  if (snapshot.hasPlan && snapshot.paidLimit != null && extras > 0) {
    return `${snapshot.paidLimit} do plano + ${extras} anúncios avulsos ativos`;
  }

  if (snapshot.hasPlan && snapshot.paidLimit != null) {
    return `${snapshot.activeCount} de ${snapshot.paidLimit} imóveis utilizados`;
  }

  if (extras > 0) {
    return `${snapshot.freeLimit} grátis + ${extras} anúncios avulsos ativos`;
  }

  return `${snapshot.freeUsed} de ${snapshot.freeLimit} imóveis grátis utilizados`;
}

export function getCapacityBlockMessage(decision: CapacityDecision): string {
  if (decision.action === 'require_avulso') {
    return `Este imóvel exige um anúncio avulso de ${decision.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por ${decision.durationDays} dias.`;
  }

  return '';
}
