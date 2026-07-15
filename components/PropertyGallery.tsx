'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PropertyGallery({ images }: { images: string[] }) {
  const safeImages = images.length > 0 ? images : ['/og-home.svg'];
  const [active, setActive] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  function previousImage() {
    setActive((current) => (current === 0 ? safeImages.length - 1 : current - 1));
  }

  function nextImage() {
    setActive((current) => (current === safeImages.length - 1 ? 0 : current + 1));
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={() => setIsOpen(true)} className="group text-left" aria-label="Abrir galeria de fotos">
        <motion.div
          key={safeImages[active]}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="relative h-[240px] w-full overflow-hidden rounded-2xl bg-sand-100 sm:h-[300px] lg:h-[360px]"
        >
          <Image src={safeImages[active]} alt="Foto do imóvel" fill className="object-cover transition duration-500 group-hover:scale-105" />
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white">
            {active + 1}/{safeImages.length} fotos
          </span>
        </motion.div>
      </button>

      <div className="flex gap-2 overflow-auto">
        {safeImages.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActive(index)}
            className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl border sm:h-16 sm:w-24 ${
              index === active ? 'border-ocean-500' : 'border-transparent'
            }`}
            aria-label={`Ver foto ${index + 1}`}
          >
            <Image src={image} alt="Miniatura do imóvel" fill className="object-cover" />
          </button>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/95 p-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Fechar galeria"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={previousImage}
            className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={nextImage}
            className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Proxima foto"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
            <div className="relative h-[82vh] w-full">
              <Image src={safeImages[active]} alt="Foto ampliada do imóvel" fill className="object-contain" />
            </div>
          </div>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
            {active + 1} de {safeImages.length}
          </p>
        </div>
      )}
    </div>
  );
}
