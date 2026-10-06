import { formatPlaceName } from '@/lib/textFormat';

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
  features?: string[] | string | null;
  video_url?: string | null;
  images?: string[] | null;
};

export type ListingMaterialPayload = {
  intent: string;
  headline: string;
  subtitle: string;
  location: string;
  city: string;
  price: string;
  priceCaption: string;
  qrText: string;
  image: string;
  images: string[];
  publicUrl: string;
  contactWhatsapp?: string | null;
  contactPhone?: string | null;
  compactFeatures: string;
  specs: ListingMaterialSpec[];
};

type MaterialKind =
  | 'casa'
  | 'apartamento'
  | 'kitnet'
  | 'ponto'
  | 'loja'
  | 'sala'
  | 'terreno'
  | 'lote'
  | 'cobertura'
  | 'sitio'
  | 'chacara'
  | 'galpao'
  | 'imovel';

const KIND_LABEL: Record<MaterialKind, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  kitnet: 'Kitnet',
  ponto: 'Ponto comercial',
  loja: 'Loja',
  sala: 'Sala comercial',
  terreno: 'Terreno',
  lote: 'Lote',
  cobertura: 'Cobertura',
  sitio: 'Sítio',
  chacara: 'Chácara',
  galpao: 'Galpão',
  imovel: 'Imóvel'
};

