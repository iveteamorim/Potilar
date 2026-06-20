export function isListingExpired(listingExpiresAt?: string | null, now = Date.now()) {
  if (!listingExpiresAt) return false;
  const expiresAt = new Date(listingExpiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= now;
}

export function isFeaturedExpired(featuredExpiresAt?: string | null, now = Date.now()) {
  if (!featuredExpiresAt) return false;
  const expiresAt = new Date(featuredExpiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= now;
}

type FeaturedListingFields = {
  featured_plan?: string | null;
  featured_payment_status?: string | null;
  featured_starts_at?: string | null;
  featured_expires_at?: string | null;
};

/** Destaque ativo somente com Pix confirmado e data de fim no futuro. */
export function isActiveFeaturedListing(row: FeaturedListingFields, now = Date.now()) {
  if (!row.featured_plan || row.featured_payment_status !== 'confirmed') {
    return false;
  }

  if (!row.featured_expires_at) {
    return false;
  }

  const expiresAt = new Date(row.featured_expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return false;
  }

  if (row.featured_starts_at) {
    const startsAt = new Date(row.featured_starts_at).getTime();
    if (Number.isFinite(startsAt) && startsAt > now) {
      return false;
    }
  }

  return true;
}

export const CLEARED_HIGHLIGHT_FIELDS = {
  featured_plan: null,
  featured_payment_status: 'not_requested' as const,
  featured_payment_amount: null,
  featured_starts_at: null,
  featured_expires_at: null
};

export function getPublicListingExpiryFilterIso(now = new Date()) {
  return now.toISOString();
}
