import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Flag, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Seguranca | Potilar',
  description: 'Dicas de seguranca para buscar, visitar e negociar imoveis anunciados na Potilar.'
};

const checks = [
  'Anuncios passam por revisao antes de aparecerem no site.',
  'Contas, anuncios, dados profissionais e pagamentos podem ser analisados manualmente em ate 24 horas.',
  'O codigo do anuncio ajuda nossa equipe a localizar rapidamente qualquer publicacao.',
  'Canais de contato e fotos podem ser avaliados antes da publicacao.',
  'Anuncios suspeitos podem ser denunciados para nova revisao.'
];

const alerts = [
  'Pedido de Pix, sinal, caucao ou reserva antes de visitar o imovel.',
  'Anunciante que evita chamada, visita ou comprovacao de identidade.',
  'Preco muito abaixo do normal sem explicacao clara.',
  'Fotos genericas, copiadas ou que nao parecem do mesmo imovel.',
  'Pressao para fechar negocio com urgencia.'
];

export default function SegurancaPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Seguranca Potilar
          </span>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
              Busque imoveis com mais cuidado e transparencia.
            </h1>
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              A Potilar e uma plataforma de divulgacao imobiliaria. A negociacao acontece diretamente entre anunciante
              e interessado, por isso recomendamos verificar dados, visitar o imovel e nunca fazer pagamentos antecipados
              sem seguranca.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-green-200 bg-white p-6 shadow-soft dark:border-green-900/60 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
              <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
              O que fazemos
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {checks.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-soft dark:border-amber-900/60 dark:bg-amber-950/30">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-amber-950 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Sinais de alerta
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-amber-950 dark:text-amber-100">
              {alerts.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Antes de negociar</h2>
          <div className="mt-5 grid gap-4 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
            <p>Visite o imovel ou confirme sua existencia por videochamada.</p>
            <p>Confira documentos, endereco e identidade do anunciante.</p>
            <p>Nao envie dinheiro para reservar imovel sem contrato e verificacao.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-ocean-700 p-6 text-white shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Viu algo suspeito?</h2>
              <p className="mt-2 text-sm text-ocean-50">
                Envie o codigo do anuncio para nossa equipe revisar.
              </p>
            </div>
            <a
              href="https://wa.me/5521969724141?text=Ola%2C%20quero%20denunciar%20um%20anuncio%20suspeito%20na%20Potilar."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ocean-700"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              Denunciar pelo WhatsApp
            </a>
          </div>
        </section>

        <Link href="/imoveis" className="inline-flex rounded-full border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700">
          Ver imoveis
        </Link>
      </div>
    </main>
  );
}
