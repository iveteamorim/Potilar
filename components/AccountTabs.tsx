import Link from 'next/link';
import { Bell, CreditCard, Heart, Home, User } from 'lucide-react';

type AccountTabKey = 'anuncios' | 'favoritos' | 'alertas' | 'perfil' | 'pagamentos';

type AccountTabsProps = {
  active: AccountTabKey;
};

const accountTabs = [
  { key: 'anuncios', label: 'Meus anúncios', href: '/mi-cuenta#anuncios', Icon: Home },
  { key: 'favoritos', label: 'Favoritos', href: '/mi-cuenta/favoritos', Icon: Heart },
  { key: 'alertas', label: 'Alertas', href: '/mi-cuenta/alertas', Icon: Bell },
  { key: 'perfil', label: 'Dados da conta', href: '/mi-cuenta/perfil', Icon: User },
  { key: 'pagamentos', label: 'Pagamentos', href: '/mi-cuenta/creditos', Icon: CreditCard }
] as const;

export default function AccountTabs({ active }: AccountTabsProps) {
  return (
    <nav className="grid grid-cols-2 gap-2 border-b border-sand-200 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-300 sm:grid-cols-3 lg:grid-cols-5">
      {accountTabs.map(({ key, label, href, Icon }) => (
        <Link
          key={key}
          href={href}
          className={`flex min-h-[3.25rem] items-center justify-center gap-2.5 border-b-[3px] px-3 text-center transition ${
            active === key ? 'border-ocean-800 text-ocean-900 dark:text-white' : 'border-transparent hover:text-ocean-800'
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
