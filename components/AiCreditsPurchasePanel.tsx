'use client';

import { useState } from 'react';
import { CreditCard, Loader2, Sparkles } from 'lucide-react';
import { AI_CREDIT_PACKAGES, formatCredits, type AiCreditPackageId } from '@/lib/aiCredits';
import { formatPlanPrice } from '@/lib/plans';

type Props = {
  balance: number;
};

export default function AiCreditsPurchasePanel({ balance }: Props) {
  const [selectedPackage, setSelectedPackage] = useState<AiCreditPackageId>('starter');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const packages = Object.values(AI_CREDIT_PACKAGES);

  async function startCheckout() {
    setStatus('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage })
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? 'Nao foi possivel iniciar o pagamento.');
        return;
      }

      const checkoutUrl = data.initPoint ?? data.sandboxInitPoint;
      if (!checkoutUrl) {
        setStatus('Pagamento criado, mas o link de checkout nao foi retornado.');
        return;
      }

      window.location.href = checkoutUrl;
    } catch {
      setStatus('Nao foi possivel conectar ao pagamento.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Saldo atual</p>
            <p className="mt-3 text-4xl font-bold text-ocean-800 dark:text-ocean-100">{balance}</p>
            <p className="mt-1 text-sm text-slate-500">{formatCredits(balance)} disponiveis</p>
          </div>
          <span className="rounded-2xl bg-ocean-50 p-3 text-ocean-700 dark:bg-ocean-950 dark:text-ocean-200">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Cada credito gera uma nova versao com titulo e descricao profissional. Se quiser duas opcoes para o mesmo imovel, use dois creditos.
        </div>
      </section>

      <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">Comprar creditos</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {packages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedPackage(item.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedPackage === item.id
                  ? 'border-ocean-500 bg-ocean-50 text-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100'
                  : 'border-sand-200 bg-white text-slate-700 hover:border-ocean-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              <span className="block text-lg font-bold">{item.label}</span>
              <span className="mt-1 block text-2xl font-bold">{formatPlanPrice(item.price)}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={startCheckout}
          disabled={isLoading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
          Comprar com Mercado Pago
        </button>

        {status && (
          <p className="mt-4 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {status}
          </p>
        )}
      </section>
    </div>
  );
}
