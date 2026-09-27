import { AlertCircle, BarChart3, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import type { PublicPriceSignal } from '@/lib/publicPriceSignal';

const STATUS_STYLES: Record<
  PublicPriceSignal['rangeStatus'],
  { bar: string; accent: string }
> = {
  inside: {
    bar: 'border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30',
    accent: 'text-emerald-700 dark:text-emerald-200'
  },
  below: {
    bar: 'border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
    accent: 'text-amber-800 dark:text-amber-100'
  },
  above: {
    bar: 'border-rose-100 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30',
    accent: 'text-rose-800 dark:text-rose-100'
  }
};

function StatusIcon({ rangeStatus }: { rangeStatus: PublicPriceSignal['rangeStatus'] }) {
  if (rangeStatus === 'below') {
    return <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }
  if (rangeStatus === 'above') {
    return <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }
  return <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

export default function PublicPrecoJustoSignal({ signal }: { signal: PublicPriceSignal }) {
  const styles = STATUS_STYLES[signal.rangeStatus];
  const sourceLine = [signal.source, signal.referencePeriod].filter(Boolean).join(' · ');

  return (
    <section
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-full border px-4 py-2.5 ${styles.bar}`}
      aria-label="Contexto de mercado Preço Justo RN"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 ${styles.accent}`}
      >
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${styles.accent}`}>Preço Justo RN</p>
      <p className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${styles.accent}`}>
        <StatusIcon rangeStatus={signal.rangeStatus} />
        {signal.title}
      </p>
      {sourceLine ? <p className="text-xs text-slate-500 dark:text-slate-400">{sourceLine}</p> : null}
      <span
        className="ml-auto inline-flex text-slate-400 dark:text-slate-500"
        title={signal.explanation}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{signal.explanation}</span>
      </span>
    </section>
  );
}
