'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Property } from '@/data/properties';
import PropertyCard from './PropertyCard';

export default function FeaturedCarousel({ items }: { items: Property[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    setCanScrollLeft(scroller.scrollLeft > 8);
    setCanScrollRight(maxScroll > 8 && scroller.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateScrollState();
    scroller.addEventListener('scroll', updateScrollState, { passive: true });
    const resize = new ResizeObserver(updateScrollState);
    resize.observe(scroller);

    return () => {
      scroller.removeEventListener('scroll', updateScrollState);
      resize.disconnect();
    };
  }, [items.length, updateScrollState]);

  function scroll(direction: 'left' | 'right') {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const step = Math.min(scroller.clientWidth * 0.85, 280);
    scroller.scrollBy({
      left: direction === 'right' ? step : -step,
      behavior: 'smooth'
    });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="mt-6 flex snap-x gap-2.5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((property) => (
          <div key={property.id} className="flex w-[68vw] max-w-[258px] shrink-0 snap-start self-stretch sm:w-[248px]">
            <PropertyCard property={property} variant="compact" />
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 top-[42%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-sand-200 bg-white/95 text-slate-700 shadow-soft transition hover:border-ocean-300 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
          aria-label="Ver imóveis anteriores"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 top-[42%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ocean-600 text-white shadow-soft transition hover:bg-ocean-700"
          aria-label="Ver mais imóveis em destaque"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
