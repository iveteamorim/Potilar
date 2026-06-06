'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LISTING_CODE_PATTERN = /[0-9a-f-]{8,}/i;

export default function NotFound() {
  const pathname = usePathname();
  const listingCode = pathname.match(LISTING_CODE_PATTERN)?.[0]?.replace(/-/g, '').slice(0, 8);

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-2xl rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Potilar</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Pagina nao encontrada</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Este link nao abriu corretamente. Copie a rota abaixo para verificarmos o que chegou no celular.
        </p>
        <p className="mt-4 break-all rounded-2xl bg-sand-50 p-3 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {pathname}
        </p>
        {listingCode && (
          <Link
            href={`/a/${listingCode}`}
            className="mt-4 inline-flex rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Tentar abrir anuncio
          </Link>
        )}
        <Link
          href="/imoveis"
          className="mt-4 inline-flex rounded-full bg-ocean-700 px-5 py-3 text-sm font-semibold text-white"
        >
          Ver imoveis
        </Link>
      </div>
    </main>
  );
}
