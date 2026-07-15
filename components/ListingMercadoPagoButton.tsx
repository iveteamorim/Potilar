'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';

type PaymentKind = 'listing' | 'seasonal' | 'highlight' | 'renewal30' | 'renewal60';

type Props = {
  listingId: string;
  kind: PaymentKind;
  label?: string;
};

export default function ListingMercadoPagoButton({ listingId, kind, label = 'Pagar com Mercado Pago' }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleClick() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/listing-payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, kind })
      });
      const payload = await response.json();

      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/mi-cuenta/pagar/${listingId}`)}`;
        return;
      }

      if (!response.ok || !payload.initPoint) {
        setMessage(payload.error ?? 'Não foi possível abrir o pagamento agora.');
        return;
      }

      window.location.href = payload.initPoint;
    } catch {
      setMessage('Não foi possível abrir o pagamento agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-ocean-700/15 transition hover:-translate-y-0.5 hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CreditCard className="h-5 w-5" aria-hidden="true" />
        {loading ? 'Abrindo pagamento...' : label}
      </button>
      {message && <p className="text-center text-xs font-semibold text-red-600">{message}</p>}
    </div>
  );
}
