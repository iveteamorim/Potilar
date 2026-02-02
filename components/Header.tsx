'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';
import Logo from './Logo';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Imóveis', href: '/imoveis' },
  { label: 'Anunciar', href: '/anunciar' },
  { label: 'Sobre nós', href: '/sobre' },
  { label: 'Contato', href: '/contato' }
];

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
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
            href="/anunciar"
            className="hidden rounded-full border border-ocean-200 px-4 py-2 text-xs font-semibold text-ocean-700 transition hover:bg-ocean-50 sm:inline-flex"
          >
            Anunciar meu imóvel
          </Link>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
