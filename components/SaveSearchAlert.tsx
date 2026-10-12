'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bell, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SEARCH_ALERTS_ENABLED } from '@/lib/config';
import { buildAlertLabel, searchParamsToFilters } from '@/lib/searchAlerts';

export default function SaveSearchAlert() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const filters = searchParamsToFilters(searchParams);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const returnPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const loginHref = `/login?mode=signup&intent=alert&next=${encodeURIComponent(returnPath)}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(Boolean(user));
    });
  }, []);

  if (!SEARCH_ALERTS_ENABLED) return null;

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
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-center text-sm shadow-sm dark:border-emerald-900 dark:bg-emerald-950/25">
      <div className="flex items-start gap-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold leading-tight text-slate-950 dark:text-white">Novos imóveis na sua busca</p>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">
            Receba um aviso quando aparecer um imóvel que combine com o que você procura.
          </p>
        </div>
      </div>
      {isAuthenticated === false ? (
        <Link
          href={loginHref}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          Salvar busca
        </Link>
      ) : (
        <button
          type="button"
          onClick={saveAlert}
          disabled={loading || isAuthenticated === null}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {status.startsWith('Alerta') ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Bell className="h-4 w-4" aria-hidden="true" />}
          {loading ? 'Salvando...' : 'Salvar busca'}
        </button>
      )}
      <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Grátis. Você pode cancelar quando quiser.</p>
      {status && <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">{status}</p>}
    </div>
  );
}
