import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountNotice from '@/components/AccountNotice';
import AccountTabs from '@/components/AccountTabs';
import AiCreditsPurchasePanel from '@/components/AiCreditsPurchasePanel';
import { PLANS } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'IA e creditos | Potilar'
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default async function AiCreditsPage({
  searchParams
}: {
  searchParams?: { pagamento?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta/creditos');

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,professional_plan')
    .eq('id', user.id)
    .single();
  const balanceResult = await supabase.rpc('get_ai_credit_balance');
  const transactionsResult = await supabase
    .from('ai_credit_transactions')
    .select('id,type,amount,description,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const isSetupMissing = Boolean(balanceResult.error || transactionsResult.error);
  const balance = Number(balanceResult.data ?? 0);
  const transactions = transactionsResult.data ?? [];
  const accountType = profile?.account_type ?? 'particular';
  const includedCredits =
    profile?.professional_plan === 'plus'
      ? PLANS.professional.plus.aiCredits
      : accountType === 'corretor'
        ? PLANS.professional.corretor.aiCredits
        : accountType === 'imobiliaria'
          ? PLANS.professional.imobiliaria.aiCredits
          : 0;

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">IA e creditos</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Compre creditos, acompanhe o saldo e veja o historico das melhorias feitas com IA.
            </p>
          </div>
        </div>

        <AccountTabs active="pagamentos" />

        {searchParams?.pagamento === 'sucesso' && (
          <AccountNotice>
            Pagamento recebido. Os creditos entram assim que o Mercado Pago confirmar a aprovacao.
          </AccountNotice>
        )}

        {searchParams?.pagamento === 'pendente' && (
          <AccountNotice>
            Pagamento pendente. Os creditos entram automaticamente quando for aprovado.
          </AccountNotice>
        )}

        {searchParams?.pagamento === 'erro' && (
          <AccountNotice tone="error">
            Pagamento não concluído. Você pode tentar novamente.
          </AccountNotice>
        )}

        {isSetupMissing && (
          <AccountNotice tone="error">
            O sistema de creditos ainda precisa do SQL `supabase/ai_credits.sql` aplicado no Supabase.
          </AccountNotice>
        )}

        <AiCreditsPurchasePanel balance={balance} />

        {includedCredits > 0 && (
          <section className="rounded-3xl border border-ocean-100 bg-ocean-50 p-5 text-sm leading-6 text-ocean-900 dark:border-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100">
            <p className="font-semibold">Seu plano profissional inclui {includedCredits} utilizacoes de IA por mes.</p>
            <p className="mt-1">
              Creditos extras comprados aparecem no saldo acima e podem ser usados junto com as utilizacoes do plano.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">O que consome creditos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['Gerar titulo + descricao', '1 credito por versao criada.'],
              ['Testar outra opcao', 'Use mais 1 credito se quiser uma segunda versao.'],
              ['Comprar pacote extra', 'O saldo fica disponivel na sua conta.']
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-sand-200 bg-sand-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="historico" className="rounded-3xl border border-sand-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historico</h2>
          <div className="mt-4 divide-y divide-sand-200 dark:divide-slate-800">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{transaction.description}</p>
                  <p className="text-xs text-slate-500">{formatDate(transaction.created_at)}</p>
                </div>
                <span className={`font-bold ${transaction.amount > 0 ? 'text-green-700' : 'text-slate-700 dark:text-slate-200'}`}>
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="py-4 text-sm text-slate-500">Nenhuma movimentacao ainda.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
