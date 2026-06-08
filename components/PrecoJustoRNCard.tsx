'use client';

import { Sparkles, TrendingDown, TrendingUp, Scale } from 'lucide-react';
import type { PriceInsight } from '@/lib/priceIntelligence';
import { getVerdictStyles } from '@/lib/priceIntelligence';

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
    return <TrendingUp className="h-5 w-5" aria-hidden="true" />;
  }
  if (verdict === 'below' || verdict === 'much_below') {
    return <TrendingDown className="h-5 w-5" aria-hidden="true" />;
  }
  if (verdict === 'fair') {
    return <Scale className="h-5 w-5" aria-hidden="true" />;
  }
  return <Sparkles className="h-5 w-5" aria-hidden="true" />;
}

export default function PrecoJustoRNCard({ insight, compact = false }: Props) {
  const styles = getVerdictStyles(insight.verdict);
  const hasData = insight.verdict !== 'insufficient_data' && insight.medianPrice > 0;
  const diffLabel =
    insight.percentVsMedian === 0
      ? 'Dentro da referencia regional'
      : `${insight.percentVsMedian > 0 ? '+' : ''}${insight.percentVsMedian}% ${
          insight.percentVsMedian > 0 ? 'acima' : 'abaixo'
        } da referencia regional`;
  const diffColor =
    insight.verdict === 'much_above' || insight.verdict === 'above'
      ? 'text-amber-700 dark:text-amber-200'
      : insight.verdict === 'much_below'
        ? 'text-sky-700 dark:text-sky-200'
        : 'text-green-700 dark:text-green-200';
  const confidence = insight.isApproximate ? 'Media' : 'Alta';

  return (
    <section
      className={`rounded-3xl border bg-white p-5 shadow-soft dark:bg-slate-900 sm:p-7 ${styles.border}`}
      aria-label="Analise Preco Justo RN"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Potilar IA</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${styles.badge}`}>
          <VerdictIcon verdict={insight.verdict} />
          {insight.title}
        </span>
      </div>

      <h3 className="mt-6 text-3xl font-semibold text-slate-950 dark:text-white">Preco Justo RN</h3>

      {hasData ? (
        <p className="mt-5 text-xl leading-8 text-slate-700 dark:text-slate-300">
          Seu imovel esta na faixa estimada para <strong className="text-slate-950 dark:text-white">{insight.scopeLabel}</strong>.
        </p>
      ) : (
        <p className="mt-5 text-base leading-7 text-slate-700 dark:text-slate-300">{insight.summary}</p>
      )}

      {hasData && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Stat label="Seu preco" value={formatMoney(insight.listingPrice)} featured />
          <Stat label="Referencia de mercado" value={formatMoney(insight.medianPrice)} featured />
        </div>
      )}

      {hasData && (
        <p className={`mt-5 text-sm font-extrabold ${diffColor}`}>
          {diffLabel}
        </p>
      )}

      {hasData && (
        <div className={`mt-6 grid gap-4 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-4'}`}>
          <Stat label="Faixa estimada" value={`${formatMoney(insight.minPrice)} - ${formatMoney(insight.maxPrice)}`} />
          <Stat label="Base utilizada" value={`${formatMoney(insight.pricePerSqm)}/m2 · ${insight.estimatedAreaSqm} m2`} />
          <Stat label="Confianca" value={confidence} />
          <Stat label="Fonte" value={insight.source ? `${insight.source}` : 'Referencias regionais'} />
        </div>
      )}

      {hasData && insight.isApproximate && (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Estimativa aproximada para esta cidade. A referencia e orientativa; confirme com anuncios locais antes de decidir o preco.
        </p>
      )}

      {hasData && (
        <details className="mt-6 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
          <summary className="cursor-pointer font-extrabold text-slate-950 dark:text-white">Como calculamos?</summary>
          <p className="mt-3">
            O Preco Justo RN usa a metragem informada e referencias regionais de mercado para estimar uma faixa de preco.
            O valor final pode variar conforme as caracteristicas e os diferenciais do imovel.
          </p>
          {insight.source && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Fonte: {insight.source} ({insight.referencePeriod})
            </p>
          )}
        </details>
      )}

      {insight.tip && !compact && (
        <p className="mt-4 rounded-2xl bg-ocean-50 px-4 py-3 text-sm text-ocean-900 dark:bg-ocean-950/30 dark:text-ocean-100">
          {insight.tip}
        </p>
      )}

      {hasData && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Estimativa orientativa. Nao substitui avaliacao oficial.
        </p>
      )}
    </section>
  );
}

function Stat({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 font-extrabold text-slate-950 dark:text-white ${featured ? 'text-2xl' : 'text-lg'}`}>{value}</p>
    </div>
  );
}
