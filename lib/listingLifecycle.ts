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

export function getPublicListingExpiryFilterIso(now = new Date()) {
  return now.toISOString();
}
