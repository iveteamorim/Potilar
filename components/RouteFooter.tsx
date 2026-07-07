'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

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

  return <Footer />;
}
