import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { BASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contato recebido',
  description: 'Recebemos seu contato para anunciar na Potilar.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${BASE_URL}/anunciar-obrigado` }
};

export default function AnunciarObrigadoPage() {
  return (
    <main className="section-padding">
      <Script id="google-ads-lead-conversion" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('event', 'conversion', {
              send_to: 'AW-18334944821/_ZHyCLGqkNMcELWc5KZE'
            });
          }
        `}
      </Script>
      <section className="mx-auto max-w-2xl rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Contato recebido</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Obrigado por falar com a Potilar</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Recebemos sua solicitacao pelo formulario e vamos organizar o retorno para ajudar você a anunciar imóveis no Rio Grande do Norte.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/anunciar" className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
            Publicar agora
          </Link>
          <Link href="/imoveis" className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700">
            Ver imóveis
          </Link>
        </div>
      </section>
    </main>
  );
}
