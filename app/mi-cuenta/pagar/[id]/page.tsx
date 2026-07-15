import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import ListingMercadoPagoButton from '@/components/ListingMercadoPagoButton';
import { createClient } from '@/lib/supabase/server';
import { PLANS, getHighlightLabel } from '@/lib/plans';
import type { PixPaymentKind } from '@/lib/pix';

type Props = {
  params: { id: string };
  searchParams?: { tipo?: string };
};

function resolvePayment(
  listing: {
    payment_status: string;
    payment_amount: number | null;
    featured_payment_status: string;
    featured_payment_amount: number | null;
    payment_proof_sent_at?: string | null;
    featured_payment_proof_sent_at?: string | null;
    featured_plan: string | null;
    transaction: string;
  },
  tipo?: string
): { kind: PixPaymentKind; checkoutKind: 'listing' | 'seasonal' | 'highlight' | 'renewal30' | 'renewal60'; amount: number; headline: string } | null {
  if (tipo === 'renewal30') {
    return {
      kind: 'renewal',
      checkoutKind: 'renewal30',
      amount: PLANS.listing.seasonalRenewal30Price,
      headline: `Renovação de temporada - ${PLANS.listing.seasonalRenewal30DurationDays} dias`
    };
  }

  if (tipo === 'renewal' || tipo === 'renewal60') {
    return {
      kind: 'renewal',
      checkoutKind: 'renewal60',
      amount: PLANS.listing.seasonalRenewal60Price,
      headline: `Renovação de temporada - ${PLANS.listing.seasonalRenewal60DurationDays} dias`
    };
  }

  if (tipo === 'highlight' || listing.featured_payment_status === 'pix_pending') {
    if (listing.featured_payment_status !== 'pix_pending' || !listing.featured_plan) return null;
    return {
      kind: 'highlight',
      checkoutKind: 'highlight',
      amount: Number(listing.featured_payment_amount ?? 0),
      headline: getHighlightLabel(listing.featured_plan as '7_days' | '15_days' | '30_days')
    };
  }

  if (listing.payment_status === 'pix_pending') {
    return {
      kind: listing.transaction === 'Temporada' ? 'seasonal' : 'listing',
      checkoutKind: listing.transaction === 'Temporada' ? 'seasonal' : 'listing',
      amount: Number(listing.payment_amount ?? 0),
      headline: listing.transaction === 'Temporada' ? 'Anúncio de temporada' : 'Publicação do anúncio'
    };
  }

  return null;
}

export default async function PagarPixPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/mi-cuenta/pagar/${params.id}`);

  const { data: listing } = await supabase
    .from('listings')
    .select(
      'id,title,transaction,payment_status,payment_amount,payment_proof_sent_at,featured_payment_status,featured_payment_amount,featured_payment_proof_sent_at,featured_plan,owner_id'
    )
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!listing) notFound();

  const payment = resolvePayment(listing, searchParams?.tipo);
  if (!payment || payment.amount <= 0) {
    redirect('/mi-cuenta');
  }

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/mi-cuenta" className="text-sm font-semibold text-ocean-700">
            Voltar para Minha conta
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Pagamento do anúncio</h1>
        </div>

        <section className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Potilar - Mercado Pago</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{payment.headline}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{listing.title}</p>
            </div>
            <div className="rounded-2xl bg-ocean-50 px-5 py-4 text-right dark:bg-ocean-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ocean-700 dark:text-ocean-200">Total</p>
              <p className="mt-1 text-3xl font-semibold text-ocean-900 dark:text-ocean-100">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-sand-200 bg-sand-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-ocean-700" aria-hidden="true" />
            </div>
            <ListingMercadoPagoButton listingId={listing.id} kind={payment.checkoutKind} label="Pagar agora" />
          </div>
        </section>
      </div>
    </main>
  );
}
