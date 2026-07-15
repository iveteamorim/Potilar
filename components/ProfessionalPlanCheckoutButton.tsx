'use client';

import { useState } from 'react';
import { ArrowRight, CalendarClock, Repeat } from 'lucide-react';
import type { ProfessionalPlanId } from '@/lib/plans';

type BillingMode = 'automatic' | 'manual';

type Props = {
  planId: ProfessionalPlanId;
  children: string;
  fallbackHref: string;
};

export default function ProfessionalPlanCheckoutButton({ planId, children, fallbackHref }: Props) {
  const [loading, setLoading] = useState<BillingMode | null>(null);
  const [message, setMessage] = useState('');

  async function handleClick(billingMode: BillingMode) {
    setLoading(billingMode);
    setMessage('');

    try {
      const response = await fetch('/api/professional-plans/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingMode })
      });
      const payload = await response.json();

      if (response.status === 401) {
        const accountType = planId === 'corretor' ? 'corretor' : 'imobiliaria';
        const next = `/planos?plan=${encodeURIComponent(planId)}&billing=${billingMode}#planos`;
        window.location.href = `/login?mode=signup&account=${accountType}&plan=${encodeURIComponent(planId)}&billing=${billingMode}&next=${encodeURIComponent(next)}`;
        return;
      }

      if (!response.ok || !payload.initPoint) {
        setMessage(payload.error ?? 'Não foi possível iniciar a assinatura agora.');
        return;
      }

      window.location.href = payload.initPoint;
    } catch {
      setMessage('Não foi possível iniciar a assinatura agora.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => handleClick('automatic')}
        disabled={Boolean(loading)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Repeat className="h-4 w-4" />
        {loading === 'automatic' ? 'Abrindo assinatura...' : children}
        <ArrowRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleClick('manual')}
        disabled={Boolean(loading)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-ocean-200 bg-white px-5 py-3 text-sm font-semibold text-ocean-800 transition hover:-translate-y-0.5 hover:border-ocean-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-ocean-100"
      >
        <CalendarClock className="h-4 w-4" />
        {loading === 'manual' ? 'Abrindo pagamento...' : 'Pagar 30 dias manual'}
      </button>
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        Automático renova todo mês. Manual libera Pix, boleto e cartão, mas precisa renovar depois.
      </p>
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
