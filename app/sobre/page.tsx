import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BASE_URL } from '@/lib/config';
import {
  KEY_URLS,
  POTILAR_DEFINITION,
  SITE_INSTAGRAM,
  SITE_WHATSAPP,
  buildOrganizationJsonLd
} from '@/lib/siteIdentity';

export const metadata: Metadata = {
  title: 'Sobre a Potilar',
  description: POTILAR_DEFINITION,
  alternates: {
    canonical: '/sobre'
  },
  openGraph: {
    title: 'Sobre a Potilar | Portal de imóveis no RN',
    description: POTILAR_DEFINITION,
    url: `${BASE_URL}/sobre`
  }
};

const team = [
  {
    name: 'Lívia Costa',
    role: 'Fundadora & Atendimento',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=320&h=320&q=85'
  },
  {
    name: 'Eduardo Alves',
    role: 'Consultor Digital',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=320&h=320&q=85'
  },
  {
    name: 'Camila Rocha',
    role: 'Suporte ao Cliente',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=320&h=320&q=85'
  }
];

const audiences = [
  'Compradores e inquilinos que buscam casas, apartamentos e terrenos no RN',
  'Proprietários que querem vender, alugar ou anunciar temporada',
  'Corretores e imobiliárias com carteira no Rio Grande do Norte'
];

export default function SobrePage() {
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <main className="section-padding">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-3xl border border-ocean-200 bg-ocean-50/60 p-6 dark:border-ocean-900 dark:bg-ocean-950/30 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">O que é a Potilar</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
            Portal de imóveis no Rio Grande do Norte
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-200">{POTILAR_DEFINITION}</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            A Potilar é uma plataforma digital de divulgação imobiliária focada no RN. Não fazemos intermediação de
            negócios: o contato e a negociação acontecem diretamente entre anunciantes e interessados.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/imoveis"
              className="inline-flex rounded-full bg-ocean-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Ver imóveis no RN
            </Link>
            <Link
              href="/anunciar"
              className="inline-flex rounded-full border border-ocean-300 px-5 py-2.5 text-sm font-semibold text-ocean-800 dark:border-ocean-700 dark:text-ocean-200"
            >
              Anunciar imóvel
            </Link>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Para quem é</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {audiences.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2 className="mt-8 text-2xl font-semibold text-slate-900 dark:text-white">Nossa história</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              A Potilar nasceu para conectar famílias a imóveis acessíveis nas cidades do RN, com processos digitais e
              atendimento próximo. Atendemos com base em transparência, educação e confiança na realidade local.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Links úteis</h3>
            <ul className="mt-4 space-y-2 text-sm text-ocean-700 dark:text-ocean-300">
              <li>
                <Link href="/imoveis">Buscar imóveis</Link>
              </li>
              <li>
                <Link href="/anunciar">Anunciar grátis</Link>
              </li>
              <li>
                <Link href="/imobiliarias">Imobiliárias do RN</Link>
              </li>
              <li>
                <Link href="/faq">Perguntas frequentes</Link>
              </li>
              <li>
                <Link href="/noticias">Notícias imobiliárias</Link>
              </li>
            </ul>
            <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
              WhatsApp:{' '}
              <a href={`https://wa.me/${SITE_WHATSAPP}`} className="font-semibold text-ocean-700 dark:text-ocean-300">
                +{SITE_WHATSAPP}
              </a>
              <br />
              Instagram:{' '}
              <a href={SITE_INSTAGRAM} className="font-semibold text-ocean-700 dark:text-ocean-300">
                @potilar.imoveis
              </a>
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Documentação para sistemas de IA:{' '}
              <a href={KEY_URLS.llms} className="underline">
                llms.txt
              </a>
            </p>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Equipe</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="glass-card p-6 text-center">
                <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full">
                  <Image src={member.image} alt={member.name} fill className="object-cover" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{member.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
