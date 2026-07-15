import { createAdminClient } from '@/lib/supabase/admin';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { cityFromLocation, type MarketBenchmark } from '@/lib/marketReference';
import type { PriceDataTier } from '@/lib/priceDataTier';

const MIN_COMPARABLE_LISTINGS = 3;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

type ListingRow = {
  property_type?: string | null;
  transaction?: string | null;
  price?: number | null;
  area_sqm?: number | null;
  location?: string | null;
  neighborhood?: string | null;
};

export async function getPotilarListingBenchmark(input: {
  transaction: string;
  propertyType: string;
  location: string;
  neighborhood?: string | null;
  areaSqm?: number;
}): Promise<(MarketBenchmark & { dataTier: PriceDataTier; sampleCount: number }) | null> {
  const cityLabel = cityFromLocation(input.location);
  const cityNorm = normalizeText(cityLabel);
  const neighborhoodNorm = input.neighborhood?.trim() ? normalizeText(input.neighborhood) : '';
  const areaSqm = Number(input.areaSqm ?? 0);
  const isSeasonal = input.transaction === 'Temporada';
  const isSale = input.transaction === 'Compra';

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

  const comparables = rows.filter((row) => {
    if (row.transaction !== input.transaction) return false;
    if (row.property_type !== input.propertyType) return false;
    if (!row.price || row.price <= 0 || !row.area_sqm || row.area_sqm <= 0) return false;

    const rowCity = normalizeText(cityFromLocation(String(row.location ?? '')));
    if (rowCity !== cityNorm) return false;

    if (neighborhoodNorm) {
      const rowNeighborhood = normalizeText(String(row.neighborhood ?? ''));
      if (rowNeighborhood && rowNeighborhood !== neighborhoodNorm) return false;
    }

    return true;
  });

  if (comparables.length < MIN_COMPARABLE_LISTINGS) return null;

  const pricePerSqmValues = comparables.map((row) => Number(row.price) / Number(row.area_sqm));
  const medianPricePerSqm = median(pricePerSqmValues);
  let benchmarkPrice = Math.round(medianPricePerSqm * areaSqm);
  let pricePerSqm = Math.round(medianPricePerSqm * 100) / 100;
  let priceUnit: MarketBenchmark['priceUnit'] = isSale ? 'sale' : 'monthly';

  if (isSeasonal) {
    benchmarkPrice = Math.round(benchmarkPrice / 30);
    pricePerSqm = Math.round((pricePerSqm / 30) * 100) / 100;
    priceUnit = 'daily';
  }

  const spread = comparables.length >= 8 ? 0.15 : comparables.length >= 5 ? 0.18 : 0.22;
  const minPrice = Math.round(benchmarkPrice * (1 - spread));
  const maxPrice = Math.round(benchmarkPrice * (1 + spread));
  const scopeLabel = neighborhoodNorm ? String(input.neighborhood) : cityLabel;
  const now = new Date();
  const referencePeriod = `${now.toLocaleString('pt-BR', { month: 'short' })} ${now.getFullYear()}`;

  return {
    scope: neighborhoodNorm ? 'neighborhood' : 'city',
    scopeLabel,
    pricePerSqm,
    estimatedAreaSqm: areaSqm,
    benchmarkPrice,
    minPrice,
    maxPrice,
    source: getPotilarListingBenchmarkSource(comparables.length, cityLabel),
    referencePeriod,
    isApproximate: false,
    priceUnit,
    dataTier: 'potilar_listings',
    sampleCount: comparables.length
  };
}

function getPotilarListingBenchmarkSource(sampleCount: number, cityLabel: string) {
  return `${sampleCount} anúncio${sampleCount === 1 ? '' : 's'} ativos na Potilar em ${cityLabel}`;
}
