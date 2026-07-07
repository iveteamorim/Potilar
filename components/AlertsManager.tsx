'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildImoveisHref, type SavedSearchFilters } from '@/lib/searchAlerts';

type AlertRow = {
  id: string;
  label: string;
  filters: SavedSearchFilters;
  is_active: boolean;
  last_seen_at: string;
};

export default function AlertsManager() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    setLoading(true);
    const response = await fetch('/api/alerts');
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Erro ao carregar alertas');
      return;
    }

    setAlerts(payload.alerts ?? []);
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function toggleAlert(id: string, isActive: boolean) {
    const response = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !isActive })
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.error ?? 'Erro ao atualizar alerta');
      return;
    }

    await loadAlerts();
  }

  async function removeAlert(id: string) {
    const response = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.error ?? 'Erro ao remover alerta');
      return;
    }

    await loadAlerts();
  }

  if (loading) {
    return <div className="glass-card h-32 animate-pulse" />;
  }

  if (alerts.length === 0) {
    return (
      <div className="glass-card p-6 text-sm text-slate-600 dark:text-slate-300">
        Nenhuma busca salva ainda. Faca uma busca em{' '}
        <Link href="/imoveis" className="font-semibold text-ocean-700">
          Imoveis
        </Link>{' '}
        e clique em Criar alerta para acompanhar novos anuncios com esses filtros.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status && <p className="text-sm font-semibold text-red-600">{status}</p>}
      {alerts.map((alert) => (
        <article key={alert.id} className="glass-card space-y-3 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{alert.label}</h2>
              <p className="text-xs text-slate-500">
                {alert.is_active ? 'Ativo' : 'Pausado'} · atualizado em{' '}
                {new Date(alert.last_seen_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildImoveisHref(alert.filters)}
                className="rounded-xl border border-ocean-200 px-4 py-2 text-xs font-semibold text-ocean-700"
              >
                Ver resultados
              </Link>
              <button
                type="button"
                onClick={() => toggleAlert(alert.id, alert.is_active)}
                className="rounded-xl border border-sand-200 px-4 py-2 text-xs font-semibold"
              >
                {alert.is_active ? 'Pausar' : 'Ativar'}
              </button>
              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
                className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600"
              >
                Remover
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
