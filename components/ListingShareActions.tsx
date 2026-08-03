'use client';

import { useState } from 'react';
import { Check, Copy, Printer } from 'lucide-react';

type Props = {
  publicUrl: string;
};

export default function ListingShareActions({ publicUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full bg-ocean-700 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-ocean-800"
      >
        <Printer className="h-4 w-4" />
        Imprimir A4
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-2 rounded-full border border-ocean-200 bg-white px-5 py-3 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Link copiado' : 'Copiar link'}
      </button>
    </div>
  );
}
