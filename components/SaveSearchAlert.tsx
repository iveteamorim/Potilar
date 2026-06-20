'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BellPlus } from 'lucide-react';
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
      setStatus('Crie uma conta ou entre para salvar esta busca.');
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

      setStatus('Busca salva em Minha conta > Alertas. Abra quando quiser ver novidades.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erro ao salvar busca');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ocean-200 bg-ocean-50 px-4 py-3 text-sm text-ocean-900 dark:border-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Salvar busca <span className="font-semibold">{buildAlertLabel(filters)}</span> na sua conta para
          acompanhar depois em Alertas.
          <span className="mt-1 block text-xs text-ocean-800/80 dark:text-ocean-200/80">
            Ainda nao enviamos e-mail nem notificacao automatica — voce abre os resultados quando quiser.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {isAuthenticated === false ? (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-xs font-semibold text-white"
            >
              <BellPlus className="h-4 w-4" aria-hidden="true" />
              Entrar para salvar
            </Link>
          ) : (
            <button
              type="button"
              onClick={saveAlert}
              disabled={loading || isAuthenticated === null}
              className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <BellPlus className="h-4 w-4" aria-hidden="true" />
              {loading ? 'Salvando...' : 'Salvar busca'}
            </button>
          )}
          {isAuthenticated === false && (
            <Link href={loginHref} className="rounded-xl border border-ocean-300 px-4 py-2 text-xs font-semibold">
              Criar conta
            </Link>
          )}
        </div>
      </div>
      {status && <p className="mt-2 text-xs font-semibold">{status}</p>}
    </div>
  );
}
