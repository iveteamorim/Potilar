'use client';

import { Sparkles, TrendingDown, TrendingUp, Scale } from 'lucide-react';
import type { PriceInsight } from '@/lib/priceIntelligence';
import { getVerdictStyles } from '@/lib/priceIntelligence';
import { getConfidenceLabel, getDataTierLabel } from '@/lib/priceDataTier';

type Props = {
  insight: PriceInsight;
  compact?: boolean;
};

function formatMoney(value: number) {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

function VerdictIcon({ verdict }: { verdict: PriceInsight['verdict'] }) {
  if (verdict === 'above' || verdict === 'much_above') {
    return <TrendingUp className="h-4 w-4" aria-hidden="true" />;
  }
  if (verdict === 'below' || verdict === 'much_below') {
    return <TrendingDown className="h-4 w-4" aria-hidden="true" />;
  }
  if (verdict === 'fair') {
    return <Scale className="h-4 w-4" aria-hidden="true" />;
  }
  return <Sparkles className="h-4 w-4" aria-hidden="true" />;
}

export default function PrecoJustoRNCard({ insight, compact = false }: Props) {
  const styles = getVerdictStyles(insight.verdict);
  const hasComparison = insight.verdict !== 'insufficient_data' && insight.medianPrice > 0;
  const isNoData = insight.dataTier === 'generic_estimate';
  const tierLabel = getDataTierLabel(insight.dataTier, insight.sampleCount);
  const confidence = getConfidenceLabel(insight.dataTier);
  const referenceStatLabel =
    insight.dataTier === 'potilar_listings'
      ? 'Media na Potilar'
      : insight.dataTier === 'fipezap_city' || insight.dataTier === 'fipezap_neighborhood'
        ? 'Indice FipeZAP'
        : 'Estimativa Potilar';

  const rangeStatus = hasComparison
    ? insight.listingPrice < insight.minPrice
      ? 'below'
      : insight.listingPrice > insight.maxPrice
        ? 'above'
        : 'inside'
    : 'unknown';

  const rangeTitle = isNoData
    ? insight.title
    : rangeStatus === 'below'
      ? 'Preco abaixo da faixa'
      : rangeStatus === 'above'
        ? 'Preco acima da faixa'
        : rangeStatus === 'inside'
          ? 'Preco dentro da faixa'
          : insight.title;

  const rangeBadge = isNoData
    ? 'bg-sand-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
    : rangeStatus === 'below'
      ? 'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
      : rangeStatus === 'above'
        ? 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-100'
        : rangeStatus === 'inside'
          ? 'bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-100'
          : styles.badge;

  const rangeBorder = isNoData
    ? 'border-sand-200 dark:border-slate-700'
    : rangeStatus === 'below'
      ? 'border-amber-200 dark:border-amber-900'
      : rangeStatus === 'above'
        ? 'border-red-200 dark:border-red-900'
        : rangeStatus === 'inside'
          ? 'border-green-200 dark:border-green-900'
          : styles.border;

  const diffLabel = !hasComparison
    ? tierLabel
    : insight.percentVsMedian === 0
      ? 'Dentro da referencia'
      : `${insight.percentVsMedian > 0 ? '+' : ''}${insight.percentVsMedian}% ${
          insight.percentVsMedian > 0 ? 'acima' : 'abaixo'
        } da referencia`;

  const diffAmount = hasComparison ? insight.listingPrice - insight.medianPrice : 0;
  const diffAmountLabel =
    diffAmount === 0 ? 'R$ 0' : `${diffAmount > 0 ? '+' : '-'}${formatMoney(Math.abs(diffAmount))}`;

  const diffColor =
    rangeStatus === 'above'
      ? 'text-red-700 dark:text-red-200'
      : rangeStatus === 'below'
        ? 'text-amber-700 dark:text-amber-200'
        : insight.verdict === 'much_above' || insight.verdict === 'above'
          ? 'text-amber-700 dark:text-amber-200'
          : insight.verdict === 'much_below'
            ? 'text-sky-700 dark:text-sky-200'
            : 'text-green-700 dark:text-green-200';

  return (
    <section
      className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5 ${rangeBorder}`}
      aria-label="Analise Preco Justo RN"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ocean-600">Preco Justo RN</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tierLabel}</p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${rangeBadge}`}
        >
          <VerdictIcon verdict={insight.verdict} />
          {rangeTitle}
        </span>
      </div>

      {hasComparison ? (
        <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">
          Seu imovel em <strong className="text-slate-950 dark:text-white">{insight.scopeLabel}</strong> foi comparado
          com {referenceStatLabel.toLowerCase()}.
          {rangeStatus === 'below' && ' Isso pode atrair mais interessados.'}
          {rangeStatus === 'above' && ' Reforce os diferenciais reais do imovel.'}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{insight.summary}</p>
      )}

      {hasComparison && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Seu preco" value={formatMoney(insight.listingPrice)} featured />
          <Stat label={referenceStatLabel} value={formatMoney(insight.medianPrice)} featured />
          <Stat label="Diferenca" value={diffAmountLabel} featured />
        </div>
      )}

      {hasComparison && (
        <p className={`mt-3 text-sm font-extrabold ${diffColor}`}>{diffLabel}</p>
      )}

      {hasComparison && (
        <div className={`mt-4 grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-4'}`}>
          <Stat label="Faixa" value={`${formatMoney(insight.minPrice)} - ${formatMoney(insight.maxPrice)}`} />
          <Stat
            label="Base"
            value={`${formatMoney(insight.pricePerSqm)}/m2${
              insight.priceUnit === 'daily' ? '/dia' : insight.priceUnit === 'monthly' ? '/mes' : ''
            } · ${insight.estimatedAreaSqm} m2`}
          />
          <Stat label="Tipo de dado" value={confidence} />
          <Stat label="Detalhe" value={insight.source || tierLabel} />
        </div>
      )}

      {hasComparison && insight.isApproximate && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Esta comparacao usa estimativa Potilar, nao indice oficial. Confirme com portais e anuncios locais antes de
          decidir o preco.
        </p>
      )}

      {hasComparison && (insight.dataTier === 'fipezap_city' || insight.dataTier === 'fipezap_neighborhood') && (
        <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs leading-5 text-green-950 dark:border-green-900 dark:bg-green-950/30 dark:text-green-100">
          Referencia baseada no indice FipeZAP (Zap, Viva Real, OLX) para Natal.
          {insight.dataTier === 'fipezap_neighborhood' && ' O bairro ajusta a media da cidade.'}
        </p>
      )}

      {hasComparison && insight.dataTier === 'potilar_listings' && (
        <p className="mt-3 rounded-xl border border-ocean-200 bg-ocean-50 px-3 py-2.5 text-xs leading-5 text-ocean-950 dark:border-ocean-900 dark:bg-ocean-950/30 dark:text-ocean-100">
          Comparacao com {insight.sampleCount} anuncio{insight.sampleCount === 1 ? '' : 's'} reais publicados na
          Potilar. Amostra pequena - use tambem portais externos.
        </p>
      )}

      <details className="mt-4 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-xs leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
        <summary className="cursor-pointer font-extrabold text-slate-950 dark:text-white">Como calculamos?</summary>
        <p className="mt-2">
          So mostramos comparacao quando ha base defensavel: anuncios reais na Potilar (minimo 3), indice FipeZAP em
          Natal, ou estimativa Potilar calibrada para cidades do interior. Cidades sem dados nao recebem numero
          automatico.
        </p>
        {insight.referencePeriod && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Periodo de referencia: {insight.referencePeriod}</p>
        )}
      </details>

      {insight.tip && !compact && (
        <p className="mt-3 rounded-xl bg-ocean-50 px-3 py-2.5 text-xs leading-5 text-ocean-900 dark:bg-ocean-950/30 dark:text-ocean-100">
          {insight.tip}
        </p>
      )}

      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        Orientacao informativa. Nao substitui avaliacao oficial nem visita ao imovel.
      </p>
    </section>
  );
}

function Stat({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-1.5 font-extrabold text-slate-950 dark:text-white ${featured ? 'text-xl' : 'text-base'}`}>
        {value}
      </p>
    </div>
  );
}
