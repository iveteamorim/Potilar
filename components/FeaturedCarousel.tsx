'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import type { Property } from '@/data/properties';
import PropertyCard from './PropertyCard';

export default function FeaturedCarousel({ items }: { items: Property[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 'left' | 'right') {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction === 'right' ? scroller.clientWidth * 0.85 : -scroller.clientWidth * 0.85,
      behavior: 'smooth'
    });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="mt-6 flex snap-x gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((property) => (
          <div key={property.id} className="w-[82vw] shrink-0 snap-start sm:w-[360px]">
            <PropertyCard property={property} />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-slate-700 shadow-soft transition hover:border-ocean-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Ver imoveis anteriores"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-600 text-white shadow-soft transition hover:bg-ocean-700"
            aria-label="Ver mais imoveis em destaque"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
