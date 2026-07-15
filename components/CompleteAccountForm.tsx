'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const FAVORITES_KEY = 'potilar:favorites';

function readFavoriteIds() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function syncLocalFavorites() {
  const favoriteIds = readFavoriteIds();
  await Promise.all(
    favoriteIds.map((listingId) =>
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, favorite: true })
      }).catch(() => null)
    )
  );
}

export default function CompleteAccountForm({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/mi-cuenta/favoritos';
  const initialEmail = searchParams.get('email') || userEmail || '';
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const authType = searchParams.get('type');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareSession() {
      const supabase = createClient();

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: authType === 'signup' ? 'signup' : 'email'
        });

        if (!cancelled && error) {
          setMessage(error.message);
          setSessionError(true);
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!cancelled && error) {
          setMessage(error.message);
          setSessionError(true);
        }
      } else {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!cancelled && error) {
            setMessage(error.message);
            setSessionError(true);
          }
        }
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!cancelled && !user) {
        setMessage('Não conseguimos confirmar sua sessão. Abra novamente o link enviado por email.');
        setSessionError(true);
      }

      if (!cancelled) {
        setSessionReady(true);
      }
    }

    prepareSession();

    return () => {
      cancelled = true;
    };
  }, [authType, code, tokenHash]);

  async function submit() {
    setMessage('');

    if (!name.trim()) {
      setMessage('Informe seu nome para completar a conta.');
      return;
    }

    if (password.length < 8) {
      setMessage('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (!acceptedTerms) {
      setMessage('Aceite os Termos de Uso e a Politica de Privacidade para continuar.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setMessage('Não conseguimos confirmar sua sessão. Abra novamente o link enviado por email.');
        setLoading(false);
        return;
      }

      const normalizedEmail = (userData.user.email || initialEmail).trim().toLowerCase();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
          full_name: name.trim(),
          account_type: 'particular'
        }
      });

      if (updateError) {
        setMessage(updateError.message);
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userData.user.id,
        email: normalizedEmail,
        full_name: name.trim(),
        account_type: 'particular',
        phone: null,
        advertiser_document: null,
        creci: null
      });

      if (
        profileError &&
        !profileError.message.toLowerCase().includes('account_type') &&
        !profileError.message.toLowerCase().includes('creci') &&
        !profileError.message.toLowerCase().includes('advertiser_document')
      ) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      await syncLocalFavorites();
      router.push(next.startsWith('/') ? next : '/mi-cuenta/favoritos');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card space-y-4 p-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100">
        {sessionError
          ? 'Não conseguimos confirmar seu email.'
          : sessionReady
            ? 'Email confirmado. Crie uma senha para voltar aos seus favoritos quando quiser.'
            : 'Confirmando seu email...'}
      </div>

      {initialEmail && (
        <div className="rounded-2xl bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {initialEmail}
        </div>
      )}

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nome"
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha, minimo 8 caracteres"
          className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 pr-12 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-sand-100 hover:text-ocean-700 dark:hover:bg-slate-800"
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-0.5"
        />
        <span>
          Li e aceito os{' '}
          <a href="/termos-de-uso" target="_blank" className="font-semibold text-ocean-700">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href="/privacidade" target="_blank" className="font-semibold text-ocean-700">
            Politica de Privacidade
          </a>
          .
        </span>
      </label>

      {message && (
        <div className="rounded-2xl bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading || !sessionReady || sessionError}
        className="w-full rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Aguarde...' : 'Criar conta e ver favoritos'}
      </button>
    </div>
  );
}
