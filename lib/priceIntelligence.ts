import { blendAvmEstimate, type AvmPillar } from '@/lib/avmEngine';
import { cityFromLocation, getMacroBenchmark } from '@/lib/marketReference';
import { getPotilarListingBenchmark } from '@/lib/marketListingBenchmark';
import { presentationFromProperty, scoreListingPresentation } from '@/lib/listingPresentationSignals';
import { resolveCityReference } from '@/lib/marketCityCache';
import {
  canShowPriceComparison,
  getDataTierLabel,
  hasDefensiblePriceData,
  type PriceDataTier
} from '@/lib/priceDataTier';

export type PriceVerdict = 'much_below' | 'below' | 'fair' | 'above' | 'much_above' | 'insufficient_data';

export type PriceInsight = {
  verdict: PriceVerdict;
  listingPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  percentVsMedian: number;
  scope: 'neighborhood' | 'city' | 'state';
  scopeLabel: string;
  pricePerSqm: number;
  estimatedAreaSqm: number;
  source: string;
  referencePeriod: string;
  isApproximate: boolean;
  priceUnit: 'monthly' | 'daily' | 'sale';
  dataTier: PriceDataTier;
  sampleCount?: number;
  title: string;
  summary: string;
  tip?: string;
  estimatedValue?: number;
  confidenceScore?: number;
  pillars?: AvmPillar[];
};

