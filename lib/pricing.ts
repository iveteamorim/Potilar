import type { Property } from '@/data/properties';

export function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPropertyPrice(property: Pick<Property, 'price' | 'transaction' | 'pricePeriod'>) {
  const price = formatPrice(property.price);
  if (property.transaction !== 'Temporada' || !property.pricePeriod) return price;
  return `${price}/${property.pricePeriod}`;
}

/** Compact map-pin label. Do not round rent-range prices into the next thousand. */
export function formatMapMarkerPrice(property: Pick<Property, 'price' | 'transaction' | 'pricePeriod'>) {
  const suffix = property.transaction === 'Temporada' && property.pricePeriod ? `/${property.pricePeriod}` : '';
  if (property.price >= 1_000_000) {
    const millions = property.price / 1_000_000;
    return `R$ ${millions.toFixed(property.price >= 10_000_000 ? 0 : 1).replace('.', ',')} mi${suffix}`;
  }
  if (property.price >= 10_000) {
    return `R$ ${Math.round(property.price / 1000)} mil${suffix}`;
  }
  return formatPropertyPrice(property);
}
