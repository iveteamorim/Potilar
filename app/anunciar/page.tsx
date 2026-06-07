import type { Metadata } from 'next';
import AnunciarForm from '@/components/AnunciarForm';
import Link from 'next/link';
import { resolveCityPrefill } from '@/lib/cityPages';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Anunciar imovel gratis',
  description: 'Anuncie seu primeiro imovel gratis na Potilar. Publique casas, apartamentos, terrenos e temporada no RN.',
  alternates: {
    canonical: '/anunciar'
  }
};

const VALID_REFERRALS = new Set(['arthur', 'isis']);

function normalizeReferral(ref?: string) {
  const value = ref?.trim().toLowerCase();
  return value && VALID_REFERRALS.has(value) ? value : '';
}

export default async function AnunciarPage({
  searchParams
}: {
  searchParams?: { ref?: string; cidade?: string };
}) {
  let isAuthenticated = false;
  let defaultName = '';
  let defaultPhone = '';
  let defaultEmail = '';
  let defaultDocument = '';
  let accountType = 'particular';
  const referralCode = normalizeReferral(searchParams?.ref);
  const defaultCity = resolveCityPrefill(searchParams?.cidade);

  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);

    if (user) {
      defaultEmail = user.email ?? '';
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name,phone,account_type,advertiser_document')
        .eq('id', user.id)
        .single();

      defaultName = profile?.full_name ?? '';
      defaultPhone = profile?.phone ?? '';
      defaultDocument = profile?.advertiser_document ?? '';
      accountType = profile?.account_type ?? 'particular';
    }
  } catch {
    isAuthenticated = false;
  }

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Anunciar</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Anuncie gratis seu imovel na Potilar.
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Complete os dados do imovel, adicione fotos e envie para avaliacao da Potilar.
            </p>
          </div>
        </div>
        {isAuthenticated ? (
          <AnunciarForm
            referralCode={referralCode}
            defaultName={defaultName}
            defaultPhone={defaultPhone}
            defaultEmail={defaultEmail}
            defaultDocument={defaultDocument}
            accountType={accountType}
            defaultCity={defaultCity}
          />
        ) : (
          <div className="glass-card space-y-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Crie sua conta para anunciar</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Para publicar e gerenciar seus anuncios, entre ou crie uma conta gratuita. Depois, clique em Anunciar imovel dentro de Minha conta.
            </p>
            <Link href={`/login?next=${encodeURIComponent('/mi-cuenta')}`} className="inline-flex w-full justify-center rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
              Entrar ou criar conta
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
