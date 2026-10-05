import { formatPlaceName } from '@/lib/textFormat';
import { usesResidentialLayoutFields } from '@/lib/propertyTypes';

export type ListingMaterialSpec = {
  id: 'beds' | 'baths' | 'parking' | 'area';
  value: string;
  label: string;
};

export type ListingMaterialSource = {
  title: string;
  property_type?: string | null;
  transaction?: string | null;
  price?: number | null;
  price_period?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  area_sqm?: number | null;
  location?: string | null;
};

export type ListingMaterialPayload = {
  intent: string;
  headline: string;
  subtitle: string;
  location: string;
  city: string;
  price: string;
  priceCaption: string;
  image: string;
  images: string[];
  publicUrl: string;
  contactWhatsapp?: string | null;
  contactPhone?: string | null;
  compactFeatures: string;
  specs: ListingMaterialSpec[];
};

export function getListingIntent(transaction?: string | null) {
  if (transaction === 'Aluguel') return 'ALUGA-SE';
  if (transaction === 'Temporada') return 'TEMPORADA';
  return 'VENDE-SE';
}

export function formatListingMaterialPrice(price?: number | null, period?: string | null) {
  if (!price) return 'CONSULTE';
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(price);

  return period ? `${formatted}/${period}` : formatted;
}

function cityFromLocation(location?: string | null) {
  const raw = (location ?? '').split(',')[0]?.trim() || 'Rio Grande do Norte';
  const withoutState = raw.replace(/\s*[-,]\s*RN\s*$/i, '').trim() || raw;
  return formatPlaceName(withoutState);
}

export function formatMaterialLocation(location?: string | null) {
  const city = cityFromLocation(location);
  if (/rio grande do norte/i.test(city)) return city;
  return `${city} - RN`;
}

export function getMaterialHeadline(propertyType?: string | null, transaction?: string | null) {
  const type = (propertyType ?? 'Imóvel').trim() || 'Imóvel';
  if (transaction === 'Aluguel') return `${type} para alugar`;
  if (transaction === 'Temporada') return `${type} para temporada`;
  return `${type} à venda`;
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

export function getMaterialSpecs(listing: ListingMaterialSource): ListingMaterialSpec[] {
  const specs: ListingMaterialSpec[] = [];
  const residential = usesResidentialLayoutFields(listing.property_type ?? 'Casa');

  if (residential && listing.bedrooms) {
    specs.push({
      id: 'beds',
      value: String(listing.bedrooms),
      label: plural(listing.bedrooms, 'quarto', 'quartos')
    });
  }

  if (residential && listing.bathrooms) {
    specs.push({
      id: 'baths',
      value: String(listing.bathrooms),
      label: plural(listing.bathrooms, 'banheiro', 'banheiros')
    });
  }

  if (listing.parking) {
    specs.push({
      id: 'parking',
      value: String(listing.parking),
      label: plural(listing.parking, 'vaga', 'vagas')
    });
  }

  if (listing.area_sqm) {
    specs.push({
      id: 'area',
      value: `${listing.area_sqm} m²`,
      label: 'área construída'
    });
  }

  return specs.slice(0, 4);
}

export function getCompactFeatures(listing: ListingMaterialSource) {
  return [
    listing.property_type ?? 'Imovel',
    listing.bedrooms ? `${listing.bedrooms} ${plural(listing.bedrooms, 'quarto', 'quartos')}` : null,
    listing.bathrooms ? `${listing.bathrooms} ${plural(listing.bathrooms, 'banheiro', 'banheiros')}` : null,
    listing.parking ? `${listing.parking} ${plural(listing.parking, 'vaga', 'vagas')}` : null,
    listing.area_sqm ? `${listing.area_sqm} m²` : null
  ]
    .filter(Boolean)
    .join(' - ');
}

export function buildListingMaterial(input: {
  listing: ListingMaterialSource;
  publicUrl: string;
  image: string;
  images: string[];
  contactWhatsapp?: string | null;
  contactPhone?: string | null;
}): ListingMaterialPayload {
  const { listing } = input;
  const headline = getMaterialHeadline(listing.property_type, listing.transaction);
  const city = cityFromLocation(listing.location);

  return {
    intent: getListingIntent(listing.transaction),
    headline,
    subtitle: '',
    location: formatMaterialLocation(listing.location),
    city,
    price: formatListingMaterialPrice(listing.price, listing.price_period),
    priceCaption: '',
    image: input.image,
    images: input.images,
    publicUrl: input.publicUrl,
    contactWhatsapp: input.contactWhatsapp,
    contactPhone: input.contactPhone,
    compactFeatures: getCompactFeatures(listing),
    specs: getMaterialSpecs(listing)
  };
}
