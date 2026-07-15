'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCheck, MessageSquare, Send, UserPlus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  listingId: string;
  ownerId: string;
  title: string;
  label?: string;
  buttonClassName?: string;
};

export default function ListingMessageButton({ listingId, ownerId, title, label = 'Perguntar por chat', buttonClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Olá, tenho interesse neste imóvel. Ainda está disponível?`);
  const [status, setStatus] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loginHref, setLoginHref] = useState('/login?intent=chat&mode=signup');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(Boolean(user));
      if (user?.email) setEmail(user.email);
      const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name;
      if (typeof fullName === 'string') setName(fullName);
    });
    if (typeof window !== 'undefined') {
      const next = `${window.location.pathname}${window.location.search}`;
      setLoginHref(`/login?intent=chat&mode=signup&next=${encodeURIComponent(next)}`);
    }
  }, []);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, ownerId, name: name || email.split('@')[0] || 'Visitante', email, message })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Não foi possível enviar a mensagem.');
      }

      setSentMessage(message);
      setStatus('Enviado');
      setMessage('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          'inline-flex items-center justify-center gap-2 rounded-2xl border border-ocean-200 px-4 py-3 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
        }
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 py-5 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-sand-100 px-5 py-4 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">Perguntar ao anunciante</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-200 text-slate-600 dark:border-slate-700 dark:text-slate-200"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {hasSession ? (
              <div className="bg-sand-50 dark:bg-slate-900">
                <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5">
                  {sentMessage && (
                    <div className="ml-auto max-w-[84%] rounded-2xl rounded-tr-md bg-ocean-700 px-4 py-3 text-sm leading-6 text-white shadow-sm">
                      <p>{sentMessage}</p>
                      <p className="mt-2 flex items-center justify-end gap-1 text-[11px] font-semibold text-ocean-100">
                        {status || 'Enviado'}
                        <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      </p>
                    </div>
                  )}

                </div>

                <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-sand-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Escreva sua mensagem"
                    className="min-h-12 flex-1 resize-none rounded-2xl border border-sand-200 px-4 py-3 text-sm outline-none focus:border-ocean-700 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={loading || message.trim().length < 10}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ocean-700 text-white disabled:opacity-60"
                    aria-label="Enviar mensagem"
                  >
                    <Send className="h-5 w-5" aria-hidden="true" />
                  </button>
                </form>
                {status && !sentMessage && (
                  <p className="border-t border-sand-100 bg-white px-5 pb-4 text-xs font-semibold text-red-600 dark:border-slate-800 dark:bg-slate-950">
                    {status}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4 px-5 py-5">
                <Link
                  href={loginHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ocean-700 px-4 py-3 text-sm font-bold text-ocean-700 transition hover:bg-ocean-50 dark:border-ocean-300 dark:text-ocean-100 dark:hover:bg-slate-900"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Criar conta para conversar
                </Link>
                <div className="border-t border-sand-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Referência do anúncio</p>
                  <p className="mt-1 font-semibold text-ocean-700 dark:text-ocean-200">{listingId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
