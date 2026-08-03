import Link from 'next/link';
import { SEARCH_ALERTS_ENABLED } from '@/lib/config';
import LogoutButton from '@/components/LogoutButton';

type AccountMenuProps = {
  showPrimaryAction?: boolean;
  align?: 'left' | 'right';
};

export default function AccountMenu({ showPrimaryAction = true, align = 'right' }: AccountMenuProps) {
  return (
    <div className="flex items-center justify-start gap-2 sm:justify-end">
      {showPrimaryAction && (
        <Link href="/anunciar" className="inline-flex rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white">
          Anunciar imóvel
        </Link>
      )}
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-ocean-200 hover:text-ocean-700 [&::-webkit-details-marker]:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          Mi cuenta
          <span className="text-xs text-slate-400 transition group-open:rotate-180">⌄</span>
        </summary>
        <div className={`absolute z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-sand-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <Link href="/mi-cuenta" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sand-50 hover:text-ocean-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Visão geral
          </Link>
          <Link href="/mi-cuenta/favoritos" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sand-50 hover:text-ocean-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Meus favoritos
          </Link>
          <Link href="/mi-cuenta/mensagens" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sand-50 hover:text-ocean-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Mensagens
          </Link>
          <Link href="/mi-cuenta/creditos" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sand-50 hover:text-ocean-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Créditos de IA
          </Link>
          {SEARCH_ALERTS_ENABLED && (
            <Link href="/mi-cuenta/alertas" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sand-50 hover:text-ocean-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Meus alertas
            </Link>
          )}
          <div className="mt-1 border-t border-sand-100 pt-2 dark:border-slate-800">
            <LogoutButton />
          </div>
        </div>
      </details>
    </div>
  );
}
