'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BellPlus, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SEARCH_ALERTS_ENABLED } from '@/lib/config';
import { buildAlertLabel, searchParamsToFilters } from '@/lib/searchAlerts';

export default function SaveSearchAlert() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const filters = searchParamsToFilters(searchParams);
  const hasFilters = Object.keys(filters).length > 0;
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const returnPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(Boolean(user));
    });
  }, []);

  if (!SEARCH_ALERTS_ENABLED || !hasFilters) return null;

  async function saveAlert() {
    if (!isAuthenticated) {
      setStatus('Entre com seu email para salvar esta busca.');
      return;
    }

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
          setStatus('Entre na sua conta para salvar buscas.');
          return;
        }
        if (String(payload.error ?? '').includes('listing_search_alerts')) {
          throw new Error('Funcionalidade em configuracao. Tente novamente em breve.');
        }
        throw new Error(payload.error ?? 'Erro ao salvar busca');
      }

      setStatus('Alerta criado. Você pode ver suas buscas salvas em Minha conta.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erro ao salvar busca');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ocean-200 bg-white px-4 py-4 text-sm shadow-soft dark:border-ocean-900 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-700 dark:bg-ocean-950/50 dark:text-ocean-200">
            <BellPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="font-semibold text-slate-950 dark:text-white">Criar alerta para esta busca</p>
        </div>
        <div className="shrink-0">
          {isAuthenticated === false ? (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-xs font-semibold text-white"
            >
              <BellPlus className="h-4 w-4" aria-hidden="true" />
              Criar alerta
            </Link>
          ) : (
            <button
              type="button"
              onClick={saveAlert}
              disabled={loading || isAuthenticated === null}
              className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {status.startsWith('Alerta') ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <BellPlus className="h-4 w-4" aria-hidden="true" />}
              {loading ? 'Salvando...' : 'Salvar busca'}
            </button>
          )}
        </div>
      </div>
      {status && <p className="mt-3 text-xs font-semibold text-ocean-800 dark:text-ocean-200">{status}</p>}
    </div>
  );
}
