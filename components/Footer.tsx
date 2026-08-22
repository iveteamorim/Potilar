import Link from 'next/link';
import { FileText, Instagram, Mail } from 'lucide-react';
import { FEATURED_CITY_NAMES, getCityPagePath } from '@/lib/cityPages';
import { SEO_INTENT_PAGES } from '@/lib/seoIntentPages';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-white py-10 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <Logo />
          <p className="mt-2">
            Plataforma digital focada no Rio Grande do Norte, com contato direto entre anunciantes e interessados.
          </p>
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">Navegação</p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
            <Link href="/imoveis">Imóveis</Link>
            <Link href="/imoveis/cidades">Cidades do RN</Link>
            <Link href="/minha-casa-minha-vida">Financiamento de imóveis</Link>
            <Link href="/planos">Planos e Preços</Link>
            <Link href="/sobre">Sobre</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/imobiliarias">Imobiliárias</Link>
            <Link href="/seguranca">Segurança</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/termos-de-uso">Termos de Uso</Link>
            <Link href="/privacidade">Privacidade</Link>
          </div>
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">Cidades</p>
          <div className="mt-2 grid gap-2">
            {FEATURED_CITY_NAMES.slice(0, 8).map((city) => (
              <Link key={city} href={getCityPagePath(city)}>
                Imóveis em {city}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Buscas</p>
          <div className="mt-2 grid gap-1.5 text-xs text-slate-500 dark:text-slate-500">
            {SEO_INTENT_PAGES.slice(0, 9).map((page) => (
              <Link key={page.slug} href={`/imoveis/${page.slug}`} className="hover:text-ocean-700 dark:hover:text-ocean-300">
                {page.title}
              </Link>
            ))}
            <Link href="/anunciar-imovel-gratis" className="hover:text-ocean-700 dark:hover:text-ocean-300">
              Anunciar imóvel grátis no RN
            </Link>
            <Link href="/quero-anunciar" className="hover:text-ocean-700 dark:hover:text-ocean-300">
              Quero anunciar na Potilar
            </Link>
            <Link href="/anunciar-ponto-comercial-gratis" className="hover:text-ocean-700 dark:hover:text-ocean-300">
              Anunciar ponto comercial
            </Link>
          </div>
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">Contato</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/contato"
              aria-label="Formulario de contato Potilar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 transition hover:border-ocean-400 hover:bg-ocean-50 dark:border-slate-800 dark:bg-slate-900"
            >
              <FileText className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href="mailto:contato@potilar.com.br"
              aria-label="Email Potilar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 transition hover:border-ocean-400 hover:bg-ocean-50 dark:border-slate-800 dark:bg-slate-900"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/potilar.rn"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram Potilar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-sun-500 transition hover:border-sun-300 hover:bg-sun-50 dark:border-slate-800 dark:bg-slate-900"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
          <Link
            href="/anunciar"
            className="mt-3 inline-flex rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-ocean-700"
          >
            Anunciar meu imóvel
          </Link>
          <a href="mailto:contato@potilar.com.br" className="mt-3 block text-xs font-semibold text-ocean-700">
            contato@potilar.com.br
          </a>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-slate-500 sm:px-6">
        &copy; 2026 Potilar. Todos os direitos reservados.
        <p className="mt-3">
          A Potilar atua como plataforma digital de divulgação imobiliária. A negociação e a formalização dos negócios
          são realizadas diretamente entre proprietários e interessados.
        </p>
      </div>
    </footer>
  );
}
