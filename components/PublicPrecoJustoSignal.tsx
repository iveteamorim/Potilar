import type { PublicPriceSignal } from '@/lib/publicPriceSignal';

function ChartBadge() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#D4F3E4" />
      <rect x="8.5" y="16" width="4" height="7.5" rx="1.2" fill="#0E8A62" />
      <rect x="14" y="12" width="4" height="11.5" rx="1.2" fill="#0E8A62" />
      <rect x="19.5" y="8.5" width="4" height="15" rx="1.2" fill="#0E8A62" />
    </svg>
  );
}

function StatusMark({ rangeStatus }: { rangeStatus: PublicPriceSignal['rangeStatus'] }) {
  if (rangeStatus === 'below') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#D97706" />
        <path d="M6.5 10h7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (rangeStatus === 'above') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#E11D48" />
        <path d="M10 14V7M10 7l-3 3M10 7l3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#22C55E" />
      <path
        d="M6.1 10.2 8.6 12.7 13.9 7.3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoMark() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="7.4" fill="none" stroke="#9AA3AD" strokeWidth="1.6" />
      <circle cx="10" cy="6.9" r="1" fill="#9AA3AD" />
      <path d="M10 9.3v4.4" stroke="#9AA3AD" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_STYLES: Record<PublicPriceSignal['rangeStatus'], { bar: string; accent: string }> = {
  inside: {
    bar: 'border-[#C6ECD8] bg-[#F2FBF6]',
    accent: 'text-[#0E8A62]'
  },
  below: {
    bar: 'border-amber-200 bg-amber-50',
    accent: 'text-amber-800'
  },
  above: {
    bar: 'border-rose-200 bg-rose-50',
    accent: 'text-rose-800'
  }
};

export default function PublicPrecoJustoSignal({ signal }: { signal: PublicPriceSignal }) {
  const styles = STATUS_STYLES[signal.rangeStatus];
  const sourceLine = [signal.source, signal.referencePeriod].filter(Boolean).join(' · ');

  return (
    <section
      className={`inline-flex max-w-full items-center gap-4 overflow-x-auto whitespace-nowrap rounded-full border px-4 py-2 ${styles.bar}`}
      aria-label="Contexto de mercado Preço Justo RN"
    >
      <ChartBadge />
      <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${styles.accent}`}>Preço Justo RN</p>
      <p className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${styles.accent}`}>
        <StatusMark rangeStatus={signal.rangeStatus} />
        {signal.title}
      </p>
      {sourceLine ? <p className="text-[13px] text-[#8B95A2]">{sourceLine}</p> : null}
      <span className="inline-flex" title={signal.explanation}>
        <InfoMark />
        <span className="sr-only">{signal.explanation}</span>
      </span>
    </section>
  );
}
