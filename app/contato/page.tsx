import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Mail } from 'lucide-react';
import AdvertiserLeadForm from '@/components/advertiser-leads/AdvertiserLeadForm';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a equipe Potilar para atendimento sobre anúncios e imóveis no Rio Grande do Norte.',
  alternates: {
    canonical: '/contato'
  }
};

export default function ContatoPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Contato</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Vamos conversar sobre o seu próximo imóvel.
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Por enquanto, a Potilar centraliza o atendimento pelo formulario abaixo para responder com mais organizacao.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-700 dark:text-slate-200">
            <Link
              href="#formulario"
              className="flex min-h-16 items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 font-semibold transition hover:border-green-400 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>Atendimento por formulario</span>
            </Link>
            <a
              href="mailto:contato@potilar.com.br"
              className="flex min-h-16 items-center gap-3 rounded-2xl border border-ocean-200 bg-white px-4 py-3 font-semibold transition hover:border-ocean-400 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-700 text-white">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>contato@potilar.com.br</span>
            </a>
          </div>
        </div>
        <div id="formulario">
          <AdvertiserLeadForm />
        </div>
      </div>
    </main>
  );
}
