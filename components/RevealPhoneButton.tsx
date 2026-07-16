'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';

function formatPhoneDisplay(digits: string) {
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

type Props = {
  phone: string;
  label?: string;
  className?: string;
};

export default function RevealPhoneButton({ phone, label = 'Ver telefone', className = '' }: Props) {
  const [revealed, setRevealed] = useState(false);
  const digits = phone.replace(/\D/g, '');
  const display = formatPhoneDisplay(digits);

  if (revealed) {
    return (
      <p className={`flex items-center gap-3 text-lg font-semibold text-ocean-800 ${className}`}>
        <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{display}</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className={`flex items-center gap-3 text-left text-lg font-semibold text-ocean-800 transition hover:text-ocean-900 ${className}`}
    >
      <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
      {label}
    </button>
  );
}
