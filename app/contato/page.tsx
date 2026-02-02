import type { Metadata } from 'next';
import ContatoForm from '@/components/ContatoForm';
import MapSection from '@/components/MapSection';

export const metadata: Metadata = {
  title: 'Contato | RN Lar',
  description: 'Fale com a equipe RN Lar por WhatsApp ou formulário.'
};

export default function ContatoPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Contato</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Vamos conversar sobre o seu próximo imóvel.
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Preencha o formulário ou chame no WhatsApp para um atendimento imediato.
            </p>
          </div>
          <ContatoForm />
        </div>
        <MapSection title="Onde estamos" />
      </div>
    </main>
  );
}
