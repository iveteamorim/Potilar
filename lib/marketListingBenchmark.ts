import { distanceWeightKm, haversineKm } from '@/lib/geoDistance';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { cityFromLocation, type MarketBenchmark } from '@/lib/marketReference';
import type { PriceDataTier } from '@/lib/priceDataTier';

const MIN_COMPARABLE_LISTINGS = 3;
const MAX_COMP_RADIUS_KM = 15;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function weightedMedian(items: Array<{ value: number; weight: number }>) {
  if (!items.length) return 0;
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1].value + sorted[mid].value) / 2 : sorted[mid].value;
  }

  let cursor = 0;
  const target = totalWeight / 2;
  for (const item of sorted) {
    cursor += item.weight;
    if (cursor >= target) return item.value;
  }

  return sorted[sorted.length - 1].value;
}

type ListingRow = {
  id?: string;
  property_type?: string | null;
  transaction?: string | null;
  price?: number | null;
  area_sqm?: number | null;
  bedrooms?: number | null;
  location?: string | null;
  neighborhood?: string | null;
  lat?: number | null;
  lng?: number | null;
  updated_at?: string | null;
};

export type ComparableListing = {
  id: string;
  pricePerSqm: number;
  distanceKm?: number;
};

export async function getPotilarListingBenchmark(input: {
  transaction: string;
  propertyType: string;
  location: string;
  neighborhood?: string | null;
  areaSqm?: number;
  bedrooms?: number;
  lat?: number;
  lng?: number;
  excludeListingId?: string;
}): Promise<(MarketBenchmark & { dataTier: PriceDataTier; sampleCount: number; comparables?: ComparableListing[] }) | null> {
  const cityLabel = cityFromLocation(input.location);
  const cityNorm = normalizeText(cityLabel);
  const neighborhoodNorm = input.neighborhood?.trim() ? normalizeText(input.neighborhood) : '';
  const areaSqm = Number(input.areaSqm ?? 0);
  const bedrooms = Number(input.bedrooms ?? 0);
  const isSeasonal = input.transaction === 'Temporada';
  const isSale = input.transaction === 'Compra';
  const hasGeo = Number.isFinite(input.lat) && Number.isFinite(input.lng);

  if (!cityNorm || !areaSqm || areaSqm <= 0) return null;

  let rows: ListingRow[] = [];

  try {
    const supabase = createAdminClient();
    rows = (await fetchApprovedListingRows(supabase, {
      withContact: false,
      hideExpired: true
    })) as ListingRow[];
  } catch {
    return null;
  }

  const comparables = rows
    .filter((row) => {
      if (input.excludeListingId && row.id === input.excludeListingId) return false;
      if (row.transaction !== input.transaction) return false;
      if (row.property_type !== input.propertyType) return false;
      if (!row.price || row.price <= 0 || !row.area_sqm || row.area_sqm <= 0) return false;

      const rowCity = normalizeText(cityFromLocation(String(row.location ?? '')));
      if (rowCity !== cityNorm) return false;

      const rowArea = Number(row.area_sqm);
      const areaDelta = Math.abs(rowArea - areaSqm) / areaSqm;
      if (areaDelta > 0.28) return false;

      if (bedrooms > 0 && Number(row.bedrooms ?? 0) > 0) {
        if (Math.abs(Number(row.bedrooms) - bedrooms) > 1) return false;
      }

      if (hasGeo && Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
        const distanceKm = haversineKm(input.lat!, input.lng!, Number(row.lat), Number(row.lng));
        if (distanceKm > MAX_COMP_RADIUS_KM) return false;
      } else if (neighborhoodNorm) {
        const rowNeighborhood = normalizeText(String(row.neighborhood ?? ''));
        if (rowNeighborhood && rowNeighborhood !== neighborhoodNorm) return false;
      }

      return true;
    })
    .map((row) => {
      const pricePerSqm = Number(row.price) / Number(row.area_sqm);
      const distanceKm =
        hasGeo && Number.isFinite(row.lat) && Number.isFinite(row.lng)
          ? haversineKm(input.lat!, input.lng!, Number(row.lat), Number(row.lng))
          : undefined;
      const recencyWeight = row.updated_at
        ? Math.max(0.7, 1 - (Date.now() - new Date(row.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 120))
        : 0.85;
      const distanceWeight = distanceKm !== undefined ? distanceWeightKm(distanceKm, MAX_COMP_RADIUS_KM) : 1;

      return {
        id: String(row.id ?? ''),
        pricePerSqm,
        distanceKm,
        weight: recencyWeight * distanceWeight
      };
    });

  if (comparables.length < MIN_COMPARABLE_LISTINGS) return null;

  const medianPricePerSqm = weightedMedian(
    comparables.map((row) => ({
      value: row.pricePerSqm,
      weight: row.weight
    }))
  );

  let benchmarkPrice = Math.round(medianPricePerSqm * areaSqm);
  let pricePerSqm = Math.round(medianPricePerSqm * 100) / 100;
  let priceUnit: MarketBenchmark['priceUnit'] = isSale ? 'sale' : 'monthly';

  if (isSeasonal) {
    benchmarkPrice = Math.round(benchmarkPrice / 30);
    pricePerSqm = Math.round((pricePerSqm / 30) * 100) / 100;
    priceUnit = 'daily';
  }

  const spread = comparables.length >= 8 ? 0.14 : comparables.length >= 5 ? 0.17 : 0.2;
  const minPrice = Math.round(benchmarkPrice * (1 - spread));
  const maxPrice = Math.round(benchmarkPrice * (1 + spread));
  const scopeLabel = neighborhoodNorm ? String(input.neighborhood) : cityLabel;
  const now = new Date();
  const referencePeriod = `${now.toLocaleString('pt-BR', { month: 'short' })} ${now.getFullYear()}`;
  const geoNote = hasGeo ? ` em raio de ${MAX_COMP_RADIUS_KM} km` : '';

  return {
    scope: neighborhoodNorm || hasGeo ? 'neighborhood' : 'city',
    scopeLabel,
    pricePerSqm,
    estimatedAreaSqm: areaSqm,
    benchmarkPrice,
    minPrice,
    maxPrice,
    source: `${comparables.length} anúncios ativos na Potilar em ${cityLabel}${geoNote}`,
    referencePeriod,
    isApproximate: false,
    priceUnit,
    dataTier: 'potilar_listings',
    sampleCount: comparables.length,
    comparables: comparables.map((row) => ({
      id: row.id,
      pricePerSqm: Math.round(row.pricePerSqm * 100) / 100,
      distanceKm: row.distanceKm !== undefined ? Math.round(row.distanceKm * 10) / 10 : undefined
    }))
  };
}
