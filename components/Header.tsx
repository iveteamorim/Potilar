'use client';

import Link from 'next/link';
import { Calculator, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from './Logo';

const navigation = [
  { label: 'Início', href: '/' },
  { label: 'Imóveis', href: '/imoveis' },
  { label: 'Anunciar', href: '/anunciar' },
  { label: 'Imobiliárias', href: '/imobiliarias' },
  { label: 'Contato', href: '/contato' }
];

const mobileNavigation = [
  ...navigation,
  { label: 'Financiamento de imóveis', href: '/minha-casa-minha-vida' },
  { label: 'Segurança', href: '/seguranca' }
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3.5 sm:gap-4">
          <Link
            href="/mi-cuenta"
            onClick={closeMenu}
            className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
              isActive('/mi-cuenta')
                ? 'border-sun-500 bg-sun-500 text-white'
                : 'border-sun-300 bg-sun-50 text-slate-900 hover:border-sun-500 dark:border-sun-700 dark:bg-slate-900 dark:text-sand-50'
            }`}
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Minha conta</span>
          </Link>
          <Link
            href="/anunciar"
            className="hidden rounded-lg border-2 border-slate-900 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-slate-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-slate-950 sm:inline-flex"
          >
            Anunciar grátis
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-sand-200 bg-white text-slate-800 shadow-sm transition hover:border-ocean-300 hover:text-ocean-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[1px]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            aria-label="Fechar menu"
            onClick={closeMenu}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[390px] flex-col border-l border-sand-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-sand-200 px-6 py-4 dark:border-slate-800">
              <Logo />
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-sand-50 hover:text-ocean-700 dark:text-slate-100 dark:hover:bg-slate-900"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav className="grid gap-1 overflow-y-auto px-4 py-5 text-base font-semibold text-slate-800 dark:text-slate-100">
            {mobileNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`rounded-2xl px-4 py-4 transition ${
                  isActive(item.href)
                    ? 'bg-ocean-50 text-ocean-700 dark:bg-ocean-950/40 dark:text-ocean-200'
                    : 'hover:bg-sand-50 dark:hover:bg-slate-900'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {item.href === '/minha-casa-minha-vida' && <Calculator className="h-4 w-4" aria-hidden="true" />}
                  {item.href === '/seguranca' && <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                  {item.label}
                </span>
              </Link>
            ))}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
