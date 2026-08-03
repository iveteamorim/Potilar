'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function ChatWidget() {
  return (
    <div className="fixed bottom-20 right-6 z-[1000] sm:bottom-6">
      <Link
        href="/contato"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ocean-700 text-white shadow-lg transition hover:scale-105 hover:bg-ocean-800 focus:outline-none focus:ring-4 focus:ring-ocean-300 dark:focus:ring-ocean-900"
        aria-label="Abrir formulario de contato"
        title="Contato Potilar"
      >
        <MessageCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}
