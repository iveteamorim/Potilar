import { cityFromLocation, getMarketBenchmark } from '@/lib/marketReference';

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
  title: string;
  summary: string;
  tip?: string;
};

export type PriceInsightInput = {
  price: number;
  transaction: string;
  propertyType: string;
  location: string;
  neighborhood?: string | null;
  bedrooms?: number;
  areaSqm?: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

function getVerdict(percentVsMedian: number, isApproximate = false): PriceVerdict {
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
      ? `Referencia diaria estimada com base em aluguel de R$ ${benchmark.pricePerSqm}/m2 e ${benchmark.estimatedAreaSqm} m2.`
      : `Referencia com base em R$ ${benchmark.pricePerSqm}/m2 e ${benchmark.estimatedAreaSqm} m2 estimados.`;

  const approxNote = benchmark.isApproximate
    ? 'Estimativa aproximada para cidades do interior — use como orientacao, nao como avaliacao oficial. '
    : '';
  const baseContext = `${approxNote}${unitNote} Faixa de mercado ${scopeText}: ${rangeLabel}. Referencia central: ${referenceLabel}. Fonte: ${benchmark.source} (${benchmark.referencePeriod}).`;

  switch (verdict) {
    case 'much_below':
      return {
        title: benchmark.isApproximate ? 'Preco abaixo da estimativa regional' : 'Preco bem abaixo do mercado online',
        summary: `Voce pede ${priceLabel}, abaixo da referencia ${scopeText}. ${baseContext}`,
        tip: benchmark.isApproximate
          ? 'No interior do RN os valores variam muito. Confirme com outros anuncios da mesma cidade antes de ajustar.'
          : 'Valores muito abaixo do mercado podem gerar desconfianca. Confirme o preco e destaque diferenciais reais do imovel.'
      };
    case 'below':
      return {
        title: benchmark.isApproximate ? 'Preco um pouco abaixo da estimativa' : 'Preco abaixo da referencia de mercado',
        summary: `Voce pede ${priceLabel}, abaixo da referencia ${scopeText}. ${baseContext}`,
        tip: 'Bom para atrair contatos rapidamente, principalmente em aluguel e temporada.'
      };
    case 'fair':
      return {
        title: benchmark.isApproximate ? 'Preco dentro da faixa estimada' : 'Preco alinhado ao mercado do RN',
        summary: `Voce pede ${priceLabel}, proximo da referencia ${scopeText}. ${baseContext}`,
        tip: benchmark.isApproximate
          ? 'Para cidades pequenas, compare tambem com anuncios locais na Potilar e em portais da regiao.'
          : 'Valor competitivo frente aos anuncios publicados na internet na mesma regiao.'
      };
    case 'above':
      return {
        title: 'Preco acima da referencia de mercado',
        summary: `Voce pede ${priceLabel}, acima da referencia ${scopeText}. ${baseContext}`,
        tip: 'Se o imovel tiver diferenciais reais (vista, suite, mobilia, garagem), deixe isso claro na descricao e nas fotos.'
      };
    case 'much_above':
      return {
        title: 'Preco bem acima do mercado online',
        summary: `Voce pede ${priceLabel}, bem acima da referencia ${scopeText}. ${baseContext}`,
        tip: 'Valores muito altos costumam reduzir contatos. Considere ajustar ou reforcar o que justifica o preco.'
      };
    default:
      return {
        title: 'Referencia indisponivel',
        summary: 'Ainda nao ha dados publicos suficientes para comparar este tipo de negociacao na regiao.',
        tip: 'Tente informar cidade, bairro, metragem e tipo de imovel para uma leitura mais precisa.'
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
      title: 'Informe preco, cidade, tipo e negociacao',
      summary: 'Preencha os dados do anuncio para comparar com referencias de mercado online no RN.',
      tip: 'Quanto mais completo o cadastro (bairro, metragem, quartos), melhor a leitura de preco.'
    };
  }

  const benchmark = await getMarketBenchmark(input);

  if (!benchmark) {
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
      title: 'Referencia indisponivel para este tipo',
      summary: 'Nao ha referencia publica consolidada para aluguel de terreno nesta regiao.',
      tip: 'Para terrenos, compare com anuncios semelhantes na mesma rua ou loteamento.'
    };
  }

  const percentVsMedian =
    benchmark.benchmarkPrice > 0
      ? Math.round(((input.price - benchmark.benchmarkPrice) / benchmark.benchmarkPrice) * 100)
      : 0;
  const verdict = getVerdict(percentVsMedian, benchmark.isApproximate);
  const copy = buildInsightCopy(verdict, input, benchmark);

  return {
    verdict,
    listingPrice: input.price,
    medianPrice: benchmark.benchmarkPrice,
    minPrice: benchmark.minPrice,
    maxPrice: benchmark.maxPrice,
    percentVsMedian,
    scope: benchmark.scope,
    scopeLabel: benchmark.scopeLabel,
    pricePerSqm: benchmark.pricePerSqm,
    estimatedAreaSqm: benchmark.estimatedAreaSqm,
    source: benchmark.source,
    referencePeriod: benchmark.referencePeriod,
    isApproximate: benchmark.isApproximate,
    ...copy
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
