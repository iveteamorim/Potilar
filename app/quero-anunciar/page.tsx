import type { Metadata } from 'next';
import Link from 'next/link';
import AdvertiserLeadForm from '@/components/advertiser-leads/AdvertiserLeadForm';
import { BASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Quero anunciar na Potilar',
  description:
    'Fale com a Potilar para anunciar imóveis no Rio Grande do Norte. Atendimento para proprietários, corretores e imobiliárias.',
  alternates: { canonical: `${BASE_URL}/quero-anunciar` },
  openGraph: {
    title: 'Quero anunciar na Potilar',
    description: 'Receba ajuda para anunciar imóveis em todo o Rio Grande do Norte.',
    url: `${BASE_URL}/quero-anunciar`
  }
};

export default function QueroAnunciarPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Anunciar no RN</p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-950 dark:text-white">
            Quer anunciar imóveis na Potilar?
          </h1>
          <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
            Preencha seus dados pelo formulario e nossa equipe organiza o atendimento para ajudar você a publicar imóveis
            no Rio Grande do Norte.
          </p>
          <div className="grid gap-3 text-sm text-slate-700 dark:text-slate-200">
            <p className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              Atendimento para proprietários, corretores e imobiliárias.
            </p>
            <p className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              Casas, apartamentos, terrenos, kitnets, temporada e pontos comerciais em todo o RN.
            </p>
            <p className="rounded-2xl border border-sand-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              Também pode publicar direto pelo formulário principal em <Link href="/anunciar" className="font-semibold text-ocean-700">Anunciar</Link>.
            </p>
          </div>
        </section>

        <AdvertiserLeadForm />
      </div>
    </main>
  );
}
