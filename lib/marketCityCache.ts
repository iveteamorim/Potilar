import { createAdminClient } from '@/lib/supabase/admin';

export type MarketCityReference = {
  city: string;
  state: 'RN';
  saleSqm: number;
  rentSqm: number;
  source: string;
  referencePeriod: string;
  isApproximate?: boolean;
};

export type CachedCityBenchmark = MarketCityReference & {
  cityKey: string;
  syncedAt: string;
};

const CACHE_TTL_MS = 60 * 60 * 1000;

let memoryCache: { expiresAt: number; rows: CachedCityBenchmark[] } | null = null;

export const STATIC_NATAL_FALLBACK: CachedCityBenchmark = {
  cityKey: 'natal-rn',
  city: 'Natal',
  state: 'RN',
  saleSqm: 6248,
  rentSqm: 40.61,
  source: 'Indice FipeZAP (Zap, Viva Real, OLX)',
  referencePeriod: 'dez/2025 - mar/2026',
  syncedAt: ''
};

/**
 * Cidades do RN derivadas de Natal via multiplicador (recalculam com FipeZAP).
 * Fontes: FipeZAP (Natal), portais imobiliarios (OLX, Zap, Viva Real) e medias de anuncios online.
 */
export const RN_CITY_MULTIPLIERS: Array<{
  cityKey: string;
  city: string;
  saleMultiplier: number;
  rentMultiplier: number;
  source: string;
}> = [
  // Regiao metropolitana de Natal
  {
    cityKey: 'parnamirim-rn',
    city: 'Parnamirim',
    saleMultiplier: 0.83,
    rentMultiplier: 0.84,
    source: 'Portais imobiliarios / regiao metropolitana'
  },
  {
    cityKey: 'sao-goncalo-do-amarante-rn',
    city: 'Sao Goncalo do Amarante',
    saleMultiplier: 0.76,
    rentMultiplier: 0.77,
    source: 'Portais imobiliarios / regiao metropolitana'
  },
  {
    cityKey: 'ceara-mirim-rn',
    city: 'Ceara-Mirim',
    saleMultiplier: 0.73,
    rentMultiplier: 0.74,
    source: 'Portais imobiliarios / regiao metropolitana'
  },
  {
    cityKey: 'extremoz-rn',
    city: 'Extremoz',
    saleMultiplier: 0.71,
    rentMultiplier: 0.72,
    source: 'Portais imobiliarios / regiao metropolitana'
  },
  {
    cityKey: 'macaiba-rn',
    city: 'Macaiba',
    saleMultiplier: 0.69,
    rentMultiplier: 0.7,
    source: 'Portais imobiliarios / regiao metropolitana'
  },
  {
    cityKey: 'sao-jose-de-mipibu-rn',
    city: 'Sao Jose de Mipibu',
    saleMultiplier: 0.66,
    rentMultiplier: 0.68,
    source: 'Portais imobiliarios / litoral metropolitano'
  },
  {
    cityKey: 'goianinha-rn',
    city: 'Goianinha',
    saleMultiplier: 0.78,
    rentMultiplier: 0.79,
    source: 'Portais imobiliarios / sul metropolitano'
  },
  {
    cityKey: 'nisia-floresta-rn',
    city: 'Nisia Floresta',
    saleMultiplier: 0.94,
    rentMultiplier: 0.98,
    source: 'Portais imobiliarios / litoral sul'
  },
  // Polo norte e litoral norte
  {
    cityKey: 'mossoro-rn',
    city: 'Mossoro',
    saleMultiplier: 0.67,
    rentMultiplier: 0.69,
    source: 'FipeZAP / portais imobiliarios (interior)'
  },
  {
    cityKey: 'macau-rn',
    city: 'Macau',
    saleMultiplier: 0.55,
    rentMultiplier: 0.57,
    source: 'Portais imobiliarios / costa norte'
  },
  {
    cityKey: 'touros-rn',
    city: 'Touros',
    saleMultiplier: 0.74,
    rentMultiplier: 0.78,
    source: 'Portais imobiliarios / litoral norte'
  },
  {
    cityKey: 'maxaranguape-rn',
    city: 'Maxaranguape',
    saleMultiplier: 0.8,
    rentMultiplier: 0.83,
    source: 'Portais imobiliarios / litoral norte'
  },
  {
    cityKey: 'nova-cruz-rn',
    city: 'Nova Cruz',
    saleMultiplier: 0.52,
    rentMultiplier: 0.54,
    source: 'Portais imobiliarios / agreste norte'
  },
  // Serido e central
  {
    cityKey: 'caico-rn',
    city: 'Caico',
    saleMultiplier: 0.5,
    rentMultiplier: 0.52,
    source: 'Portais imobiliarios / Serido'
  },
  {
    cityKey: 'currais-novos-rn',
    city: 'Currais Novos',
    saleMultiplier: 0.48,
    rentMultiplier: 0.5,
    source: 'Portais imobiliarios / Serido (media online)'
  },
  {
    cityKey: 'pau-dos-ferros-rn',
    city: 'Pau dos Ferros',
    saleMultiplier: 0.5,
    rentMultiplier: 0.52,
    source: 'Portais imobiliarios / sertao nordestino'
  },
  {
    cityKey: 'joao-camara-rn',
    city: 'Joao Camara',
    saleMultiplier: 0.56,
    rentMultiplier: 0.58,
    source: 'Portais imobiliarios / agreste'
  },
  {
    cityKey: 'acu-rn',
    city: 'Acu',
    saleMultiplier: 0.46,
    rentMultiplier: 0.48,
    source: 'Portais imobiliarios / vale do Acu'
  },
  // Litoral turistico (premium)
  {
    cityKey: 'tibau-do-sul-rn',
    city: 'Tibau do Sul',
    saleMultiplier: 1.18,
    rentMultiplier: 1.28,
    source: 'Portais imobiliarios / Pipa e litoral turistico'
  },
  {
    cityKey: 'sao-miguel-do-gostoso-rn',
    city: 'Sao Miguel do Gostoso',
    saleMultiplier: 1.12,
    rentMultiplier: 1.22,
    source: 'Portais imobiliarios / litoral turistico'
  },
  {
    cityKey: 'canguaretama-rn',
    city: 'Canguaretama',
    saleMultiplier: 0.86,
    rentMultiplier: 0.92,
    source: 'Portais imobiliarios / litoral sul'
  },
  {
    cityKey: 'baia-formosa-rn',
    city: 'Baia Formosa',
    saleMultiplier: 0.9,
    rentMultiplier: 0.95,
    source: 'Portais imobiliarios / litoral sul'
  },
  // Interior adicional
  {
    cityKey: 'apodi-rn',
    city: 'Apodi',
    saleMultiplier: 0.44,
    rentMultiplier: 0.46,
    source: 'Portais imobiliarios / sertao'
  },
  {
    cityKey: 'areia-branca-rn',
    city: 'Areia Branca',
    saleMultiplier: 0.5,
    rentMultiplier: 0.52,
    source: 'Portais imobiliarios / polo sal e energia'
  },
  {
    cityKey: 'santa-cruz-rn',
    city: 'Santa Cruz',
    saleMultiplier: 0.48,
    rentMultiplier: 0.5,
    source: 'Portais imobiliarios / agreste'
  },
  {
    cityKey: 'patu-rn',
    city: 'Patu',
    saleMultiplier: 0.47,
    rentMultiplier: 0.49,
    source: 'Portais imobiliarios / sertao'
  },
  {
    cityKey: 'pendencias-rn',
    city: 'Pendencias',
    saleMultiplier: 0.49,
    rentMultiplier: 0.51,
    source: 'Portais imobiliarios / Serido'
  },
  {
    cityKey: 'parelhas-rn',
    city: 'Parelhas',
    saleMultiplier: 0.51,
    rentMultiplier: 0.53,
    source: 'Portais imobiliarios / Serido'
  },
  {
    cityKey: 'sao-paulo-do-potengi-rn',
    city: 'Sao Paulo do Potengi',
    saleMultiplier: 0.53,
    rentMultiplier: 0.55,
    source: 'Portais imobiliarios / agreste'
  },
  {
    cityKey: 'barauna-rn',
    city: 'Barauna',
    saleMultiplier: 0.45,
    rentMultiplier: 0.47,
    source: 'Portais imobiliarios / vale do Acu'
  },
  {
    cityKey: 'angicos-rn',
    city: 'Angicos',
    saleMultiplier: 0.46,
    rentMultiplier: 0.48,
    source: 'Portais imobiliarios / sertao'
  },
  {
    cityKey: 'umarizal-rn',
    city: 'Umarizal',
    saleMultiplier: 0.44,
    rentMultiplier: 0.46,
    source: 'Portais imobiliarios / sertao'
  },
  {
    cityKey: 'equador-rn',
    city: 'Equador',
    saleMultiplier: 0.45,
    rentMultiplier: 0.47,
    source: 'Portais imobiliarios / Serido'
  },
  // Interior pequeno (abaixo da media regional)
  {
    cityKey: 'monte-alegre-rn',
    city: 'Monte Alegre',
    saleMultiplier: 0.38,
    rentMultiplier: 0.36,
    source: 'Estimativa regional (portais / interior pequeno)'
  },
  {
    cityKey: 'serra-do-mel-rn',
    city: 'Serra do Mel',
    saleMultiplier: 0.36,
    rentMultiplier: 0.34,
    source: 'Estimativa regional (portais / interior pequeno)'
  },
  {
    cityKey: 'venha-ver-rn',
    city: 'Venha-Ver',
    saleMultiplier: 0.37,
    rentMultiplier: 0.35,
    source: 'Estimativa regional (portais / interior pequeno)'
  },
  {
    cityKey: 'jardim-do-serido-rn',
    city: 'Jardim do Serido',
    saleMultiplier: 0.38,
    rentMultiplier: 0.36,
    source: 'Estimativa regional (portais / interior pequeno)'
  },
  {
    cityKey: 'sao-tome-rn',
    city: 'Sao Tome',
    saleMultiplier: 0.37,
    rentMultiplier: 0.35,
    source: 'Estimativa regional (portais / interior pequeno)'
  },
  {
    cityKey: 'serra-caiada-rn',
    city: 'Serra Caiada',
    saleMultiplier: 0.39,
    rentMultiplier: 0.37,
    source: 'Estimativa regional (portais / interior pequeno)'
  }
];

