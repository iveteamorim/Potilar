'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

type QuickOption =
  | { label: string; href: string; message?: never }
  | { label: string; message: string; href?: never };

const quickOptions: QuickOption[] = [
  {
    label: 'Quero anunciar meu imovel',
    href: '/login?next=/anunciar'
  },
  {
    label: 'Quero ver imoveis',
    href: '/imoveis'
  },
  {
    label: 'Falar com atendimento',
    message: 'Ola, vim pelo site Potilar e quero falar com atendimento.'
  }
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  function openWhatsApp(message: string) {
    const url = `https://wa.me/5521969724141?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="fixed bottom-20 right-6 z-[1000] sm:bottom-6">
      {open && (
        <div className="mb-3 w-72 overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Atendimento Potilar</p>
              <p className="text-xs text-slate-500">Como podemos ajudar?</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate-500 hover:text-slate-700"
              aria-label="Fechar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 px-4 py-4">
            {quickOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  if (option.href) {
                    window.location.href = option.href;
                    return;
                  }

                  if (option.message) {
                    openWhatsApp(option.message);
                  }
                }}
                className="w-full rounded-2xl border border-sand-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-sand-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ocean-600 text-white shadow-lg transition hover:scale-105"
        aria-label="Abrir atendimento"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
