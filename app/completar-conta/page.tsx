import type { Metadata } from 'next';
import { Suspense } from 'react';
import CompleteAccountForm from '@/components/CompleteAccountForm';

export const metadata: Metadata = {
  title: 'Completar conta | Potilar',
  description: 'Complete sua conta Potilar para salvar favoritos e alertas.'
};

export default function CompletarContaPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Conta Potilar</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
            Complete sua conta para guardar favoritos.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Seu email foi confirmado. Agora crie uma senha para entrar de novo e acessar seus imóveis favoritos quando quiser.
          </p>
        </div>
        <Suspense fallback={<div className="glass-card h-80 animate-pulse p-6" />}>
          <CompleteAccountForm />
        </Suspense>
      </div>
    </main>
  );
}
