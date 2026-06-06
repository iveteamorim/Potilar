import type { Metadata } from 'next';
import Link from 'next/link';
import { Handshake, Megaphone, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Seja parceiro | Potilar',
  description: 'Parcerias com imobiliarias, corretores e negocios locais no Rio Grande do Norte.'
};

const whatsappHref =
  'https://wa.me/5521969724141?text=Ola%2C%20quero%20ser%20parceiro%20da%20Potilar%20no%20RN.';

export default function SejaParceiroPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Parcerias</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">
            Faca parte da rede Potilar no RN
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            Trabalhamos com corretores, imobiliarias, construtoras e negocios locais que querem ampliar a divulgacao de
            imoveis com seguranca e presenca digital regional.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {(
            [
              { title: 'Imobiliarias e corretores', text: 'Anuncios com limite por plano, destaques e painel proprio.', Icon: Handshake },
              { title: 'Visibilidade regional', text: 'Presenca em buscas, mapa e noticias do mercado imobiliario.', Icon: Megaphone },
              { title: 'Moderacao e confianca', text: 'Anuncios revisados e contato direto com interessados.', Icon: ShieldCheck }
            ] as const
          ).map(({ title, text, Icon }) => (
            <article key={title} className="glass-card p-6">
              <Icon className="h-8 w-8 text-ocean-700" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Quer conversar sobre parceria?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Conte quem voce e, em qual cidade atua e quantos imoveis pretende divulgar. A equipe Potilar responde com o
            melhor caminho: plano profissional, destaques ou integracao personalizada.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
              Quero ser parceiro
            </a>
            <Link href="/imobiliarias" className="rounded-2xl border border-sand-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Ver planos para imobiliarias
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
