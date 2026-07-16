import type { BrokerGamification } from '@/lib/brokerGamification';

const LEVEL_ACCENT = {
  bronze: 'bg-amber-500',
  prata: 'bg-slate-400',
  ouro: 'bg-yellow-500',
  rn_elite: 'bg-violet-500'
} as const;

const LEVEL_TEXT = {
  bronze: 'text-amber-800 dark:text-amber-200',
  prata: 'text-slate-700 dark:text-slate-200',
  ouro: 'text-yellow-800 dark:text-yellow-200',
  rn_elite: 'text-violet-800 dark:text-violet-200'
} as const;

export default function BrokerPotilarScoreCard({ gamification }: { gamification: BrokerGamification }) {
  const accent = LEVEL_ACCENT[gamification.level];
  const levelText = LEVEL_TEXT[gamification.level];

  return (
    <section className="w-full rounded-lg border border-sand-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Confiança do perfil público</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span className={`font-medium ${levelText}`}>Nível {gamification.levelLabel}</span>
            {' · '}
            perfil, CRECI e anúncios completos passam mais confiança aos visitantes
          </p>
        </div>
        <p className="shrink-0 text-right leading-none">
          <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{gamification.score}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400"> / 100</span>
        </p>
      </div>

      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={gamification.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confiança do perfil: ${gamification.score} de 100 pontos, nível ${gamification.levelLabel}`}
      >
        <div className={`h-full rounded-full ${accent} transition-all`} style={{ width: `${gamification.score}%` }} />
      </div>

      <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">Próximo passo:</span> {gamification.nextTip}
      </p>
    </section>
  );
}
