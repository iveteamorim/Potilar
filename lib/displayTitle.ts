import type { Property } from '@/data/properties';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getCleanPropertyTitle(property: Pick<Property, 'title' | 'location' | 'neighborhood' | 'community'>) {
  let title = property.title.trim();
  const repeatedPlaces = [property.neighborhood, property.community]
    .filter(Boolean)
    .map((value) => escapeRegExp(String(value).trim()))
    .filter(Boolean);

  for (let index = 0; index < 4; index += 1) {
    for (const place of repeatedPlaces) {
      title = title.replace(new RegExp(`,?\\s*${place}\\s*$`, 'i'), '');
    }

    if (property.location) {
      const location = escapeRegExp(property.location.trim());
      title = title.replace(new RegExp(`,?\\s*${location}\\s*$`, 'i'), '');
    }
  }

  title = title
    .replace(/,\s*$/g, '')
    .replace(/\s+em\s*$/i, '')
    .replace(/\s+no\s*$/i, '')
    .replace(/\s+na\s*$/i, '')
    .trim();

  if (/^(casa|apartamento|terreno|kitnet\/conjugado)\s+para\s+(alugar|venda|temporada)$/i.test(title) && property.location) {
    return `${title} em ${property.location}`;
  }

  return title || property.title;
}
