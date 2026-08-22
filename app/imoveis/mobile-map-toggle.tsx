'use client';

import { useState } from 'react';
import { Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  children: React.ReactNode;
  count?: number;
  closedLabel?: string;
  openLabel?: string;
};

export default function MobileMapToggle({
  children,
  count,
  closedLabel = 'Mostrar mapa',
  openLabel = 'Ocultar mapa',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-ocean-200 bg-ocean-50 px-4 py-3 text-sm font-semibold text-ocean-800 transition hover:bg-ocean-100 dark:border-ocean-800 dark:bg-ocean-950 dark:text-ocean-200 dark:hover:bg-ocean-900"
        aria-expanded={open}
      >
        <Map className="h-4 w-4" aria-hidden="true" />
        {open ? openLabel : closedLabel}
        {typeof count === 'number' && !open && (
          <span className="rounded-full bg-ocean-700 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mapa-mobile"
            className="mt-4 scroll-mt-24 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
