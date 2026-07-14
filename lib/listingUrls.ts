import type { Property } from '@/data/properties';

export function getListingShortCode(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toLowerCase();
}

/** URL segura para abrir un anuncio desde superficies interativas como mapa. */
export function getListingHref(property: Pick<Property, 'id' | 'slug'>) {
  const slug = property.slug?.trim().toLowerCase() ?? '';
  const id = property.id?.trim() ?? '';
  const listingId = id.startsWith('user-') ? id.replace(/^user-/, '') : id;

  if (listingId) {
    const query = slug ? `?slug=${encodeURIComponent(slug)}` : '';
    return `/ver-anuncio/${encodeURIComponent(listingId)}${query}`;
  }

  const code = getListingShortCode(listingId);
  if (code.length >= 4) {
    return `/a/${code}`;
  }

  return '/imoveis';
}
