'use client';

import Link from 'next/link';
import { Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from './Logo';

const navigation = [
  { label: 'Inicio', href: '/' },
  { label: 'Imoveis', href: '/imoveis' },
  { label: 'Anunciar', href: '/anunciar' },
  { label: 'Imobiliarias', href: '/imobiliarias' },
  { label: 'Contato', href: '/contato' }
];

const mobileNavigation = [
  ...navigation,
  { label: 'Seguranca', href: '/seguranca' }
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-200 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative transition hover:text-ocean-600 ${
                isActive(item.href) ? 'text-ocean-700' : ''
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-ocean-600 transition-opacity" />
              )}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/seguranca"
            onClick={closeMenu}
            className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition md:inline-flex ${
              isActive('/seguranca')
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-green-200 bg-green-50 text-green-700 hover:border-green-400 dark:border-green-900 dark:bg-slate-900 dark:text-green-300'
            }`}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Seguranca
          </Link>
          <Link
            href="/mi-cuenta"
            onClick={closeMenu}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
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
            className="hidden rounded-lg border-2 border-slate-900 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-slate-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-slate-950 sm:inline-flex"
          >
            Anunciar gratis
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-slate-800 transition hover:border-ocean-300 hover:text-ocean-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 md:hidden"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-sand-100 bg-white/95 px-4 pb-4 pt-2 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
          <nav className="mx-auto grid max-w-6xl gap-1 text-sm font-semibold text-slate-700 dark:text-slate-100">
            {mobileNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`rounded-2xl px-4 py-3 transition ${
                  isActive(item.href)
                    ? 'bg-ocean-50 text-ocean-700 dark:bg-ocean-950/40 dark:text-ocean-200'
                    : 'hover:bg-sand-50 dark:hover:bg-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 sm:hidden">
              <Link
                href="/anunciar"
                onClick={closeMenu}
                className="rounded-2xl bg-ocean-600 px-4 py-3 text-center text-sm font-bold text-white"
              >
                Anunciar gratis
              </Link>
              <Link
                href="/mi-cuenta"
                onClick={closeMenu}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sun-300 bg-sun-50 px-4 py-3 text-sm font-bold text-slate-900 dark:border-sun-700 dark:bg-slate-900 dark:text-sand-50"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Minha conta
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
