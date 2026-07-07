import type { Metadata } from 'next';
import AnunciarForm from '@/components/AnunciarForm';
import Link from 'next/link';
import { resolveCityPrefill } from '@/lib/cityPages';
import { getFreeListingLimit, getLaunchPromoDeadlineLabel, isLaunchPromoActive } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';

export function generateMetadata(): Metadata {
  const promoActive = isLaunchPromoActive();
  const freeLimit = getFreeListingLimit();
  const promoDeadline = getLaunchPromoDeadlineLabel();
  const title = 'Anunciar imóvel grátis no Rio Grande do Norte';
  const description = promoActive
    ? `Anuncie imóvel grátis no Rio Grande do Norte (RN). Até ${freeLimit} anúncios grátis por 60 dias na Potilar, promoção até ${promoDeadline}. Casas, apartamentos, terrenos e temporada com contato direto.`
    : 'Anuncie imóvel grátis no Rio Grande do Norte (RN). Primeiro anúncio gratuito por 60 dias na Potilar. Casas, apartamentos, terrenos e temporada com contato direto.';

  return {
    title,
    description,
    keywords: [
      'anunciar imóvel grátis',
      'anunciar imóveis grátis',
      'anunciar imóvel grátis RN',
      'anunciar casa Rio Grande do Norte',
      'portal imóveis RN',
      'Potilar'
    ],
    alternates: {
      canonical: '/anunciar'
    },
    openGraph: {
      title: `${title} | Potilar`,
      description,
      url: '/anunciar',
      type: 'website',
      locale: 'pt_BR'
    }
  };
}

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

  const promoActive = isLaunchPromoActive();
  const freeLimit = getFreeListingLimit();
  const promoDeadline = getLaunchPromoDeadlineLabel();
  const cityLine = defaultCity
    ? `Publique seu imóvel em ${defaultCity}, Rio Grande do Norte, com fotos, preço e contato direto.`
    : 'Publique casas, apartamentos, terrenos e imóveis de temporada em qualquer cidade do Rio Grande do Norte.';

  return (
    <main className="section-padding">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Anunciar no RN</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              {promoActive
                ? `Anuncie seu imóvel grátis`
                : 'Anunciar imóvel grátis no Rio Grande do Norte'}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {promoActive
                ? `Publique seus ${freeLimit} primeiros anúncios grátis na Potilar. Cada anúncio fica ativo por 60 dias.`
                : `Publique seu primeiro anúncio gratuito por 60 dias. ${cityLine}`}
            </p>
          </div>
        </div>
        {isAuthenticated ? (
          <div className="mx-auto w-full max-w-3xl">
            <AnunciarForm
              referralCode={referralCode}
              defaultName={defaultName}
              defaultPhone={defaultPhone}
              defaultEmail={defaultEmail}
              defaultDocument={defaultDocument}
              accountType={accountType}
              defaultCity={defaultCity}
            />
          </div>
        ) : (
          <div className="glass-card mx-auto w-full max-w-3xl space-y-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Crie sua conta para anunciar</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Para publicar e gerenciar seus anúncios, entre ou crie uma conta gratuita. Depois, clique em Anunciar imóvel dentro de Minha conta.
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

