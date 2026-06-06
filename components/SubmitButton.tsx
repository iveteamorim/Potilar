'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

type Props = {
  children: ReactNode;
  pendingText?: string;
  className?: string;
};

export default function SubmitButton({ children, pendingText = 'Salvando...', className }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        'rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ocean-800 disabled:cursor-wait disabled:opacity-70'
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}
