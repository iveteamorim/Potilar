'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X } from 'lucide-react';
import type { Property } from '@/data/properties';
import PropertyMap from '@/components/PropertyMapLoader';

type Props = {
  items: Property[];
  floating?: boolean;
};

export default function MapModalButton({ items, floating = false }: Props) {
  const [open, setOpen] = useState(false);

  const modal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 p-3 sm:p-6">
            <div className="relative h-full overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
              <div className="absolute left-0 right-0 top-0 z-[10000] flex items-center justify-between border-b border-sand-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Mapa dos imoveis</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  aria-label="Fechar mapa"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="h-full pt-16">
                <PropertyMap items={items} height="calc(100vh - 7.5rem)" mapActive compactPreview />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          floating
            ? 'absolute bottom-4 right-4 z-[500] inline-flex items-center justify-center gap-2 rounded-full border border-sand-200 bg-white px-4 py-2.5 text-sm font-bold text-ocean-700 shadow-lg transition hover:-translate-y-0.5 hover:border-ocean-200 hover:bg-ocean-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800'
            : 'flex w-full items-center justify-center gap-2 border-t border-sand-200 px-4 py-3 text-sm font-bold text-ocean-700 transition hover:bg-ocean-50 dark:border-slate-800 dark:hover:bg-slate-800'
        }
      >
        <MapPin className="h-4 w-4" aria-hidden="true" />
        Ver mapa completo
      </button>

      {modal}
    </>
  );
}