function fold(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function featureList(features?: string[] | string | null) {
  if (!features) return [];
  const items = Array.isArray(features) ? features : features.split(',');
  return items.map((item) => item.trim()).filter(Boolean);
}

function hasKindToken(value: string, needle: string) {
  return new RegExp(`(?:^|[^a-z0-9])${needle}(?:$|[^a-z0-9])`).test(value);
}

function detectKind(listing: Pick<ListingMaterialSource, 'property_type' | 'title' | 'features'>): MaterialKind {
  const type = fold(listing.property_type);
  const title = fold(listing.title);
  const features = featureList(listing.features).map(fold);
  const pool = [type, ...features];

  const inPool = (...needles: string[]) =>
    pool.some((item) => needles.some((needle) => hasKindToken(item, needle)));
  const titleStarts = (...needles: string[]) => needles.some((needle) => title.startsWith(needle));

  if (inPool('cobertura') || titleStarts('cobertura')) return 'cobertura';
  if (inPool('galpao', 'deposito') || titleStarts('galpao', 'deposito')) return 'galpao';
  if (inPool('loja') || titleStarts('loja')) return 'loja';
  if (inPool('sala comercial') || titleStarts('sala comercial')) return 'sala';
  if (inPool('lote') || titleStarts('lote')) return 'lote';
  if (inPool('sitio') || titleStarts('sitio')) return 'sitio';
  if (inPool('chacara') || titleStarts('chacara')) return 'chacara';
  if (inPool('kitnet', 'conjugado') || type.includes('kitnet') || titleStarts('kitnet', 'conjugado')) return 'kitnet';
  if (inPool('ponto') || type.includes('ponto') || titleStarts('ponto comercial')) return 'ponto';
  if (inPool('terreno') || type.includes('terreno') || titleStarts('terreno')) return 'terreno';
  if (inPool('apartamento') || type.includes('apartamento') || titleStarts('apartamento')) return 'apartamento';
  if (inPool('casa') || type.includes('casa') || titleStarts('casa')) return 'casa';
  return 'imovel';
}

export function getListingIntent(transaction?: string | null) {
  if (transaction === 'Aluguel') return 'ALUGA-SE';
  if (transaction === 'Temporada') return 'TEMPORADA';
  return 'VENDE-SE';
}

function formatPricePeriod(period?: string | null) {
  const value = fold(period);
  if (value === 'dia' || value === 'diaria') return 'diária';
  if (value === 'semana') return 'semana';
  if (value === 'mes') return 'mês';
  return period?.trim() || '';
}

export function formatListingMaterialPrice(price?: number | null, period?: string | null) {
  if (!price) return 'CONSULTE';
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(price);
  const label = formatPricePeriod(period);
  return label ? `${formatted} / ${label}` : formatted;
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

export function getMaterialHeadline(
  propertyType?: string | null,
  transaction?: string | null,
  listing?: Pick<ListingMaterialSource, 'title' | 'features'>
) {
  const kind = detectKind({
    property_type: propertyType,
    title: listing?.title ?? '',
    features: listing?.features
  });
  const label = KIND_LABEL[kind];

  if (transaction === 'Temporada') {
    if (kind === 'casa' || kind === 'apartamento' || kind === 'cobertura' || kind === 'kitnet') {
      return `${label} para temporada`;
    }
    return 'Imóvel para temporada';
  }

  if (transaction === 'Aluguel') return `${label} para alugar`;
  return `${label} à venda`;
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

function areaLabel(kind: MaterialKind) {
  if (kind === 'sitio' || kind === 'chacara') return 'área total';
  if (kind === 'terreno' || kind === 'lote' || kind === 'galpao' || kind === 'ponto' || kind === 'loja' || kind === 'sala') {
    return '';
  }
  return 'área construída';
}

export function getMaterialSpecs(listing: ListingMaterialSource): ListingMaterialSpec[] {
  const specs: ListingMaterialSpec[] = [];
  const kind = detectKind(listing);
  const isLand = kind === 'terreno' || kind === 'lote';

  if (!isLand && listing.bedrooms) {
    specs.push({
      id: 'beds',
      value: String(listing.bedrooms),
      label: plural(listing.bedrooms, 'quarto', 'quartos')
    });
  }

  if (!isLand && listing.bathrooms) {
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
      label: areaLabel(kind)
    });
  }

  return specs.slice(0, 4);
}

export function getCompactFeatures(listing: ListingMaterialSource) {
  const kind = detectKind(listing);
  const isLand = kind === 'terreno' || kind === 'lote';

  return [
    KIND_LABEL[kind],
    !isLand && listing.bedrooms ? `${listing.bedrooms} ${plural(listing.bedrooms, 'quarto', 'quartos')}` : null,
    !isLand && listing.bathrooms ? `${listing.bathrooms} ${plural(listing.bathrooms, 'banheiro', 'banheiros')}` : null,
    listing.parking ? `${listing.parking} ${plural(listing.parking, 'vaga', 'vagas')}` : null,
    listing.area_sqm ? `${listing.area_sqm} m²` : null
  ]
    .filter(Boolean)
    .join(' - ');
}

export function getMaterialQrText(input: {
  images?: string[] | null;
  videoUrl?: string | null;
  hasPlant?: boolean;
}) {
  const hasPhotos = (input.images?.filter(Boolean).length ?? 0) > 0;
  const hasVideo = Boolean(input.videoUrl?.trim());
  const hasPlant = Boolean(input.hasPlant);
  const parts: string[] = [];

  if (hasPhotos) parts.push('todas as fotos');
  if (hasPlant) parts.push('a planta');
  if (hasVideo) parts.push('o vídeo');

  if (!parts.length) return 'Escaneie e veja todos os detalhes do imóvel.';
  if (parts.length === 1) return `Escaneie e veja ${parts[0]} deste imóvel.`;
  if (parts.length === 2) return `Escaneie e veja ${parts[0]} e ${parts[1]} deste imóvel.`;
  return `Escaneie e veja ${parts[0]}, ${parts[1]} e ${parts[2]} deste imóvel.`;
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
  const headline = getMaterialHeadline(listing.property_type, listing.transaction, listing);
  const city = cityFromLocation(listing.location);
  const period = listing.transaction === 'Temporada' ? listing.price_period : null;

  return {
    intent: getListingIntent(listing.transaction),
    headline,
    subtitle: '',
    location: formatMaterialLocation(listing.location),
    city,
    price: formatListingMaterialPrice(listing.price, period),
    priceCaption: '',
    qrText: getMaterialQrText({
      images: input.images.length ? input.images : listing.images,
      videoUrl: listing.video_url
    }),
    image: input.image,
    images: input.images,
    publicUrl: input.publicUrl,
    contactWhatsapp: input.contactWhatsapp,
    contactPhone: input.contactPhone,
    compactFeatures: getCompactFeatures(listing),
    specs: getMaterialSpecs(listing)
  };
}
