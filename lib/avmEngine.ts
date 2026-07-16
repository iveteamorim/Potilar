import { describeGeoAdjustment, getGeoPriceAdjustment } from '@/lib/geoPriceAdjustment';
import type { ListingPresentationScore } from '@/lib/listingPresentationSignals';
import type { MarketBenchmark } from '@/lib/marketReference';
import { getDataTierLabel, hasDefensiblePriceData } from '@/lib/priceDataTier';

export type AvmPillarKey = 'comps' | 'geo' | 'property' | 'macro';

export type AvmPillar = {
  key: AvmPillarKey;
  label: string;
  weight: number;
  summary: string;
  signal?: string;
};

export type AvmBlendResult = {
  estimatedPrice: number;
  confidenceScore: number;
  pillars: AvmPillar[];
};

type BlendInput = {
  transaction: string;
  location: string;
  neighborhood?: string | null;
  lat?: number;
  lng?: number;
  listingPrice: number;
  primary: MarketBenchmark;
  macro?: MarketBenchmark | null;
  presentation: ListingPresentationScore;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

export function blendAvmEstimate(input: BlendInput): AvmBlendResult {
  const hasComps = input.primary.dataTier === 'potilar_listings';
  const macro = input.macro && hasDefensiblePriceData(input.macro.dataTier) ? input.macro : null;
  const macroIsOfficial =
    macro?.dataTier === 'fipezap_city' || macro?.dataTier === 'fipezap_neighborhood';
  const geoAdj = hasComps || macroIsOfficial ? getGeoPriceAdjustment(input) : 0;

  const compsBase = hasComps ? input.primary.benchmarkPrice : 0;
  const macroBase = macro?.benchmarkPrice ?? input.primary.benchmarkPrice;

  // Sem inventar: preço de referência vem só de comps reais ou índice FipeZAP.
  let estimatedPrice = hasComps && macro ? Math.round(compsBase * 0.62 + macroBase * 0.38) : macroBase;

  if (geoAdj !== 0 && (hasComps || macroIsOfficial)) {
    estimatedPrice = Math.round(estimatedPrice * (1 + geoAdj));
  }

  const pillars: AvmPillar[] = [
    {
      key: 'comps',
      label: 'Anúncios online',
      weight: hasComps ? 0.45 : 0.1,
      summary: hasComps
        ? `${input.primary.sampleCount ?? 0} anúncios semelhantes na Potilar (${formatMoney(compsBase)}).`
        : 'Sem anúncios comparáveis suficientes na Potilar nesta região.',
      signal: hasComps ? 'ativo' : 'indisponível'
    },
    {
      key: 'macro',
      label: 'Índice de mercado',
      weight: macroIsOfficial ? 0.3 : 0,
      summary: macroIsOfficial
        ? `${getDataTierLabel(macro!.dataTier, macro!.sampleCount)} · referência ${formatMoney(macroBase)}.`
        : 'Índice FipeZAP indisponível para esta região.',
      signal: macroIsOfficial ? macro!.referencePeriod || 'oficial' : 'indisponível'
    },
    {
      key: 'geo',
      label: 'Geolocalização',
      weight: geoAdj !== 0 ? 0.15 : 0,
      summary: describeGeoAdjustment(geoAdj),
      signal: geoAdj !== 0 ? `${geoAdj > 0 ? '+' : ''}${Math.round(geoAdj * 100)}%` : 'neutro'
    },
    {
      key: 'property',
      label: 'Imóvel e mídia',
      weight: 0.1,
      summary:
        input.presentation.highlights.length > 0
          ? `Qualidade do anúncio: ${input.presentation.highlights.join(', ')}. Não altera o preço de mercado.`
          : 'Complete fotos, metragem e descrição para transmitir mais confiança.',
      signal: `${input.presentation.score}/100`
    }
  ];

  let confidence = 0;
  if (hasComps) confidence += 55;
  if (macroIsOfficial) confidence += hasComps ? 25 : 52;
  if ((input.primary.sampleCount ?? 0) >= 8) confidence += 10;
  if (Number.isFinite(input.lat) && Number.isFinite(input.lng) && (hasComps || macroIsOfficial)) confidence += 5;
  confidence = Math.min(96, confidence);

  return {
    estimatedPrice,
    confidenceScore: confidence,
    pillars
  };
}
