'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

type PaymentKind = 'listing' | 'seasonal' | 'highlight' | 'renewal30' | 'renewal60';

type Props = {
  listingId: string;
  kind: PaymentKind;
  label?: string;
  enableCoupon?: boolean;
};

export default function ListingMercadoPagoButton({ listingId, kind, label = 'Pagar com Mercado Pago', enableCoupon = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');

  async function handleClick() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/listing-payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, kind, couponCode: enableCoupon ? couponCode : '' })
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
    <div className="space-y-3">
      {enableCoupon && (
        <div className="rounded-xl border border-sand-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <label htmlFor="listing-coupon" className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Cupom
          </label>
          <input
            id="listing-coupon"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="Digite seu cupom"
            className="mt-2 h-11 w-full rounded-lg border border-sand-200 px-3 text-sm font-semibold uppercase outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-800 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ocean-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
        {loading ? 'Abrindo pagamento...' : label}
      </button>
      {message && <p className="text-center text-xs font-semibold text-red-600">{message}</p>}
    </div>
  );
}
