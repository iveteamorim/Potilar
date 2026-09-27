import type { PublicPriceSignal } from '@/lib/publicPriceSignal';

const STATUS_STYLES: Record<
  PublicPriceSignal['rangeStatus'],
  { border: string; badge: string }
> = {
  inside: {
    border: 'border-green-200 dark:border-green-900',
    badge: 'bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-100'
  },
  below: {
    border: 'border-amber-200 dark:border-amber-900',
    badge: 'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
  },
  above: {
    border: 'border-red-200 dark:border-red-900',
    badge: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-100'
  }
};

export default function PublicPrecoJustoSignal({ signal }: { signal: PublicPriceSignal }) {
  const styles = STATUS_STYLES[signal.rangeStatus];
  const sourceLine = [signal.source, signal.referencePeriod].filter(Boolean).join(' · ');

  return (
    <section
      className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5 ${styles.border}`}
      aria-label="Contexto de mercado Preço Justo RN"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ocean-600">Preço Justo RN</p>
      <p
        className={`mt-3 inline-flex w-fit rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${styles.badge}`}
      >
        {signal.title}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{signal.explanation}</p>
      {sourceLine ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sourceLine}</p>
      ) : null}
    </section>
  );
}
