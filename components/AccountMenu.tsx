import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

type AccountMenuProps = {
  showPrimaryAction?: boolean;
  align?: 'left' | 'right';
};

const menuItems = [
  { href: '/mi-cuenta', title: 'Minha conta', Icon: Home }
];

export default function AccountMenu({ showPrimaryAction = true, align = 'right' }: AccountMenuProps) {
  return (
    <div className="flex items-center justify-start gap-2 sm:justify-end">
      {showPrimaryAction && (
        <Link href="/anunciar" className="inline-flex rounded-xl bg-ocean-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-800">
          Anunciar gratis
        </Link>
      )}
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-ocean-200 hover:text-ocean-700 [&::-webkit-details-marker]:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          Minha conta
          <span className="text-xs text-slate-400 transition group-open:rotate-180">⌄</span>
        </summary>
        <div className={`absolute z-30 mt-3 w-80 overflow-hidden rounded-2xl border border-sand-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="space-y-1">
            {menuItems.map(({ href, title, Icon }, index) => (
              <Link key={href} href={href} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-sand-50 dark:hover:bg-slate-800 ${index === 0 ? 'bg-slate-50 shadow-sm dark:bg-slate-800/70' : ''}`}>
                <Icon className="h-6 w-6 text-ocean-950 dark:text-ocean-100" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold text-ocean-950 dark:text-white">{title}</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-3 border-t border-sand-100 pt-3 dark:border-slate-800">
            <div className="flex items-center gap-4 rounded-xl px-4 py-2">
              <LogOut className="h-6 w-6 text-ocean-950 dark:text-ocean-100" aria-hidden="true" />
              <div className="flex-1">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
