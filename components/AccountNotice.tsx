'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  children: ReactNode;
  tone?: 'success' | 'error';
};

export default function AccountNotice({ children, tone = 'success' }: Props) {
  const router = useRouter();
  const isError = tone === 'error';

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-green-200 bg-green-50 text-green-700'
      }`}
    >
      <p>{children}</p>
      <button
        type="button"
        onClick={() => router.replace('/mi-cuenta', { scroll: false })}
        className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${
          isError ? 'border-red-300 text-red-700' : 'border-green-300 text-green-700'
        }`}
      >
        OK
      </button>
    </div>
  );
}
