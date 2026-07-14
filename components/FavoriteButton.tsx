'use client';

import { Heart, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';

const FAVORITES_KEY = 'potilar:favorites';

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('potilar:favorites-changed'));
}

export function getFavoriteIds() {
  if (typeof window === 'undefined') return [];
  return readFavorites();
}

async function syncRemoteFavorites() {
  try {
    const response = await fetch('/api/favorites', { cache: 'no-store' });
    if (!response.ok) return;

    const payload = (await response.json()) as { favorites?: string[] };
    if (!Array.isArray(payload.favorites)) return;

    const local = readFavorites();
    const merged = Array.from(new Set([...local, ...payload.favorites]));
    writeFavorites(merged);
  } catch {
    // Mantem favoritos locais quando a conta remota nao estiver disponivel.
  }
}

async function persistFavorite(listingId: string, favorite: boolean) {
  try {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, favorite })
    });
  } catch {
    // Favorito local continua funcionando offline.
  }
}

export default function FavoriteButton({
  propertyId,
  title,
  variant = 'floating',
  floatingClassName
}: {
  propertyId: string;
  title: string;
  variant?: 'floating' | 'inline';
  floatingClassName?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [favoriteEmailSent, setFavoriteEmailSent] = useState(false);
  const [existingAccountEmail, setExistingAccountEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function sync() {
      setIsFavorite(readFavorites().includes(propertyId));
    }

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('potilar:favorites-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('potilar:favorites-changed', sync);
    };
  }, [propertyId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAuthenticated(true);
        void syncRemoteFavorites();
        return;
      }
      setIsAuthenticated(false);
    });
  }, []);

  function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const favorites = readFavorites();
    const nextFavorite = !favorites.includes(propertyId);

    if (nextFavorite && isAuthenticated === false) {
      setShowSaveModal(true);
      return;
    }

    const next = nextFavorite ? [...favorites, propertyId] : favorites.filter((id) => id !== propertyId);

    writeFavorites(next);
    setIsFavorite(nextFavorite);
    void persistFavorite(propertyId, nextFavorite);
  }

  function closeModal() {
    setShowSaveModal(false);
    setStatus('');
    setExistingAccountEmail('');
  }

  async function saveWithEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatus('Informe seu email para guardar o favorito.');
      return;
    }

    if (!acceptedTerms) {
      setStatus('Aceite os Termos de Uso e a Politica de Privacidade para continuar.');
      return;
    }

    const favorites = readFavorites();
    if (!favorites.includes(propertyId)) {
      writeFavorites([...favorites, propertyId]);
      setIsFavorite(true);
    }

    const completeAccountPath = `/completar-conta?intent=favorite&next=${encodeURIComponent('/mi-cuenta/favoritos')}&email=${encodeURIComponent(normalizedEmail)}`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(completeAccountPath)}`;

    setLoading(true);
    setStatus('');
    setExistingAccountEmail('');

    try {
      const supabase = createClient();
      const { data: contactExists, error: contactCheckError } = await supabase.rpc('profile_contact_exists', {
        candidate_email: normalizedEmail,
        candidate_phone: null,
        candidate_document: null
      });

      if (!contactCheckError && contactExists) {
        setExistingAccountEmail(normalizedEmail);
        setStatus('Ja existe uma conta com este email.');
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setFavoriteEmailSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleFavorite}
        aria-label={isFavorite ? `Remover ${title} dos favoritos` : `Salvar ${title} nos favoritos`}
        className={`${
          variant === 'floating'
            ? floatingClassName ?? 'absolute bottom-3 right-3 z-20 h-10 w-10'
            : 'h-11 px-4'
        } flex items-center justify-center gap-2 rounded-full shadow-soft transition ${
          isFavorite ? 'bg-red-500 text-white' : 'bg-white/95 text-slate-700 hover:text-red-500'
        }`}
      >
        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
        {variant === 'inline' && <span className="text-sm font-semibold">{isFavorite ? 'Favorito' : 'Salvar favorito'}</span>}
      </button>

      {showSaveModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`save-favorite-${propertyId}`}
          onClick={closeModal}
        >
          <form
            onSubmit={saveWithEmail}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl dark:bg-slate-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500" aria-hidden="true" />
                <h2 id={`save-favorite-${propertyId}`} className="text-2xl font-semibold text-slate-950 dark:text-white">
                  Guardar favorito
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-sand-100 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {favoriteEmailSent ? (
              <>
                <div className="mt-6 rounded-lg bg-sun-50 px-4 py-4 text-ocean-900 dark:bg-slate-900 dark:text-slate-100">
                  <p className="text-xl font-semibold">So falta confirmar seu email</p>
                </div>
                <p className="mt-5 text-base leading-7 text-slate-700 dark:text-slate-300">
                  Email enviado para <span className="font-semibold">{email.trim().toLowerCase()}</span>. Confirme seu email.
                </p>
                <button type="button" onClick={closeModal} className="mt-6 rounded-lg border border-sand-300 px-6 py-3 text-base font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                  Entendido
                </button>
              </>
            ) : (
              <>
                <p className="mt-6 text-base leading-7 text-slate-700 dark:text-slate-300">
                  Informe seu email para guardar favoritos.
                </p>

                <label className="mt-6 block text-sm font-bold text-slate-950 dark:text-white" htmlFor={`favorite-email-${propertyId}`}>
                  Seu email
                </label>
                <input
                  id={`favorite-email-${propertyId}`}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-ocean-700 dark:border-slate-700 dark:bg-slate-900"
                  autoComplete="email"
                />

                {email.trim() && (
                  <div className="mt-4 rounded-lg bg-sand-50 px-4 py-3 text-center text-base font-bold text-green-700 dark:bg-slate-900 dark:text-green-300">
                    {email.trim().toLowerCase()}
                  </div>
                )}

                <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Aceito os{' '}
                    <a href="/termos-de-uso" target="_blank" className="font-semibold underline">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="/privacidade" target="_blank" className="font-semibold underline">
                      Politica de Privacidade
                    </a>
                    .
                  </span>
                </label>

                {status && (
                  <p className={`mt-3 text-sm font-semibold ${existingAccountEmail ? 'text-ocean-700 dark:text-ocean-200' : 'text-red-600 dark:text-red-300'}`}>
                    {status}
                  </p>
                )}

                <button type="submit" disabled={loading} className="mt-6 w-full rounded-lg bg-ocean-700 px-5 py-4 text-base font-bold text-white hover:bg-ocean-800 disabled:opacity-60">
                  {loading ? 'Enviando...' : 'Guardar favorito'}
                </button>

                <a
                  href={`/login?next=/mi-cuenta/favoritos${existingAccountEmail ? `&email=${encodeURIComponent(existingAccountEmail)}` : ''}`}
                  className="mt-3 block text-center text-xs font-semibold text-ocean-700 hover:underline dark:text-ocean-200"
                >
                  Ja tenho uma conta
                </a>
              </>
            )}
          </form>
        </div>,
        document.body
      )}
    </>
  );
}
