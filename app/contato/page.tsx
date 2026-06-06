import type { Metadata } from 'next';
import { Instagram, Mail, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a equipe Potilar para atendimento sobre anuncios e imoveis no Rio Grande do Norte.',
  alternates: {
    canonical: '/contato'
  }
};

export default function ContatoPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-4xl">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Contato</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Vamos conversar sobre o seu proximo imovel.
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Preencha o formulario ou chame no WhatsApp para atendimento.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-3">
            <a
              href="https://wa.me/5521969724141?text=Ola%2C%20vim%20pelo%20site%20Potilar%20e%20quero%20falar%20com%20atendimento."
              target="_blank"
              rel="noreferrer"
              className="flex min-h-16 items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 font-semibold transition hover:border-green-400 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>WhatsApp</span>
            </a>
            <a
              href="#formulario"
              className="flex min-h-16 items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 font-semibold transition hover:border-ocean-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-600 text-white">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>Fale conosco</span>
            </a>
            <a
              href="https://www.instagram.com/potilar.imoveis"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-16 items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3 font-semibold transition hover:border-ocean-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sun-500 text-white">
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>@potilar.imoveis</span>
            </a>
          </div>
          <div id="formulario" className="mx-auto max-w-2xl">
            <div className="glass-card overflow-hidden p-0">
              <iframe
                title="Formulario de contato Potilar"
                src="https://docs.google.com/forms/d/e/1FAIpQLSe5RANc1OVsJ1BMSLsMhc7mdIMPO2Sa1bJSvv8nDjClvwXPIQ/viewform?embedded=true"
                className="h-[620px] w-full border-0"
                loading="lazy"
              >
                Carregando formulario...
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
