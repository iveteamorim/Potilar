'use client';

import Link from 'next/link';
import { formatPlanPrice, PLANS } from '@/lib/plans';
import type { CapacitySnapshot } from '@/lib/listingCapacity';
import ProfessionalPlanCheckoutButton from '@/components/ProfessionalPlanCheckoutButton';

type Props = {
  snapshot: CapacitySnapshot;
  onChooseAvulso?: () => void;
};

export default function ListingCapacityNotice({ snapshot, onChooseAvulso }: Props) {
  const { decision } = snapshot;

  if (decision.action !== 'require_avulso') {
    return null;
  }

  const showCorretorPlan = snapshot.accountType === 'corretor' && !snapshot.hasPlan;
  const showImobiliariaPlan = snapshot.accountType === 'imobiliaria' && !snapshot.hasPlan;
  const showImobiliariaPro = snapshot.accountType === 'imobiliaria' && snapshot.professionalPlan === 'imobiliaria';

  return (
    <div className="space-y-3 rounded-2xl border border-sand-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
      {snapshot.accountType === 'corretor' ? (
        <p className="font-semibold text-slate-950 dark:text-white">
          {snapshot.hasPlan
            ? `Seu Plano Corretor cobre ${snapshot.paidLimit} imóveis. Este extra continua na conta de Corretor.`
            : 'Você já publicou seus 3 imóveis grátis.'}
        </p>
      ) : snapshot.accountType === 'imobiliaria' ? (
        <p className="font-semibold text-slate-950 dark:text-white">
          {snapshot.hasPlan
            ? `Seu plano cobre ${snapshot.paidLimit} imóveis. Você pode adicionar este anúncio avulso sem mudar o tipo de conta.`
            : 'Você já publicou seus 10 imóveis grátis.'}
        </p>
      ) : (
        <p className="font-semibold text-slate-950 dark:text-white">Você já publicou seus 2 imóveis grátis.</p>
      )}

      {snapshot.extraActiveCount > 0 && snapshot.accountType !== 'particular' && !snapshot.hasPlan && (
        <p className="leading-6 text-slate-600 dark:text-slate-300">
          Você está usando {snapshot.extraActiveCount} anúncio{snapshot.extraActiveCount === 1 ? '' : 's'} avulso
          {snapshot.extraActiveCount === 1 ? '' : 's'}: {formatPlanPrice(snapshot.extraActiveCount * PLANS.listing.avulsoPrice)}.
        </p>
      )}

      {snapshot.nearPlan && snapshot.recommendedPlan === 'corretor' && (
        <p className="leading-6 text-slate-600 dark:text-slate-300">
          Você está perto de economizar com o Plano Corretor.
        </p>
      )}

      {snapshot.nearPlan && snapshot.recommendedPlan === 'imobiliaria' && (
        <p className="leading-6 text-slate-600 dark:text-slate-300">
          Você está perto de economizar com o Plano Imobiliária.
        </p>
      )}

      <button
        type="button"
        onClick={onChooseAvulso}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-[#002D62] px-4 py-3 text-sm font-bold text-white"
      >
        Publicar este imóvel por {formatPlanPrice(decision.amount)} / {decision.durationDays} dias
      </button>

      {showCorretorPlan && (
        <div className={`rounded-2xl border px-4 py-3 ${snapshot.highlightPlan ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-sand-200 bg-sand-50 dark:border-slate-800 dark:bg-slate-950'}`}>
          {snapshot.highlightPlan && (
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
              Melhor custo para sua carteira.
            </p>
          )}
          <p className="font-semibold text-slate-950 dark:text-white">Plano Corretor</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Até 10 imóveis ativos · {formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true })}</p>
          <div className="mt-3">
            <ProfessionalPlanCheckoutButton planId="corretor" fallbackHref="/planos#planos">
              Assinar Plano Corretor
            </ProfessionalPlanCheckoutButton>
          </div>
        </div>
      )}

      {showImobiliariaPlan && (
        <div className={`rounded-2xl border px-4 py-3 ${snapshot.highlightPlan ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-sand-200 bg-sand-50 dark:border-slate-800 dark:bg-slate-950'}`}>
          {snapshot.highlightPlan && (
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
              Melhor custo para sua carteira.
            </p>
          )}
          <p className="font-semibold text-slate-950 dark:text-white">Plano Imobiliária</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Até 30 imóveis ativos · {formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true })}</p>
          <div className="mt-3">
            <ProfessionalPlanCheckoutButton planId="imobiliaria" fallbackHref="/planos#planos">
              Assinar Plano Imobiliária
            </ProfessionalPlanCheckoutButton>
          </div>
        </div>
      )}

      {showImobiliariaPro && (
        <div className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="font-semibold text-slate-950 dark:text-white">Plano Imobiliária Pro</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Até 75 imóveis ativos · {formatPlanPrice(PLANS.professional.plus.price, { perMonth: true })}</p>
          <div className="mt-3">
            <ProfessionalPlanCheckoutButton planId="plus" fallbackHref="/planos#planos">
              Assinar Imobiliária Pro
            </ProfessionalPlanCheckoutButton>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Prefere comparar depois? <Link href="/planos" className="font-semibold text-ocean-700 underline">Ver planos</Link>
      </p>
    </div>
  );
}
