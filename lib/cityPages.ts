import { cities as RN_CITIES } from '@/data/cities';
import { slugify } from '@/lib/slugify';

export type RnCityPage = {
  name: string;
  slug: string;
};

export const RN_CITY_PAGES: RnCityPage[] = RN_CITIES.map((name) => ({
  name,
  slug: slugify(name)
}));

const SLUG_TO_CITY = new Map(RN_CITY_PAGES.map((city) => [city.slug, city.name]));

/** Cidades com mais busca — footer, home, links internos. */
export const FEATURED_CITY_NAMES = [
  'Natal',
  'Parnamirim',
  'Mossoró',
  'São Gonçalo do Amarante',
  'Macaíba',
  'Caicó',
  'Pau dos Ferros',
  'Santana do Matos',
  'Nova Cruz',
  'Ceará-Mirim',
  'Monte Alegre',
  'Touros'
] as const;

export function getAllCitySlugs() {
  return RN_CITY_PAGES.map((city) => city.slug);
}

export function resolveCityNameFromSlug(slug: string) {
  return SLUG_TO_CITY.get(slug) ?? null;
}

export function isKnownCitySlug(slug: string) {
  return SLUG_TO_CITY.has(slug);
}

export function getCityPagePath(cityName: string) {
  return `/imoveis/cidade/${slugify(cityName)}`;
}

export function resolveCityPrefill(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  const bySlug = resolveCityNameFromSlug(slugify(trimmed));
  if (bySlug) return bySlug;

  const normalized = slugify(trimmed).replace(/-/g, '');
  const byName = RN_CITIES.find((city) => slugify(city).replace(/-/g, '') === normalized);
  return byName ?? '';
}

export function getCitySeoDescription(cityName: string, listingCount: number) {
  if (listingCount > 0) {
    return `${listingCount} anuncio${listingCount === 1 ? '' : 's'} de casas, apartamentos, terrenos, aluguel e temporada em ${cityName}, Rio Grande do Norte. Contato direto com anunciantes na Potilar.`;
  }

  return `Busque ou anuncie casas, apartamentos, terrenos, aluguel e temporada em ${cityName}, RN. Portal imobiliario regional com contato direto e primeiro anuncio gratis na Potilar.`;
}

export function getCitySeoTitle(cityName: string) {
  return `Imoveis em ${cityName}, RN — aluguel, venda e temporada`;
}

export function groupCitiesAlphabetically() {
  const groups = new Map<string, RnCityPage[]>();

  for (const city of RN_CITY_PAGES) {
    const letter = city.name.charAt(0).toUpperCase();
    const bucket = groups.get(letter) ?? [];
    bucket.push(city);
    groups.set(letter, bucket);
  }

  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
}
