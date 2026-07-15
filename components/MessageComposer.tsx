'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

type Props = {
  mode: 'reply' | 'message';
  listingId?: string;
  ownerId?: string;
  conversationId?: string;
  messageId?: string;
  senderName?: string;
  senderEmail?: string;
};

export default function MessageComposer({ mode, listingId, ownerId, conversationId, messageId, senderName, senderEmail }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = message.trim();
    if (text.length < 2) {
      setStatus('Escreva uma mensagem.');
      return;
    }

    setLoading(true);
    setStatus('');

    const body =
      mode === 'reply'
        ? { messageId, reply: text }
        : { listingId, ownerId, conversationId, name: senderName, email: senderEmail, message: text };

    try {
      const response = await fetch(mode === 'reply' ? '/api/messages/reply' : '/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? 'Não foi possível enviar.');
      }

      setMessage('');
      setStatus('Enviado');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível enviar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-sand-100 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950 sm:px-4 sm:py-4">
      <div className="flex min-w-0 items-end gap-2">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={1}
          minLength={2}
          maxLength={2000}
          className="min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-sand-200 px-3.5 py-2.5 text-sm outline-none focus:border-ocean-700 dark:border-slate-700 dark:bg-slate-900 sm:min-h-12 sm:px-4 sm:py-3"
          placeholder="Escreva sua mensagem"
        />
        <button
          type="submit"
          disabled={loading || message.trim().length < 2}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean-700 text-white disabled:opacity-60 sm:h-12 sm:w-12"
          aria-label="Enviar mensagem"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {status && (
        <p className={`mt-2 text-xs font-semibold ${status === 'Enviado' ? 'text-green-700' : 'text-red-600'}`}>
          {loading ? 'Enviando...' : status}
        </p>
      )}
    </form>
  );
}