export type PriceInsightInput = {
  price: number;
  transaction: string;
  propertyType: string;
  location: string;
  neighborhood?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  areaSqm?: number;
  lat?: number;
  lng?: number;
  excludeListingId?: string;
  isFurnished?: boolean;
  isPetFriendly?: boolean;
  imageCount?: number;
  videoUrl?: string | null;
  tourUrl?: string | null;
  featureCount?: number;
  descriptionLength?: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

function isEstimateTier(tier: PriceDataTier) {
  return tier === 'calibrated_estimate' || tier === 'land_estimate';
}

function getVerdict(percentVsMedian: number, dataTier: PriceDataTier): PriceVerdict {
  const isApproximate = isEstimateTier(dataTier);

  if (isApproximate) {
    if (percentVsMedian <= -25) return 'much_below';
    if (percentVsMedian < -10) return 'below';
    if (percentVsMedian <= 10) return 'fair';
    if (percentVsMedian <= 25) return 'above';
    return 'much_above';
  }

  if (percentVsMedian <= -15) return 'much_below';
  if (percentVsMedian < -5) return 'below';
  if (percentVsMedian <= 5) return 'fair';
  if (percentVsMedian <= 15) return 'above';
  return 'much_above';
}

function buildInsightCopy(
  verdict: PriceVerdict,
  input: PriceInsightInput,
  benchmark: {
    benchmarkPrice: number;
    minPrice: number;
    maxPrice: number;
    pricePerSqm: number;
    estimatedAreaSqm: number;
    scope: PriceInsight['scope'];
    scopeLabel: string;
    source: string;
    referencePeriod: string;
    isApproximate: boolean;
    dataTier: PriceDataTier;
  }
): Pick<PriceInsight, 'title' | 'summary' | 'tip'> {
  const priceLabel = formatMoney(input.price);
  const referenceLabel = formatMoney(benchmark.benchmarkPrice);
  const rangeLabel = `${formatMoney(benchmark.minPrice)} a ${formatMoney(benchmark.maxPrice)}`;
  const scopeText =
    benchmark.scope === 'neighborhood'
      ? `no bairro ${benchmark.scopeLabel}`
      : benchmark.scope === 'city'
        ? `em ${benchmark.scopeLabel}`
        : `no ${benchmark.scopeLabel}`;

  const unitNote =
    input.transaction === 'Temporada'
      ? `Referência diária estimada com base em R$ ${benchmark.pricePerSqm}/m2 por dia e ${benchmark.estimatedAreaSqm} m2.`
      : input.transaction === 'Compra'
        ? `Referência com base em R$ ${benchmark.pricePerSqm}/m2 de venda e ${benchmark.estimatedAreaSqm} m2.`
        : `Referência com base em R$ ${benchmark.pricePerSqm}/m2 de aluguel mensal e ${benchmark.estimatedAreaSqm} m2.`;

  const approxNote = isEstimateTier(benchmark.dataTier)
    ? 'Estimativa Potilar (não é índice oficial). '
    : benchmark.dataTier === 'potilar_listings'
      ? 'Comparação com anúncios reais publicados na Potilar. '
      : '';
  const baseContext = `${approxNote}${unitNote} Faixa ${scopeText}: ${rangeLabel}. Referência central: ${referenceLabel}. ${benchmark.source}${benchmark.referencePeriod ? ` (${benchmark.referencePeriod})` : ''}.`;

  switch (verdict) {
    case 'much_below':
      return {
        title: benchmark.dataTier === 'fipezap_city' || benchmark.dataTier === 'fipezap_neighborhood'
          ? 'Preço bem abaixo do índice FipeZAP'
          : benchmark.dataTier === 'potilar_listings'
            ? 'Preço bem abaixo dos anúncios na Potilar'
            : 'Preço abaixo da estimativa Potilar',
        summary: `Você pede ${priceLabel}, abaixo da referência ${scopeText}. ${baseContext}`,
        tip:
          benchmark.dataTier === 'potilar_listings'
            ? 'Compare também com portais externos - a amostra na Potilar ainda pode ser pequena.'
            : isEstimateTier(benchmark.dataTier)
              ? 'No interior do RN os valores variam muito. Confirme com anúncios locais antes de ajustar.'
              : 'Valores muito abaixo do mercado podem gerar desconfiança. Confirme o preço e destaque diferenciais reais do imóvel.'
      };
    case 'below':
      return {
        title:
          benchmark.dataTier === 'potilar_listings'
            ? 'Preço abaixo dos anúncios na Potilar'
            : isEstimateTier(benchmark.dataTier)
              ? 'Preço um pouco abaixo da estimativa'
              : 'Preço abaixo da referência FipeZAP',
        summary: `Você pede ${priceLabel}, abaixo da referência ${scopeText}. ${baseContext}`,
        tip: 'Bom para atrair contatos rapidamente, principalmente em aluguel e temporada.'
      };
    case 'fair':
      return {
        title:
          benchmark.dataTier === 'potilar_listings'
            ? 'Preço alinhado aos anúncios na Potilar'
            : isEstimateTier(benchmark.dataTier)
              ? 'Preço dentro da faixa estimada'
              : 'Preço alinhado ao índice FipeZAP',
        summary: `Você pede ${priceLabel}, próximo da referência ${scopeText}. ${baseContext}`,
        tip: isEstimateTier(benchmark.dataTier)
          ? 'Estimativa orientativa - confirme com portais e anúncios locais.'
          : 'Valor competitivo frente a referências publicadas na internet na mesma região.'
      };
    case 'above':
      return {
        title: 'Preço acima da referência',
        summary: `Você pede ${priceLabel}, acima da referência ${scopeText}. ${baseContext}`,
        tip: 'Se o imóvel tiver diferenciais reais (vista, suíte, mobília, garagem), deixe isso claro na descrição e nas fotos.'
      };
    case 'much_above':
      return {
        title: 'Preço bem acima da referência',
        summary: `Você pede ${priceLabel}, bem acima da referência ${scopeText}. ${baseContext}`,
        tip: 'Valores muito altos costumam reduzir contatos. Considere ajustar ou reforçar o que justifica o preço.'
      };
    default:
      return {
        title: 'Referência indisponível',
        summary: 'Ainda não há dados públicos suficientes para comparar este tipo de negociação na região.',
        tip: 'Tente informar cidade, bairro, metragem e tipo de imóvel para uma leitura mais precisa.'
      };
  }
}

export async function buildPriceInsight(input: PriceInsightInput): Promise<PriceInsight> {
  const cityLabel = cityFromLocation(input.location) || 'RN';

  if (!input.price || input.price <= 0 || !input.transaction || !input.propertyType || !input.location.trim()) {
    return {
      verdict: 'insufficient_data',
      listingPrice: input.price,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      percentVsMedian: 0,
      scope: 'city',
      scopeLabel: cityLabel,
      pricePerSqm: 0,
      estimatedAreaSqm: 0,
      source: '',
      referencePeriod: '',
      isApproximate: false,
      priceUnit: 'monthly',
      dataTier: 'none',
      title: 'Informe preço, cidade, tipo e negociação',
      summary: 'Preencha os dados do anúncio para comparar com referências de mercado online no RN.',
      tip: 'Quanto mais completo o cadastro (bairro, metragem, quartos), melhor a leitura de preço.'
    };
  }

  const cityRef = await resolveCityReference(input.location);
  const potilarBenchmark = await getPotilarListingBenchmark(input);
  const macroBenchmark = await getMacroBenchmark(input);
  const defensibleMacro =
    macroBenchmark && hasDefensiblePriceData(macroBenchmark.dataTier) ? macroBenchmark : null;
  const benchmark = potilarBenchmark ?? defensibleMacro;

  if (!benchmark) {
    if (input.propertyType === 'Terreno' && input.transaction === 'Aluguel') {
      return {
        verdict: 'insufficient_data',
        listingPrice: input.price,
        medianPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        percentVsMedian: 0,
        scope: 'city',
        scopeLabel: cityLabel,
        pricePerSqm: 0,
        estimatedAreaSqm: 0,
        source: '',
        referencePeriod: '',
        isApproximate: false,
        priceUnit: 'monthly',
        dataTier: 'none',
        title: 'Referência indisponível para este tipo',
        summary: 'Não há referência pública consolidada para aluguel de terreno nesta região.',
        tip: 'Para terrenos, compare com anúncios semelhantes na mesma rua ou loteamento.'
      };
    }

    if (cityRef.cityDataTier === 'generic') {
      return {
        verdict: 'insufficient_data',
        listingPrice: input.price,
        medianPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        percentVsMedian: 0,
        scope: 'city',
        scopeLabel: cityLabel,
        pricePerSqm: 0,
        estimatedAreaSqm: 0,
        source: getDataTierLabel('generic_estimate'),
        referencePeriod: '',
        isApproximate: true,
        priceUnit: 'monthly',
        dataTier: 'generic_estimate',
        title: 'Sem dados confiaveis nesta cidade',
        summary: `Não há índice FipeZAP nem anúncios suficientes na Potilar em ${cityLabel} para comparar automaticamente. Consulte portais locais (OLX, Zap, imobiliárias) antes de definir o preço.`,
        tip: 'Quando houver mais anúncios reais na sua cidade, a Potilar poderá comparar com dados locais.'
      };
    }

    return {
      verdict: 'insufficient_data',
      listingPrice: input.price,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      percentVsMedian: 0,
      scope: 'city',
      scopeLabel: cityLabel,
      pricePerSqm: 0,
      estimatedAreaSqm: 0,
      source: '',
      referencePeriod: '',
      isApproximate: false,
      priceUnit: 'monthly',
      dataTier: 'none',
      title: 'Referência indisponível',
      summary: 'Não foi possível calcular uma referência para este anúncio.',
      tip: 'Verifique cidade, metragem, tipo e negociação.'
    };
  }

  if (!canShowPriceComparison(benchmark.dataTier)) {
    return {
      verdict: 'insufficient_data',
      listingPrice: input.price,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      percentVsMedian: 0,
      scope: benchmark.scope,
      scopeLabel: benchmark.scopeLabel,
      pricePerSqm: 0,
      estimatedAreaSqm: benchmark.estimatedAreaSqm,
      source: benchmark.source,
      referencePeriod: benchmark.referencePeriod,
      isApproximate: true,
      priceUnit: benchmark.priceUnit,
      dataTier: benchmark.dataTier,
      title: 'Sem dados confiaveis',
      summary: benchmark.source,
      tip: 'Compare manualmente com anúncios da região.'
    };
  }

  const percentVsMedian =
    benchmark.benchmarkPrice > 0
      ? Math.round(((input.price - benchmark.benchmarkPrice) / benchmark.benchmarkPrice) * 100)
      : 0;
  const verdict = getVerdict(percentVsMedian, benchmark.dataTier);
  const copy = buildInsightCopy(verdict, input, benchmark);

  const presentation = scoreListingPresentation({
    imageCount: input.imageCount,
    videoUrl: input.videoUrl,
    tourUrl: input.tourUrl,
    areaSqm: input.areaSqm,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    parking: input.parking,
    isFurnished: input.isFurnished,
    isPetFriendly: input.isPetFriendly,
    featureCount: input.featureCount,
    descriptionLength: input.descriptionLength
  });

  const avm = blendAvmEstimate({
    transaction: input.transaction,
    location: input.location,
    neighborhood: input.neighborhood,
    lat: input.lat,
    lng: input.lng,
    listingPrice: input.price,
    primary: benchmark,
    macro: defensibleMacro,
    presentation
  });

  const referencePrice = benchmark.benchmarkPrice;
  const percentVsEstimate =
    referencePrice > 0 ? Math.round(((input.price - referencePrice) / referencePrice) * 100) : percentVsMedian;

  if (avm.confidenceScore < 50) {
    return {
      verdict: 'insufficient_data',
      listingPrice: input.price,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      percentVsMedian: 0,
      scope: benchmark.scope,
      scopeLabel: benchmark.scopeLabel,
      pricePerSqm: benchmark.pricePerSqm,
      estimatedAreaSqm: benchmark.estimatedAreaSqm,
      source: benchmark.source,
      referencePeriod: benchmark.referencePeriod,
      isApproximate: false,
      priceUnit: benchmark.priceUnit,
      dataTier: benchmark.dataTier,
      sampleCount: benchmark.sampleCount,
      title: 'Dados insuficientes para comparar',
      summary:
        'Não há anúncios comparáveis suficientes na Potilar nem índice FipeZAP confiável para esta região. A Potilar não estima um preço automático sem base real.',
      tip: 'Compare manualmente com portais locais (OLX, Zap, imobiliárias) antes de definir o valor.'
    };
  }

  return {
    verdict,
    listingPrice: input.price,
    medianPrice: referencePrice,
    minPrice: benchmark.minPrice,
    maxPrice: benchmark.maxPrice,
    percentVsMedian: percentVsEstimate,
    scope: benchmark.scope,
    scopeLabel: benchmark.scopeLabel,
    pricePerSqm: benchmark.pricePerSqm,
    estimatedAreaSqm: benchmark.estimatedAreaSqm,
    source: benchmark.source,
    referencePeriod: benchmark.referencePeriod,
    isApproximate: benchmark.isApproximate,
    priceUnit: benchmark.priceUnit,
    dataTier: benchmark.dataTier,
    sampleCount: benchmark.sampleCount,
    estimatedValue: referencePrice,
    confidenceScore: avm.confidenceScore,
    pillars: avm.pillars,
    ...copy
  };
}

export function priceInsightInputFromProperty(property: import('@/data/properties').Property): PriceInsightInput {
  const presentation = presentationFromProperty(property);
  return {
    price: property.price,
    transaction: property.transaction,
    propertyType: property.propertyType,
    location: property.location,
    neighborhood: property.neighborhood,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking: property.parking,
    areaSqm: property.areaSqm,
    lat: property.lat,
    lng: property.lng,
    excludeListingId: property.id,
    isFurnished: property.isFurnished,
    isPetFriendly: property.isPetFriendly,
    imageCount: presentation.imageCount,
    videoUrl: property.videoUrl,
    tourUrl: property.tourUrl,
    featureCount: presentation.featureCount,
    descriptionLength: presentation.descriptionLength
  };
}

export async function fetchPriceInsight(input: PriceInsightInput): Promise<PriceInsight> {
  return await buildPriceInsight(input);
}

export function getVerdictStyles(verdict: PriceVerdict) {
  switch (verdict) {
    case 'much_below':
      return {
        badge: 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100',
        border: 'border-sky-200 dark:border-sky-900'
      };
    case 'below':
      return {
        badge: 'bg-teal-100 text-teal-900 dark:bg-teal-950/40 dark:text-teal-100',
        border: 'border-teal-200 dark:border-teal-900'
      };
    case 'fair':
      return {
        badge: 'bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-100',
        border: 'border-green-200 dark:border-green-900'
      };
    case 'above':
      return {
        badge: 'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100',
        border: 'border-amber-200 dark:border-amber-900'
      };
    case 'much_above':
      return {
        badge: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-100',
        border: 'border-red-200 dark:border-red-900'
      };
    default:
      return {
        badge: 'bg-sand-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        border: 'border-sand-200 dark:border-slate-700'
      };
  }
}
