import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seja parceiro | RN Lar',
  description: 'Quer atuar como agente ou parceiro local? Em breve.'
};

export default function SejaParceiroPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Em breve</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
          Quer atuar como agente ou parceiro local? Em breve.
        </h1>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Estamos estruturando um programa de parceria para ampliar a conexão com comunidades do RN.
        </p>
      </div>
    </main>
  );
}
