import Link from 'next/link';
import { redirect } from 'next/navigation';
import AlertsManager from '@/components/AlertsManager';
import { createClient } from '@/lib/supabase/server';
import { SEARCH_ALERTS_ENABLED } from '@/lib/config';

export default async function AlertasPage() {
  if (!SEARCH_ALERTS_ENABLED) {
    redirect('/mi-cuenta');
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta/alertas');

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/mi-cuenta" className="text-sm font-semibold text-ocean-700">
            Voltar para Minha conta
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Meus alertas</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Buscas salvas na sua conta para acompanhar novidades por cidade, tipo de imóvel e faixa de preço.
          </p>
        </div>
        <AlertsManager />
      </div>
    </main>
  );
}
