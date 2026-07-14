'use client';

import { Copy, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function ShareButtons({ title, url, compact = false }: { title: string; url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const message = `Olha este imovel na Potilar: ${title} ${url}`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (compact) {
    return (
      <>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-green-200 px-3 py-2 text-center font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-900/60 dark:text-green-300 dark:hover:bg-green-950/30"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Compartilhar
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ocean-200 px-3 py-2 text-center font-semibold text-ocean-700 transition hover:bg-ocean-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {copied ? 'Link copiado' : 'Copiar link'}
        </button>
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Compartilhe este anuncio</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
        Envie para WhatsApp ou copie o link para divulgar.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Compartilhar
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ocean-200 px-4 py-3 text-sm font-semibold text-ocean-700 dark:border-slate-700 dark:text-slate-200"
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
        {copied ? 'Link copiado' : 'Copiar link'}
      </button>
      </div>
    </div>
  );
}
