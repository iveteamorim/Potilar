'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Property } from '@/data/properties';
import PropertyMap from '@/components/PropertyMapLoader';
import MapModalButton from '@/components/MapModalButton';

type Props = {
  items: Property[];
};

export default function AdvertiserMapToggle({ items }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-14 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-ocean-300 hover:bg-ocean-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
        aria-expanded={open}
        aria-controls="mapa"
      >
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {open ? 'Ocultar mapa' : 'Ver no mapa'}
      </button>

      {open && (
        <div
          id="mapa"
          className="relative mt-4 scroll-mt-28 overflow-hidden border border-sand-200 bg-white dark:border-slate-800"
        >
          <PropertyMap items={items} height="220px" mapActive />
          <MapModalButton items={items} floating />
        </div>
      )}
    </>
  );
}
