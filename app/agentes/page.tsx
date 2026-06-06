import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, MapPin, MessageCircle, Users } from 'lucide-react';
import { PLANS, formatPlanPrice } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Corretores no RN | Potilar',
  description: 'Corretores e imobiliarias podem anunciar imoveis no Rio Grande do Norte com a Potilar.'
};

const whatsappHref =
  'https://wa.me/5521969724141?text=Ola%2C%20sou%20corretor%20e%20quero%20anunciar%20na%20Potilar.';

export default function AgentesPage() {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Profissionais</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">
            Corretores e imobiliarias do RN na Potilar
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            Publique imoveis com contato direto pelo WhatsApp, destaque anuncios estrategicos e gerencie tudo em um painel
            simples.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {(
            [
              { title: 'Ate 10 anuncios ativos', text: `Plano Corretor ${formatPlanPrice(PLANS.professional.corretor.price, { perMonth: true })}`, Icon: Users },
              { title: 'Ate 50 anuncios ativos', text: `Plano Imobiliaria ${formatPlanPrice(PLANS.professional.imobiliaria.price, { perMonth: true })}`, Icon: BadgeCheck },
              { title: 'Mapa e busca local', text: 'Destaques para vender ou alugar mais rapido', Icon: MapPin }
            ] as const
          ).map(({ title, text, Icon }) => (
            <article key={title} className="glass-card p-6">
              <Icon className="h-8 w-8 text-ocean-700" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-ocean-200 bg-ocean-50 p-6 dark:border-ocean-900 dark:bg-ocean-950/40">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Como comecar</h2>
          <ol className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-300">
            <li>1. Crie sua conta como corretor ou imobiliaria.</li>
            <li>2. Publique imoveis com fotos, bairro e localizacao no mapa.</li>
            <li>3. Receba contatos diretos e ative destaques quando precisar.</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
              Criar conta
            </Link>
            <Link href="/planos" className="rounded-2xl border border-ocean-300 px-5 py-3 text-sm font-semibold text-ocean-800 dark:border-ocean-800 dark:text-ocean-200">
              Ver planos
            </Link>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Falar com a Potilar
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
