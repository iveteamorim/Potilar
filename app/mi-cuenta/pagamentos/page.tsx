import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreditCard, ExternalLink, Sparkles } from 'lucide-react';
import AccountNotice from '@/components/AccountNotice';
import AccountTabs from '@/components/AccountTabs';
import AiCreditsPurchasePanel from '@/components/AiCreditsPurchasePanel';
import { getHighlightLabel, formatPlanPrice } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Pagamentos | Potilar'
};

type ListingPayment = {
  id: string;
  title: string;
  transaction: string;
  payment_status: string;
  payment_amount: number | null;
  payment_confirmed_at?: string | null;
  featured_plan?: string | null;
  featured_payment_status?: string | null;
  featured_payment_amount?: number | null;
  featured_starts_at?: string | null;
  created_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return 'Pendente';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function paymentLabel(listing: ListingPayment) {
  if (listing.transaction === 'Temporada') return 'Anuncio de temporada';
  return 'Publicacao de anuncio';
}

export default async function PagamentosPage({
  searchParams
}: {
  searchParams?: { pagamento?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta/pagamentos');

  const listingsResult = await supabase
    .from('listings')
    .select('id,title,transaction,payment_status,payment_amount,payment_confirmed_at,featured_plan,featured_payment_status,featured_payment_amount,featured_starts_at,created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const listings = (listingsResult.data ?? []) as ListingPayment[];
  const pendingListingPayments = listings.filter((listing) => listing.payment_status === 'pix_pending');
  const pendingHighlightPayments = listings.filter((listing) => listing.featured_payment_status === 'pix_pending');
  const confirmedListingPayments = listings.filter((listing) => listing.payment_status === 'confirmed');
  const confirmedHighlightPayments = listings.filter((listing) => listing.featured_payment_status === 'confirmed');

  const balanceResult = await supabase.rpc('get_ai_credit_balance');
  const transactionsResult = await supabase
    .from('ai_credit_transactions')
    .select('id,amount,description,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8);

  const aiBalance = Number(balanceResult.data ?? 0);
  const aiTransactions = transactionsResult.data ?? [];
  const hasPendingPayments = pendingListingPayments.length > 0 || pendingHighlightPayments.length > 0;

  return (
    <main className="section-padding max-sm:py-8">
      <div className="mx-auto max-w-6xl space-y-7 max-sm:space-y-5">
        <div>
          <h1 className="font-display text-[2rem] leading-tight text-ocean-950 dark:text-white sm:text-3xl sm:font-bold">
            Pagamentos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
            Acompanhe pagamentos de anuncios, destaques e creditos de IA da sua conta.
          </p>
        </div>

        <AccountTabs active="pagamentos" />

        {searchParams?.pagamento === 'sucesso' && (
          <AccountNotice>Pagamento recebido. A confirmacao pode levar alguns instantes.</AccountNotice>
        )}
        {searchParams?.pagamento === 'pendente' && (
          <AccountNotice>Pagamento pendente. Assim que for aprovado, atualizamos sua conta automaticamente.</AccountNotice>
        )}
        {searchParams?.pagamento === 'erro' && (
          <AccountNotice tone="error">Pagamento nao concluido. Voce pode tentar novamente.</AccountNotice>
        )}

        <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:rounded-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pendentes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Pagamentos que ainda precisam ser concluidos.</p>
            </div>
            <CreditCard className="h-6 w-6 text-ocean-700" aria-hidden="true" />
          </div>

          <div className="mt-4 divide-y divide-sand-200 dark:divide-slate-800">
            {pendingListingPayments.map((listing) => (
              <PaymentRow
                key={`listing-${listing.id}`}
                title={listing.title}
                description={paymentLabel(listing)}
                amount={listing.payment_amount}
                date={listing.created_at}
                href={`/mi-cuenta/pagar/${listing.id}`}
                action="Pagar"
              />
            ))}
            {pendingHighlightPayments.map((listing) => (
              <PaymentRow
                key={`highlight-${listing.id}`}
                title={listing.title}
                description={getHighlightLabel(listing.featured_plan)}
                amount={listing.featured_payment_amount}
                date={listing.created_at}
                href={`/mi-cuenta/pagar/${listing.id}?tipo=highlight`}
                action="Pagar"
              />
            ))}
            {!hasPendingPayments && <p className="py-4 text-sm text-slate-500">Nenhum pagamento pendente.</p>}
          </div>
        </section>

        <AiCreditsPurchasePanel balance={aiBalance} />

        <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:rounded-3xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historico</h2>
          <div className="mt-4 divide-y divide-sand-200 dark:divide-slate-800">
            {confirmedListingPayments.map((listing) => (
              <PaymentRow
                key={`confirmed-listing-${listing.id}`}
                title={listing.title}
                description={paymentLabel(listing)}
                amount={listing.payment_amount}
                date={listing.payment_confirmed_at}
              />
            ))}
            {confirmedHighlightPayments.map((listing) => (
              <PaymentRow
                key={`confirmed-highlight-${listing.id}`}
                title={listing.title}
                description={getHighlightLabel(listing.featured_plan)}
                amount={listing.featured_payment_amount}
                date={listing.featured_starts_at}
              />
            ))}
            {aiTransactions.map((transaction) => (
              <PaymentRow
                key={`ai-${transaction.id}`}
                title={transaction.description}
                description="Creditos de IA"
                amount={null}
                date={transaction.created_at}
                aside={
                  <span className="inline-flex items-center gap-1 font-bold text-ocean-800 dark:text-ocean-100">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount}
                  </span>
                }
              />
            ))}
            {confirmedListingPayments.length === 0 && confirmedHighlightPayments.length === 0 && aiTransactions.length === 0 && (
              <p className="py-4 text-sm text-slate-500">Nenhuma movimentacao ainda.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PaymentRow({
  title,
  description,
  amount,
  date,
  href,
  action,
  aside
}: {
  title: string;
  description: string;
  amount: number | null | undefined;
  date?: string | null;
  href?: string;
  action?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ocean-700 dark:text-ocean-200">{description}</p>
        <p className="mt-1 text-xs text-slate-500">{formatDate(date)}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {aside ?? <span className="font-bold text-slate-900 dark:text-white">{formatPlanPrice(Number(amount ?? 0))}</span>}
        {href && action && (
          <Link href={href} className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-sm font-bold text-white">
            {action}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
