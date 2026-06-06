import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import PixPaymentPanel from '@/components/PixPaymentPanel';
import { createClient } from '@/lib/supabase/server';
import { PLANS, getHighlightLabel } from '@/lib/plans';
import type { PixPaymentKind } from '@/lib/pix';
import { markPixProofSent } from '../../actions';

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
): { kind: PixPaymentKind; amount: number; headline: string } | null {
  if (tipo === 'renewal') {
    return {
      kind: 'renewal',
      amount: PLANS.listing.seasonalRenewalPrice,
      headline: 'Renovacao de temporada'
    };
  }

  if (tipo === 'highlight' || listing.featured_payment_status === 'pix_pending') {
    if (listing.featured_payment_status !== 'pix_pending' || !listing.featured_plan) return null;
    return {
      kind: 'highlight',
      amount: Number(listing.featured_payment_amount ?? 0),
      headline: getHighlightLabel(listing.featured_plan as '7_days' | '30_days' | 'super_30_days')
    };
  }

  if (listing.payment_status === 'pix_pending') {
    return {
      kind: listing.transaction === 'Temporada' ? 'seasonal' : 'listing',
      amount: Number(listing.payment_amount ?? 0),
      headline: listing.transaction === 'Temporada' ? 'Anuncio de temporada' : 'Publicacao do anuncio'
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

  const proofSentAt =
    payment.kind === 'highlight' ? listing.featured_payment_proof_sent_at : listing.payment_proof_sent_at;

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/mi-cuenta" className="text-sm font-semibold text-ocean-700">
            Voltar para Minha conta
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Pagamento Pix</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Pague com QR Code ou copia e cola. Depois envie o comprovante para liberarmos seu anuncio.
          </p>
        </div>

        {proofSentAt ? (
          <div className="rounded-3xl border border-sun-200 bg-sun-50 p-6 text-slate-800 shadow-sm dark:border-sun-900 dark:bg-sun-950/20 dark:text-slate-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-600" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold">Comprovante enviado</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Recebemos sua confirmacao. Agora a Potilar vai revisar o Pix e liberar o anuncio ou destaque.
                </p>
                <Link href="/mi-cuenta" className="mt-5 inline-flex rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
                  Voltar para meus anuncios
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <PixPaymentPanel
              listingId={listing.id}
              amount={payment.amount}
              title={listing.title}
              kind={payment.kind}
              headline={payment.headline}
            />
            <form action={markPixProofSent} className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm dark:border-green-900 dark:from-green-950/30 dark:to-slate-950">
              <input type="hidden" name="id" value={listing.id} />
              <input type="hidden" name="kind" value={payment.kind === 'highlight' ? 'highlight' : 'listing'} />
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Ja paguei e enviei o comprovante
              </button>
              <p className="mt-2 text-center text-xs font-semibold text-green-800 dark:text-green-100">
                Clique aqui depois de enviar o comprovante pelo WhatsApp.
              </p>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
