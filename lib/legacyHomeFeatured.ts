import type { Property } from '@/data/properties';

/** A partir desta data, destaque na home e topo das listas exige pagamento confirmado. */
const FEATURED_PAYMENTS_START_ISO =
  process.env.FEATURED_PAYMENTS_START_ISO ?? '2026-07-15T03:00:00.000Z';

const featuredPaymentsStartMs = new Date(FEATURED_PAYMENTS_START_ISO).getTime();

function getListingCreatedMs(property: Property) {
  const value = property.createdAt ?? property.updatedAt;
  if (!value) return 0;
  const createdMs = new Date(value).getTime();
  return Number.isFinite(createdMs) ? createdMs : 0;
}

/** Anuncios publicados antes do corte: regalo admin fijo en carrusel y listas. */
export function isLegacyAdminGiftFeatured(property: Property) {
  if (!Number.isFinite(featuredPaymentsStartMs)) return false;
  return getListingCreatedMs(property) < featuredPaymentsStartMs;
}

/** Destaque pago (Pix) o cortesia confirmada no painel admin (`grantHighlight`). */
export function isPaidOrGrantedFeatured(property: Property) {
  return property.isFeatured;
}

/** Debe aparecer en el carrusel "Imoveis em destaque" de la home. */
export function showsInHomeFeaturedCarousel(property: Property) {
  return isPaidOrGrantedFeatured(property) || isLegacyAdminGiftFeatured(property);
}

/** Borde / badge de destaque en tarjetas. */
export function showsDestaquePresentation(property: Property) {
  return isPaidOrGrantedFeatured(property) || isLegacyAdminGiftFeatured(property);
}

export function getFeaturedPaymentsStartLabel() {
  if (!Number.isFinite(featuredPaymentsStartMs)) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(featuredPaymentsStartMs));
}
