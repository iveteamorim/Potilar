'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PropertyGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-4">
      <motion.div
        key={images[active]}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="relative h-80 w-full overflow-hidden rounded-3xl"
      >
        <Image src={images[active]} alt="Foto do imóvel" fill className="object-cover" />
      </motion.div>
      <div className="flex gap-3 overflow-auto">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActive(index)}
            className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-2xl border ${
              index === active ? 'border-ocean-500' : 'border-transparent'
            }`}
            aria-label={`Ver foto ${index + 1}`}
          >
            <Image src={image} alt="Miniatura do imóvel" fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
