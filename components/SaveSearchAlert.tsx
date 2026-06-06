'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BellPlus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { buildAlertLabel, searchParamsToFilters } from '@/lib/searchAlerts';

export default function SaveSearchAlert() {
  const searchParams = useSearchParams();
  const filters = searchParamsToFilters(searchParams);
  const hasFilters = Object.keys(filters).length > 0;
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  if (!hasFilters) return null;

  async function saveAlert() {
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          label: buildAlertLabel(filters)
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setStatus('Entre na sua conta para salvar alertas.');
          return;
        }
        throw new Error(payload.error ?? 'Erro ao salvar alerta');
      }

      setStatus('Alerta salvo. Veja em Minha conta > Alertas.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erro ao salvar alerta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ocean-200 bg-ocean-50 px-4 py-3 text-sm text-ocean-900 dark:border-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Quer ser avisado quando surgir algo como <span className="font-semibold">{buildAlertLabel(filters)}</span>?
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveAlert}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            <BellPlus className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Salvando...' : 'Salvar alerta'}
          </button>
          <Link href="/login" className="rounded-xl border border-ocean-300 px-4 py-2 text-xs font-semibold">
            Entrar
          </Link>
        </div>
      </div>
      {status && <p className="mt-2 text-xs font-semibold">{status}</p>}
    </div>
  );
}
