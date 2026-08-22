'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Footer from './Footer';
import Logo from './Logo';

function ShortFooter() {
  return (
    <footer className="border-t border-sand-200 bg-white/80 px-4 py-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-ocean-800 dark:text-ocean-200" aria-label="Rodapé">
          <Link href="/imoveis">Imóveis</Link>
          <Link href="/planos">Planos</Link>
          <Link href="/contato">Contato</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <span className="text-xs text-slate-500">© 2026 Potilar</span>
      </div>
    </footer>
  );
}

export default function RouteFooter() {
  const pathname = usePathname();

  if (pathname === '/mi-cuenta/mensagens') {
    return null;
  }

  if (pathname === '/login') {
    return (
      <footer className="border-t border-sand-200 bg-white/70 px-4 py-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>Potilar &copy; 2026</span>
          <Link href="/termos-de-uso" className="font-semibold text-ocean-700">
            Termos
          </Link>
          <Link href="/privacidade" className="font-semibold text-ocean-700">
            Privacidade
          </Link>
        </div>
      </footer>
    );
  }

  if (pathname === '/imobiliarias' || pathname === '/planos' || pathname === '/contato' || pathname === '/faq') {
    return <ShortFooter />;
  }

  return <Footer />;
}
