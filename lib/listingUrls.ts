import type { Property } from '@/data/properties';

export function getListingShortCode(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toLowerCase();
}

/** URL segura para abrir un anuncio desde superficies interativas como mapa. */
export function getListingHref(property: Pick<Property, 'id' | 'slug'>) {
  const slug = property.slug?.trim().toLowerCase() ?? '';
  const id = property.id?.trim() ?? '';

  if (id && !id.startsWith('user-')) {
    const query = slug ? `?slug=${encodeURIComponent(slug)}` : '';
    return `/ver-anuncio/${encodeURIComponent(id)}${query}`;
  }

  const code = getListingShortCode(id);
  if (code.length >= 4) {
    return `/a/${code}`;
  }

  return '/imoveis';
}
