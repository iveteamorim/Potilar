'use client';

import { MessageCircle } from 'lucide-react';

const whatsappHref =
  'https://wa.me/5521969724141?text=Ola%2C%20vim%20pelo%20site%20Potilar%20e%20quero%20falar%20com%20atendimento.';

export default function ChatWidget() {
  return (
    <div className="fixed bottom-20 right-6 z-[1000] sm:bottom-6">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:scale-105 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-900"
        aria-label="Falar com atendimento no WhatsApp"
        title="WhatsApp Potilar"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
