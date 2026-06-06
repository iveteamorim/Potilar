import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = {
  title: 'Entrar | Potilar',
  description: 'Acesse sua conta para publicar e gerenciar anuncios na Potilar.'
};

export default function LoginPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Conta Potilar</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
            Entre para publicar e gerenciar seus anuncios.
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Crie sua conta gratuita, suba fotos do imovel e acompanhe o status da publicacao.
          </p>
        </div>
        <Suspense fallback={<div className="glass-card h-80 animate-pulse p-6" />}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
