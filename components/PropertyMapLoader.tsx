'use client';

import dynamic from 'next/dynamic';
import type { Property } from '@/data/properties';

type Props = {
  items: Property[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  mapActive?: boolean;
  showLegend?: boolean;
};

function MapLoadingPlaceholder({ height = '360px' }: { height?: string }) {
  return (
    <div
      style={{ height }}
      className="flex animate-pulse flex-col items-center justify-center gap-2 rounded-3xl border border-sand-200 bg-sand-50 dark:border-slate-800 dark:bg-slate-900"
      role="status"
      aria-label="Carregando mapa"
    >
      <div className="h-8 w-8 rounded-full bg-sand-200 dark:bg-slate-700" />
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">Carregando mapa...</span>
    </div>
  );
}

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />
});

export default function PropertyMapLoader({ height = '360px', ...props }: Props) {
  return (
    <div style={{ minHeight: height }}>
      <PropertyMap height={height} {...props} />
    </div>
  );
}
