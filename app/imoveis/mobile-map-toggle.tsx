'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileMapToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600"
      >
        {open ? 'Ocultar mapa' : 'Mostrar mapa'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mt-4 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
