import type { Metadata } from 'next';
import AnunciarForm from '@/components/AnunciarForm';

export const metadata: Metadata = {
  title: 'Anunciar meu imóvel | RN Lar',
  description: 'Divulgue seu imóvel com visibilidade local e atendimento digital.'
};

export default function AnunciarPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Anunciar</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Anunciar meu imóvel com atendimento digital.
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Envie as informações básicas e nossa equipe local cuida da divulgação e da visibilidade do anúncio.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Como funciona</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>• Coletamos dados e fotos do imóvel.</li>
              <li>• Organizamos o anúncio com foco local.</li>
              <li>• Você recebe interessados diretamente no WhatsApp.</li>
            </ul>
          </div>
        </div>
        <AnunciarForm />
      </div>
    </main>
  );
}
