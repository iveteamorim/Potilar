import { ALL_NEIGHBORHOOD_MULTIPLIERS } from '@/data/marketNeighborhoods';
import { resolveCityReference } from '@/lib/marketCityCache';

export type MarketCityReference = {
  city: string;
  state: 'RN';
  saleSqm: number;
  rentSqm: number;
  source: string;
  referencePeriod: string;
};

const LAND_SALE_SQM = 1200;
const LAND_SALE_SQM_COAST = 2200;

const PROPERTY_TYPE_SALE_MULTIPLIER: Record<string, number> = {
  Apartamento: 1,
  Casa: 0.9,
  'Kitnet/Conjugado': 1.22,
  Terreno: 1
};

const PROPERTY_TYPE_RENT_MULTIPLIER: Record<string, number> = {
  Apartamento: 1,
  Casa: 0.92,
  'Kitnet/Conjugado': 1.18,
  Terreno: 1
};

const BEDROOM_AREA_ESTIMATE: Record<number, number> = {
  0: 35,
  1: 48,
  2: 68,
  3: 88,
  4: 110
};

const BEDROOM_SQM_MULTIPLIER: Record<number, number> = {
  0: 1.2,
  1: 1.12,
  2: 1,
  3: 0.94,
  4: 0.88
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function cityFromLocation(location: string) {
  return location.split(',')[0]?.trim() || location.trim();
}

function findNeighborhoodMultiplier(city: string, neighborhood?: string | null) {
  if (!neighborhood?.trim()) return null;

  const cityNorm = normalizeText(city);
  const neighborhoodNorm = normalizeText(neighborhood);

  return (
    ALL_NEIGHBORHOOD_MULTIPLIERS.find((item) => {
      const itemCity = normalizeText(item.city);
      const itemNeighborhood = normalizeText(item.neighborhood);
      if (itemCity !== cityNorm) return false;
      return (
        itemNeighborhood === neighborhoodNorm ||
        itemNeighborhood.includes(neighborhoodNorm) ||
        neighborhoodNorm.includes(itemNeighborhood)
      );
    }) ?? null
  );
}

function estimateAreaSqm(bedrooms?: number, propertyType?: string, areaSqm?: number) {
  if (areaSqm && areaSqm > 0) return areaSqm;

  const beds = Number(bedrooms ?? 0);
  const bucket = beds >= 4 ? 4 : beds;
  if (propertyType === 'Terreno') return 300;
  if (propertyType === 'Kitnet/Conjugado') return 32;
  return BEDROOM_AREA_ESTIMATE[bucket] ?? 65;
}

function bedroomSqmMultiplier(bedrooms?: number) {
  const beds = Number(bedrooms ?? 0);
  const bucket = beds >= 4 ? 4 : beds;
  return BEDROOM_SQM_MULTIPLIER[bucket] ?? 1;
}

function isCoastalCity(location: string, neighborhood?: string | null) {
  const text = normalizeText(`${location} ${neighborhood ?? ''}`);
  return ['ponta negra', 'via costeira', 'pipa', 'touros', 'maxaranguape', 'baia formosa'].some((token) =>
    text.includes(token)
  );
}

export type MarketBenchmark = {
  scope: 'neighborhood' | 'city' | 'state';
  scopeLabel: string;
  pricePerSqm: number;
  estimatedAreaSqm: number;
  benchmarkPrice: number;
  minPrice: number;
  maxPrice: number;
  source: string;
  referencePeriod: string;
  isApproximate: boolean;
};

export async function getMarketBenchmark(input: {
  transaction: string;
  propertyType: string;
  location: string;
  neighborhood?: string | null;
  bedrooms?: number;
  areaSqm?: number;
}): Promise<MarketBenchmark | null> {
  const cityRef = await resolveCityReference(input.location);
  const cityLabel = cityRef.city;
  const neighborhoodMultiplier = findNeighborhoodMultiplier(cityLabel, input.neighborhood);
  const isRent = input.transaction === 'Aluguel';
  const isSeasonal = input.transaction === 'Temporada';
  const isSale = input.transaction === 'Compra';
  const areaSqm = estimateAreaSqm(input.bedrooms, input.propertyType, input.areaSqm);

  if (input.propertyType === 'Terreno' && isRent) {
    return null;
  }

  let pricePerSqm: number;
  let scope: MarketBenchmark['scope'];
  let scopeLabel: string;
  let source: string;
  let referencePeriod: string;

  if (input.propertyType === 'Terreno' && isSale) {
    pricePerSqm = isCoastalCity(input.location, input.neighborhood) ? LAND_SALE_SQM_COAST : LAND_SALE_SQM;
    scope = neighborhoodMultiplier ? 'neighborhood' : 'city';
    scopeLabel = neighborhoodMultiplier?.neighborhood ?? cityLabel;
    source = 'Estimativa de mercado (terrenos urbanos no RN)';
    referencePeriod = cityRef.referencePeriod;
  } else if (neighborhoodMultiplier) {
    const baseSale = cityRef.saleSqm * neighborhoodMultiplier.saleMultiplier;
    const baseRent = cityRef.rentSqm * neighborhoodMultiplier.rentMultiplier;
    pricePerSqm = isRent || isSeasonal ? baseRent : baseSale;
    scope = 'neighborhood';
    scopeLabel = neighborhoodMultiplier.neighborhood;
    source = neighborhoodMultiplier.source;
    referencePeriod = cityRef.referencePeriod;
  } else {
    pricePerSqm = isRent || isSeasonal ? cityRef.rentSqm : cityRef.saleSqm;
    scope = cityLabel === 'Rio Grande do Norte' ? 'state' : 'city';
    scopeLabel = cityLabel;
    source = cityRef.source;
    referencePeriod = cityRef.referencePeriod;
  }

  const typeMultiplier = isRent || isSeasonal
    ? PROPERTY_TYPE_RENT_MULTIPLIER[input.propertyType] ?? 1
    : PROPERTY_TYPE_SALE_MULTIPLIER[input.propertyType] ?? 1;

  pricePerSqm = Math.round(pricePerSqm * typeMultiplier * bedroomSqmMultiplier(input.bedrooms));

  let benchmarkPrice = Math.round(pricePerSqm * areaSqm);

  if (isSeasonal) {
    benchmarkPrice = Math.round((pricePerSqm * areaSqm) / 30);
  }

  const isApproximate = cityRef.isApproximate ?? (scope === 'state' || scope === 'neighborhood');
  const spread = isApproximate ? (isSeasonal ? 0.28 : 0.22) : isSeasonal ? 0.2 : 0.12;
  const minPrice = Math.round(benchmarkPrice * (1 - spread));
  const maxPrice = Math.round(benchmarkPrice * (1 + spread));

  return {
    scope,
    scopeLabel,
    pricePerSqm,
    estimatedAreaSqm: areaSqm,
    benchmarkPrice,
    minPrice,
    maxPrice,
    source,
    referencePeriod,
    isApproximate
  };
}
