'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { BASE_URL } from '@/lib/config';
import type { ProfessionalPlanId } from '@/lib/plans';
import { buildPublicProfileSlug } from '@/lib/publicProfile';
import { createClient } from '@/lib/supabase/client';

type AccountType = 'particular' | 'corretor' | 'imobiliaria';

function cleanDocument(value: string) {
  return value.replace(/\D/g, '');
}

function formatCpf(value: string) {
  return cleanDocument(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatCnpj(value: string) {
  return cleanDocument(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatBrazilPhone(value: string) {
  const digits = cleanDocument(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} ${digits.slice(2)}`;
}

function isValidBrazilMobilePhone(value: string) {
  const digits = cleanDocument(value);
  return digits.length === 11 && digits[2] === '9';
}

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

function hasSequentialDigits(value: string) {
  const ascending = '01234567890123456789';
  const descending = '98765432109876543210';
  return ascending.includes(value) || descending.includes(value);
}

function isValidCpf(value: string) {
  const digits = cleanDocument(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits) || hasSequentialDigits(digits)) return false;

  const calculateDigit = (length: number, factor: number) => {
    const sum = digits
      .slice(0, length)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(9, 10) === Number(digits[9]) && calculateDigit(10, 11) === Number(digits[10]);
}

function isValidCnpj(value: string) {
  const digits = cleanDocument(value);
  if (digits.length !== 14 || hasRepeatedDigits(digits) || hasSequentialDigits(digits)) return false;

  const calculateDigit = (weights: number[]) => {
    const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, ...firstWeights];

  return calculateDigit(firstWeights) === Number(digits[12]) && calculateDigit(secondWeights) === Number(digits[13]);
}

function getFriendlyAuthMessage(value: string) {
  const message = value.toLowerCase();
  if (message.includes('invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (message.includes('user already registered') || message.includes('already registered')) return 'Ja existe uma conta com este email.';
  return value;
}

function getRequestedPlan(value: string | null): ProfessionalPlanId | null {
  if (value === 'corretor' || value === 'imobiliaria' || value === 'plus') return value;
  return null;
}

function getAccountTypeFromRequest(plan: ProfessionalPlanId | null, requestedAccount: string | null): AccountType {
  if (requestedAccount === 'corretor' || requestedAccount === 'imobiliaria') return requestedAccount;
  if (plan === 'corretor') return 'corretor';
  if (plan === 'imobiliaria' || plan === 'plus') return 'imobiliaria';
  return 'particular';
}

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/mi-cuenta';
  const initialEmail = searchParams.get('email') ?? '';
  const intent = searchParams.get('intent');
  const requestedMode = searchParams.get('mode');
  const requestedAccount = searchParams.get('account');
  const requestedPlan = getRequestedPlan(searchParams.get('plan'));
  const requestedBillingMode = searchParams.get('billing') === 'manual' ? 'manual' : 'automatic';
  const isProfessionalPlanFlow = Boolean(requestedPlan);
  const isBuyerIntent = intent === 'favorite' || intent === 'alert' || intent === 'chat';
  const confirmed = searchParams.get('confirmed') === '1';
  const invalidSession = searchParams.get('session') === 'invalid';
  const reset = searchParams.get('reset') === '1';
  const recoveryCode = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const authType = searchParams.get('type');
  const [hashRecovery, setHashRecovery] = useState(false);
  const isRecovery = reset || authType === 'recovery' || Boolean(recoveryCode) || Boolean(tokenHash) || hashRecovery;
  const [mode, setMode] = useState<'login' | 'signup'>(requestedMode === 'signup' ? 'signup' : 'login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(
    getAccountTypeFromRequest(requestedPlan, requestedAccount)
  );
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [creci, setCreci] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState('');
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const cpfDigits = cleanDocument(cpf);
  const cnpjDigits = cleanDocument(cnpj);
  const cpfHasLengthError = cpfDigits.length > 0 && cpfDigits.length < 11;
  const cnpjHasLengthError = cnpjDigits.length > 0 && cnpjDigits.length < 14;
  const phoneHasError = phone.length > 0 && !isValidBrazilMobilePhone(phone);

  async function startProfessionalCheckout(planId: ProfessionalPlanId) {
    const response = await fetch('/api/professional-plans/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, billingMode: requestedBillingMode })
    });
    const payload = await response.json();

    if (!response.ok || !payload.initPoint) {
      setMessage(payload.error ?? 'Conta criada, mas não foi possível abrir o pagamento agora. Entre em Planos e tente novamente.');
      setLoading(false);
      return;
    }

    window.location.href = payload.initPoint;
  }

  function getAuthOrigin() {
    if (typeof window === 'undefined') return BASE_URL;
    if (window.location.hostname === 'localhost') return BASE_URL;
    return window.location.origin;
  }

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('type') === 'recovery' || hash.get('access_token')) {
      setHashRecovery(true);
    }
  }, []);

  useEffect(() => {
    if (!isRecovery) return;

    let cancelled = false;

    async function prepareRecoverySession() {
      const supabase = createClient();

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });
        if (!cancelled && error) {
          setMessage(error.message);
        }
        return;
      }

      if (recoveryCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(recoveryCode);
        if (!cancelled && error) {
          setMessage(error.message);
        }
        return;
      }

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
        }
      }
    }

    prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [isRecovery, recoveryCode, tokenHash]);

  async function sendPasswordReset() {
    setMessage('');
    setSignupEmailSent(false);
    setResetEmailSent(false);

    if (!email) {
      setMessage('Informe seu email para recuperar a senha.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const authOrigin = getAuthOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${authOrigin}/login?reset=1`
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setResetEmailSent(true);
    setMessage(`Enviamos um email para ${email}. Abra o link para criar uma nova senha.`);
    setLoading(false);
  }

  async function submit() {
    setMessage('');
    setSignupEmailSent(false);
    setResetEmailSent(false);
    setLoading(true);
    const supabase = createClient();
    const authOrigin = getAuthOrigin();

    if (isRecovery) {
      if (!password || password.length < 6) {
        setMessage('Informe uma nova senha com pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(getFriendlyAuthMessage(error.message));
        setLoading(false);
        return;
      }

      setMessage('Senha atualizada. Agora entre com sua nova senha.');
      setLoading(false);
      router.push('/login?confirmed=1');
      router.refresh();
      return;
    }

    if (mode === 'signup') {
      const normalizedEmail = email.trim().toLowerCase();
      const fullName = isBuyerIntent
        ? normalizedEmail.split('@')[0] || 'Buscador Potilar'
        : [firstName, lastName].map((item) => item.trim()).filter(Boolean).join(' ');

      if (!normalizedEmail) {
        setMessage('Informe seu email para criar sua conta.');
        setLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        setMessage('Informe uma senha com pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }

      if (passwordConfirm !== password) {
        setMessage('As senhas não coincidem.');
        setLoading(false);
        return;
      }

      if (!isBuyerIntent && (!firstName.trim() || !lastName.trim())) {
        setMessage('Informe nome e sobrenome para criar sua conta.');
        setLoading(false);
        return;
      }

      if (!isBuyerIntent && !isValidBrazilMobilePhone(phone)) {
        setMessage('Informe um WhatsApp valido.');
        setLoading(false);
        return;
      }

      if (!isBuyerIntent && accountType === 'particular' && !isValidCpf(cpf)) {
        setMessage('Informe um CPF valido para criar sua conta.');
        setLoading(false);
        return;
      }

      if (!isBuyerIntent && accountType === 'corretor' && (!isValidCpf(cpf) || !creci.trim())) {
        setMessage('Informe CPF valido e CRECI para criar conta de corretor.');
        setLoading(false);
        return;
      }

      if (!isBuyerIntent && accountType === 'imobiliaria' && (!isValidCnpj(cnpj) || !creci.trim())) {
        setMessage('Informe CNPJ valido e CRECI para criar conta de imobiliaria.');
        setLoading(false);
        return;
      }

      const accountTypeToSave: AccountType = isBuyerIntent ? 'particular' : accountType;
      const advertiserDocument = isBuyerIntent ? null : accountType === 'imobiliaria' ? cleanDocument(cnpj) : cleanDocument(cpf);
      const normalizedPhone = isBuyerIntent ? null : cleanDocument(phone);

      if (!acceptedTerms) {
        setMessage('Aceite os Termos de Uso e a Politica de Privacidade para criar sua conta.');
        setLoading(false);
        return;
      }

      try {
        const { data: contactExists, error: contactCheckError } = await supabase.rpc('profile_contact_exists', {
          candidate_email: normalizedEmail,
          candidate_phone: normalizedPhone,
          candidate_document: advertiserDocument
        });

        if (!contactCheckError && contactExists) {
          setMessage('Ja existe uma conta com este email, WhatsApp ou documento.');
          setLoading(false);
          return;
        }
      } catch {
        // Supabase Auth still prevents duplicate emails if the helper SQL has not been applied yet.
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${authOrigin}/auth/callback?next=${encodeURIComponent('/login?confirmed=1')}`,
          data: {
            full_name: fullName,
            phone: normalizedPhone,
            account_type: accountTypeToSave,
            advertiser_document: advertiserDocument,
            creci: isBuyerIntent ? null : creci.trim(),
            potilar_email_pending: true
          }
        }
      });

      if (error) {
        setMessage(getFriendlyAuthMessage(error.message));
        setLoading(false);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: normalizedEmail,
          full_name: fullName,
          phone: normalizedPhone,
          account_type: accountTypeToSave,
          advertiser_document: advertiserDocument,
          creci: isBuyerIntent ? null : creci.trim() || null,
          public_slug:
            !isBuyerIntent && (accountType === 'corretor' || accountType === 'imobiliaria')
              ? buildPublicProfileSlug(fullName, data.user.id)
              : null,
          company_name: !isBuyerIntent && accountType === 'imobiliaria' ? fullName : null
        });

        if (
          profileError &&
          !profileError.message.toLowerCase().includes('permission denied') &&
          !profileError.message.toLowerCase().includes('account_type') &&
          !profileError.message.toLowerCase().includes('creci') &&
          !profileError.message.toLowerCase().includes('advertiser_document') &&
          !profileError.message.toLowerCase().includes('public_slug') &&
          !profileError.message.toLowerCase().includes('company_name') &&
          !profileError.message.toLowerCase().includes('bio')
        ) {
          setMessage(profileError.message);
          setLoading(false);
          return;
        }
      }

      await supabase.auth.signOut();
      setSignupEmailSent(true);
      setMessage('Enviamos um email de confirmação. Abra o link para ativar sua conta.');
      setLoading(false);
      return;
    }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(getFriendlyAuthMessage(error.message));
      setLoading(false);
      return;
    }

    if (!signInData.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setMessage('Confirme sua conta clicando no link enviado ao seu email.');
      setLoading(false);
      return;
    }

    if (signInData.user.user_metadata?.potilar_email_pending === true) {
      await supabase.auth.updateUser({
        data: {
          ...signInData.user.user_metadata,
          potilar_email_pending: false,
          potilar_email_confirmed_at: new Date().toISOString()
        }
      });
    }

    if (signInData.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).maybeSingle();
      let currentProfile = profile;

      if (!currentProfile) {
        const metadata = signInData.user.user_metadata ?? {};
        const { data: createdProfile, error: createProfileError } = await supabase
          .from('profiles')
          .upsert({
            id: signInData.user.id,
            email: signInData.user.email ?? email.trim().toLowerCase(),
            full_name: metadata.full_name ?? signInData.user.email?.split('@')[0] ?? 'Usuário Potilar',
            phone: metadata.phone ?? null,
            account_type: metadata.account_type ?? 'particular',
            advertiser_document: metadata.advertiser_document ?? null,
            creci: metadata.creci ?? null,
            public_slug: null,
            company_name: null
          })
          .select('role')
          .maybeSingle();

        if (createProfileError || !createdProfile) {
          await supabase.auth.signOut();
          setMessage('Não foi possível preparar sua conta. Tente entrar novamente em alguns minutos.');
          setLoading(false);
          return;
        }

        currentProfile = createdProfile;
      }

      if (currentProfile?.role === 'admin') {
        window.dispatchEvent(new Event('potilar:auth-changed'));
        router.push('/admin');
        router.refresh();
        return;
      }
    }

    if (requestedPlan) {
      await startProfessionalCheckout(requestedPlan);
      return;
    }

    window.dispatchEvent(new Event('potilar:auth-changed'));
    router.push(next);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-[2rem] border border-sand-300/90 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-white/80 sm:space-y-4 sm:p-6 lg:p-7 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800">
      <div className="grid grid-cols-2 border-b border-sand-200 text-sm font-semibold dark:border-slate-800">
        <button type="button" onClick={() => setMode('login')} disabled={isRecovery} className={`border-b-2 px-3 py-2.5 transition sm:px-4 sm:py-3 ${mode === 'login' ? 'border-ocean-600 text-ocean-700' : 'border-transparent text-slate-500 hover:text-slate-800'} disabled:cursor-not-allowed disabled:opacity-60`}>
          Entrar
        </button>
        <button type="button" onClick={() => setMode('signup')} disabled={isRecovery} className={`border-b-2 px-3 py-2.5 transition sm:px-4 sm:py-3 ${mode === 'signup' ? 'border-ocean-600 text-ocean-700' : 'border-transparent text-slate-500 hover:text-slate-800'} disabled:cursor-not-allowed disabled:opacity-60`}>
          {isProfessionalPlanFlow ? 'Criar conta' : 'Começar grátis'}
        </button>
      </div>

      {isRecovery && (
        <div className="rounded-2xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm font-semibold text-ocean-800 dark:border-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100">
          Digite sua nova senha.
        </div>
      )}

      {mode === 'signup' && !isRecovery && (
        <div className="grid gap-3">
          {isBuyerIntent ? (
            <p className="rounded-xl bg-sand-50 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:font-normal">
              Crie uma conta para guardar favoritos e alertas.
            </p>
          ) : (
            <>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nome" className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Sobrenome" className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
              <div>
                <input
                  value={phone}
                  onChange={(event) => setPhone(formatBrazilPhone(event.target.value))}
                  placeholder="WhatsApp"
                  inputMode="numeric"
                  maxLength={12}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm dark:bg-slate-900 ${
                    phoneHasError
                      ? 'border-red-300 text-red-700 focus:border-red-500 focus:outline-none dark:border-red-800 dark:text-red-200'
                      : 'border-sand-200 dark:border-slate-700'
                  }`}
                />
                {phoneHasError && (
                  <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
                    WhatsApp invalido.
                  </p>
                )}
              </div>
              {isProfessionalPlanFlow ? (
                <div className="rounded-2xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm font-semibold text-ocean-900 dark:border-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100">
                  Conta profissional: {accountType === 'corretor' ? 'Corretor' : 'Imobiliaria'}
                </div>
              ) : (
                <div className="grid grid-cols-3 rounded-2xl bg-sand-100 p-1 text-xs font-semibold dark:bg-slate-800">
                  {[
                    ['particular', 'Particular'],
                    ['corretor', 'Corretor'],
                    ['imobiliaria', 'Imobiliaria']
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAccountType(value as AccountType)}
                      className={`rounded-xl px-2 py-2 ${accountType === value ? 'bg-white text-ocean-700 shadow-sm dark:bg-slate-950' : 'text-slate-500'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {accountType !== 'imobiliaria' ? (
                <div>
                  <input
                    value={cpf}
                    onChange={(event) => setCpf(formatCpf(event.target.value))}
                    placeholder="CPF"
                    inputMode="numeric"
                    maxLength={14}
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm dark:bg-slate-900 ${
                      cpfHasLengthError
                        ? 'border-red-300 text-red-700 focus:border-red-500 focus:outline-none dark:border-red-800 dark:text-red-200'
                        : 'border-sand-200 dark:border-slate-700'
                    }`}
                  />
                  {cpfHasLengthError && (
                    <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
                      CPF deve ter 11 digitos.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    value={cnpj}
                    onChange={(event) => setCnpj(formatCnpj(event.target.value))}
                    placeholder="CNPJ"
                    inputMode="numeric"
                    maxLength={18}
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm dark:bg-slate-900 ${
                      cnpjHasLengthError
                        ? 'border-red-300 text-red-700 focus:border-red-500 focus:outline-none dark:border-red-800 dark:text-red-200'
                        : 'border-sand-200 dark:border-slate-700'
                    }`}
                  />
                  {cnpjHasLengthError && (
                    <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
                      CNPJ deve ter 14 digitos.
                    </p>
                  )}
                </div>
              )}
              {accountType !== 'particular' && (
                <input value={creci} onChange={(event) => setCreci(event.target.value)} placeholder="CRECI" className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
              )}
            </>
          )}
        </div>
      )}
      {!isRecovery && (
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 pr-12 text-sm dark:border-slate-700 dark:bg-slate-900"
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

      {mode === 'signup' && !isRecovery && (
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder="Repetir senha"
            className="w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 pr-12 text-sm dark:border-slate-700 dark:bg-slate-900"
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
      )}

      {mode === 'signup' && !isRecovery && (
        <label className="flex items-start gap-3 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs">
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
      )}

      {(confirmed || invalidSession || message) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
          signupEmailSent || resetEmailSent
            ? 'border border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100'
            : message.toLowerCase().includes('incorretos') || message.toLowerCase().includes('confirme') || invalidSession
              ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100'
            : 'bg-sand-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
        }`}>
          {signupEmailSent && (
            <p className="mb-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
              Já tem uma conta?{' '}
              <button type="button" onClick={() => setMode('login')} className="font-bold text-sun-700 hover:text-sun-800">
                Login
              </button>
            </p>
          )}
          <p>{message || (invalidSession ? 'Sessão inválida. Entre novamente com uma conta ativa.' : 'Email confirmado. Agora entre com seu email e senha para anunciar.')}</p>
          {resetEmailSent && (
            <p className="mt-2 text-xs font-medium">
              Depois de confirmar, volte para esta página e entre com seu email e senha.
            </p>
          )}
        </div>
      )}

      <button type="button" onClick={submit} disabled={loading} className="w-full rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-700 hover:shadow-lg disabled:translate-y-0 disabled:opacity-60">
        {loading
      ? 'Aguarde...'
          : isRecovery
            ? 'Guardar nova senha'
            : mode === 'signup'
              ? isProfessionalPlanFlow
                ? requestedBillingMode === 'manual'
                  ? 'Criar conta e pagar 30 dias'
                  : 'Criar conta e assinar'
                : 'Começar grátis'
              : requestedPlan
                ? requestedBillingMode === 'manual'
                  ? 'Entrar e pagar 30 dias'
                  : 'Entrar e assinar'
                : 'Entrar'}
      </button>

      {mode === 'login' && !isRecovery && (
        <button
          type="button"
          onClick={sendPasswordReset}
          disabled={loading}
          className="w-full rounded-2xl border border-sand-200 px-5 py-3 text-sm font-semibold text-ocean-700 transition hover:border-ocean-300 disabled:opacity-60 dark:border-slate-700"
        >
          Esqueci minha senha
        </button>
      )}
    </div>
  );
}