/** Interior sem cidade calibrada: estimativa conservadora (nao usar % alto de Natal). */
const RN_STATE_FALLBACK_MULTIPLIER = { sale: 0.4, rent: 0.38 };

function deriveRegionalCities(natal: CachedCityBenchmark): CachedCityBenchmark[] {
  return RN_CITY_MULTIPLIERS.map((item) => ({
    cityKey: item.cityKey,
    city: item.city,
    state: 'RN' as const,
    saleSqm: Math.round(natal.saleSqm * item.saleMultiplier),
    rentSqm: Math.round(natal.rentSqm * item.rentMultiplier * 100) / 100,
    source: item.source,
    referencePeriod: natal.referencePeriod,
    syncedAt: natal.syncedAt
  }));
}

function buildFallbackRows(): CachedCityBenchmark[] {
  return [STATIC_NATAL_FALLBACK, ...deriveRegionalCities(STATIC_NATAL_FALLBACK)];
}

export function invalidateMarketCityCache() {
  memoryCache = null;
}

export async function loadMarketCityBenchmarks(): Promise<CachedCityBenchmark[]> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.rows;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('market_city_benchmarks')
      .select('city_key,city,state,sale_sqm,rent_sqm,source,reference_period,synced_at')
      .eq('state', 'RN')
      .order('city', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data?.length) {
      const fallback = buildFallbackRows();
      memoryCache = { expiresAt: Date.now() + CACHE_TTL_MS, rows: fallback };
      return fallback;
    }

    const rows: CachedCityBenchmark[] = data.map((row) => ({
      cityKey: String(row.city_key),
      city: String(row.city),
      state: 'RN',
      saleSqm: Number(row.sale_sqm),
      rentSqm: Number(row.rent_sqm),
      source: String(row.source),
      referencePeriod: String(row.reference_period),
      syncedAt: String(row.synced_at ?? '')
    }));

    const natal = rows.find((row) => row.cityKey === 'natal-rn') ?? rows[0];
    const derived = deriveRegionalCities(natal).filter(
      (derivedCity) => !rows.some((row) => row.cityKey === derivedCity.cityKey)
    );

    const merged = [...rows, ...derived];
    memoryCache = { expiresAt: Date.now() + CACHE_TTL_MS, rows: merged };
    return merged;
  } catch {
    const fallback = buildFallbackRows();
    memoryCache = { expiresAt: Date.now() + CACHE_TTL_MS, rows: fallback };
    return fallback;
  }
}

