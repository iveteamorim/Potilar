'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Property } from '@/data/properties';
import FavoriteAwarePropertyList from './FavoriteAwarePropertyList';

const PAGE_SIZE = 12;

type Props = {
  items: Property[];
};

export default function PaginatedPropertyList({ items }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <FavoriteAwarePropertyList items={pageItems} />

      {items.length > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-sand-200 pt-4 dark:border-slate-800 sm:flex-row">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Pagina {safePage} de {totalPages} - {items.length} anuncios
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => goToPage(safePage - 1)}
              className="rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => goToPage(safePage + 1)}
              className="rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Proxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
