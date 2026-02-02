import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agentes locais | RN Lar',
  description: 'Em breve, agentes locais credenciados para atendimento presencial.'
};

export default function AgentesPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Em breve</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
          Agentes locais credenciados para atendimento presencial.
        </h1>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Estamos preparando a integração de agentes parceiros para ampliar o suporte local quando necessário.
        </p>
      </div>
    </main>
  );
}
