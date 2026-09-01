'use client';

import { useState } from 'react';
import { ArrowRight, Repeat } from 'lucide-react';
import type { ProfessionalPlanId } from '@/lib/plans';

type Props = {
  planId: ProfessionalPlanId;
  children: string;
  fallbackHref: string;
  className?: string;
  showRepeatIcon?: boolean;
};

export default function ProfessionalPlanCheckoutButton({
  planId,
  children,
  fallbackHref,
  className,
  showRepeatIcon = true
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleClick() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/professional-plans/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const payload = await response.json();

      if (response.status === 401) {
        const accountType = planId === 'corretor' ? 'corretor' : 'imobiliaria';
        const next = `/planos?plan=${encodeURIComponent(planId)}#planos`;
        window.location.href = `/login?mode=signup&account=${accountType}&plan=${encodeURIComponent(planId)}&next=${encodeURIComponent(next)}`;
        return;
      }

      if (!response.ok || !payload.initPoint) {
        setMessage(payload.error ?? 'Nao foi possivel iniciar a ativacao agora.');
        return;
      }

      window.location.href = payload.initPoint;
    } catch {
      setMessage('Nao foi possivel iniciar a ativacao agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          'inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        {showRepeatIcon ? <Repeat className="h-4 w-4" /> : null}
        {loading ? 'Abrindo ativacao...' : children}
        <ArrowRight className="h-4 w-4" />
      </button>
      {message && (
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {message}{' '}
          <a href={fallbackHref} target="_blank" rel="noreferrer" className="text-ocean-700 underline">
            Falar com a Potilar
          </a>
        </p>
      )}
    </div>
  );
}
