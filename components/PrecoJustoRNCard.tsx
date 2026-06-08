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

  return (
    <section
      className={`rounded-3xl border bg-white p-5 shadow-soft dark:bg-slate-900 ${styles.border}`}
      aria-label="Analise Preco Justo RN"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Potilar IA</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Preco Justo RN</h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
          <VerdictIcon verdict={insight.verdict} />
          {insight.title}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">{insight.summary}</p>

      {hasData && (
        <p className="mt-3 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-xs leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
          O Preco Justo RN usa a metragem informada e referencias regionais de mercado para estimar uma faixa de preco.
          O valor final pode variar conforme as caracteristicas e os diferenciais do imovel.
        </p>
      )}

      {hasData && (
        <div className={`mt-4 grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-4'}`}>
          <Stat label="Seu preco" value={formatMoney(insight.listingPrice)} />
          <Stat label="Referencia mercado" value={formatMoney(insight.medianPrice)} />
          <Stat label="Faixa online" value={`${formatMoney(insight.minPrice)} - ${formatMoney(insight.maxPrice)}`} />
          <Stat label="Base R$/m2" value={`${formatMoney(insight.pricePerSqm)} / ${insight.estimatedAreaSqm} m2`} />
        </div>
      )}

      {hasData && (
        <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {insight.percentVsMedian > 0 ? '+' : ''}
          {insight.percentVsMedian}% vs referencia em {insight.scopeLabel}
        </p>
      )}

      {hasData && insight.isApproximate && (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Estimativa aproximada para esta cidade. A referencia e orientativa; confirme com anuncios locais antes de decidir o preco.
        </p>
      )}

      {hasData && insight.source && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Fonte: {insight.source} ({insight.referencePeriod})
        </p>
      )}

      {insight.tip && !compact && (
        <p className="mt-4 rounded-2xl bg-ocean-50 px-4 py-3 text-sm text-ocean-900 dark:bg-ocean-950/30 dark:text-ocean-100">
          {insight.tip}
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
