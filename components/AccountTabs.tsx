import Link from 'next/link';
import { Bell, CreditCard, Heart, Home, User } from 'lucide-react';

type AccountTabKey = 'anuncios' | 'favoritos' | 'alertas' | 'perfil' | 'pagamentos';

type AccountTabsProps = {
  active: AccountTabKey;
};

const accountTabs = [
  { key: 'anuncios', label: 'Meus anúncios', shortLabel: 'Anúncios', href: '/mi-cuenta#anuncios', Icon: Home },
  { key: 'favoritos', label: 'Favoritos', shortLabel: 'Favoritos', href: '/mi-cuenta/favoritos', Icon: Heart },
  { key: 'alertas', label: 'Alertas', shortLabel: 'Alertas', href: '/mi-cuenta/alertas', Icon: Bell },
  { key: 'perfil', label: 'Dados da conta', shortLabel: 'Conta', href: '/mi-cuenta/perfil', Icon: User },
  { key: 'pagamentos', label: 'Pagamentos', shortLabel: 'Pagamentos', href: '/mi-cuenta/pagamentos', Icon: CreditCard }
] as const;

export default function AccountTabs({ active }: AccountTabsProps) {
  return (
    <nav className="flex border-b border-sand-200 text-slate-500 dark:border-slate-800 dark:text-slate-300 sm:grid sm:grid-cols-3 sm:gap-2 sm:text-sm sm:font-semibold lg:grid-cols-5">
      {accountTabs.map(({ key, label, shortLabel, href, Icon }) => (
        <Link
          key={key}
          href={href}
          className={`flex flex-1 flex-col items-center gap-1 border-b-[3px] px-1 py-2.5 text-[11px] font-semibold transition sm:min-h-[3.25rem] sm:flex-row sm:justify-center sm:gap-2.5 sm:px-3 sm:py-0 sm:text-center sm:text-sm ${
            active === key ? 'border-ocean-800 text-ocean-800 dark:text-white' : 'border-transparent hover:text-ocean-800'
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
