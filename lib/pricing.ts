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