export async function getNatalBenchmark(): Promise<CachedCityBenchmark> {
  const rows = await loadMarketCityBenchmarks();
  return rows.find((row) => row.cityKey === 'natal-rn') ?? STATIC_NATAL_FALLBACK;
}

export async function resolveCityReference(location: string): Promise<MarketCityReference & { syncedAt?: string }> {
  const cityLabel = location.split(',')[0]?.trim() || location.trim();
  const normalized = cityLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const rows = await loadMarketCityBenchmarks();
  const direct = rows.find((row) => {
    const rowCity = row.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    return rowCity === normalized;
  });

  if (direct) {
    return {
      ...direct,
      isApproximate: direct.cityKey !== 'natal-rn'
    };
  }

  const natal = rows.find((row) => row.cityKey === 'natal-rn') ?? STATIC_NATAL_FALLBACK;

  return {
    city: cityLabel || 'Rio Grande do Norte',
    state: 'RN',
    saleSqm: Math.round(natal.saleSqm * RN_STATE_FALLBACK_MULTIPLIER.sale),
    rentSqm: Math.round(natal.rentSqm * RN_STATE_FALLBACK_MULTIPLIER.rent * 100) / 100,
    source: 'Estimativa aproximada do interior do RN (sem dados especificos da cidade)',
    referencePeriod: natal.referencePeriod,
    syncedAt: natal.syncedAt,
    isApproximate: true
  };
}
