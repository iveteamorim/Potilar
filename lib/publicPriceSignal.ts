import type { PriceInsight } from '@/lib/priceIntelligence';
import type { PriceDataTier } from '@/lib/priceDataTier';

export type PublicPriceRangeStatus = 'inside' | 'below' | 'above';
export type PrecoJustoViewer = 'public' | 'owner';

export type PublicPriceSignal = {
  rangeStatus: PublicPriceRangeStatus;
  title: string;
  explanation: string;
  source?: string;
  referencePeriod?: string;
};

export const PUBLIC_PRICE_TITLES: Record<PublicPriceRangeStatus, string> = {
  inside: 'Preço dentro da faixa da região',
  below: 'Preço abaixo da faixa da região',
  above: 'Preço acima da faixa da região'
};

export const PUBLIC_PRICE_EXPLANATION =
  'Contexto de mercado com base em referências da região. Não é uma avaliação oficial do imóvel.';

/** Fields that must never appear on a public Preço Justo payload. */
export const SENSITIVE_PRICE_INSIGHT_KEYS = [
  'listingPrice',
  'medianPrice',
  'minPrice',
  'maxPrice',
  'percentVsMedian',
  'pricePerSqm',
  'estimatedAreaSqm',
  'estimatedValue',
  'confidenceScore',
  'pillars',
  'tip',
  'summary',
  'dataTier',
  'sampleCount',
  'verdict',
  'scope',
  'scopeLabel',
  'isApproximate',
  'priceUnit'
] as const;

export function isListingOwner(
  userId: string | null | undefined,
  ownerId: string | null | undefined
): boolean {
  return Boolean(userId && ownerId && userId === ownerId);
}

export function resolvePrecoJustoViewer(
  userId: string | null | undefined,
  ownerId: string | null | undefined
): PrecoJustoViewer {
  return isListingOwner(userId, ownerId) ? 'owner' : 'public';
}

export function getPublicRangeStatus(
  insight: Pick<PriceInsight, 'listingPrice' | 'minPrice' | 'maxPrice' | 'verdict' | 'medianPrice'>
): PublicPriceRangeStatus | null {
  if (insight.verdict === 'insufficient_data' || insight.medianPrice <= 0) return null;
  if (insight.listingPrice < insight.minPrice) return 'below';
  if (insight.listingPrice > insight.maxPrice) return 'above';
  return 'inside';
}

export function getPublicSourceLabel(dataTier: PriceDataTier): string | undefined {
  if (dataTier === 'fipezap_city' || dataTier === 'fipezap_neighborhood') {
    return 'Índice FipeZAP';
  }
  if (dataTier === 'potilar_listings') {
    return 'Anúncios na Potilar';
  }
  return undefined;
}

export function toPublicPriceSignal(insight: PriceInsight): PublicPriceSignal | null {
  const rangeStatus = getPublicRangeStatus(insight);
  if (!rangeStatus) return null;

  const signal: PublicPriceSignal = {
    rangeStatus,
    title: PUBLIC_PRICE_TITLES[rangeStatus],
    explanation: PUBLIC_PRICE_EXPLANATION
  };

  const source = getPublicSourceLabel(insight.dataTier);
  if (source) signal.source = source;

  const period = insight.referencePeriod?.trim();
  if (period) signal.referencePeriod = period;

  return signal;
}

export function getSensitiveKeysInPublicPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  return SENSITIVE_PRICE_INSIGHT_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(payload, key));
}

export type PrecoJustoPresentation =
  | { kind: 'none' }
  | { kind: 'public'; signal: PublicPriceSignal }
  | { kind: 'owner'; insight: PriceInsight };

export function selectPrecoJustoPresentation(
  userId: string | null | undefined,
  ownerId: string | null | undefined,
  insight: PriceInsight
): PrecoJustoPresentation {
  if (insight.verdict === 'insufficient_data' || insight.medianPrice <= 0) {
    return { kind: 'none' };
  }

  if (resolvePrecoJustoViewer(userId, ownerId) === 'owner') {
    return { kind: 'owner', insight };
  }

  const signal = toPublicPriceSignal(insight);
  if (!signal) return { kind: 'none' };
  return { kind: 'public', signal };
}

/** Props that would be serialized to the browser for this viewer. */
export function getPrecoJustoSerializedPayload(presentation: PrecoJustoPresentation) {
  if (presentation.kind === 'public') {
    return { component: 'PublicPrecoJustoSignal' as const, props: { signal: presentation.signal } };
  }
  if (presentation.kind === 'owner') {
    return { component: 'PrecoJustoRNCard' as const, props: { insight: presentation.insight } };
  }
  return null;
}

/** Every string PublicPrecoJustoSignal writes into the DOM. */
export const PRECO_JUSTO_UNAUTHORIZED_BODY = { error: 'Não autenticado' } as const;
export const PRECO_JUSTO_UNAUTHORIZED_STATUS = 401;

export function canAccessPrecoJustoAdvisorApi(
  user: { id?: string | null } | null | undefined
): boolean {
  return Boolean(user?.id);
}

export function getPrecoJustoAdvisorApiAuthRejection(
  user: { id?: string | null } | null | undefined
): { status: 401; body: { error: string } } | null {
  if (canAccessPrecoJustoAdvisorApi(user)) return null;
  return {
    status: PRECO_JUSTO_UNAUTHORIZED_STATUS,
    body: { error: PRECO_JUSTO_UNAUTHORIZED_BODY.error }
  };
}

export function getPublicPrecoJustoDomStrings(signal: PublicPriceSignal): string[] {
  const sourceLine = [signal.source, signal.referencePeriod].filter(Boolean).join(' · ');
  return [
    'Contexto de mercado Preço Justo RN',
    'Preço Justo RN',
    signal.rangeStatus,
    signal.title,
    signal.explanation,
    sourceLine
  ].filter(Boolean);
}
