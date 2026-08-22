'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildPublicProfileSlug, getPublicProfilePath } from '@/lib/publicProfile';
import { slugify } from '@/lib/slugify';

type Props = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  bio: string;
  publicSlug: string;
  accountType: string;
  creci: string;
  creciVerified: boolean;
  userId: string;
};

function getAccountTypeLabel(accountType: string) {
  if (accountType === 'corretor') return 'Corretor';
  if (accountType === 'imobiliaria') return 'Imobiliaria';
  return 'Particular';
}

export default function ProfileEditorForm({
  fullName,
  email,
  phone,
  companyName,
  bio,
  publicSlug,
  accountType,
  creci,
  creciVerified,
  userId
}: Props) {
  const router = useRouter();
  const isProfessional = accountType === 'corretor' || accountType === 'imobiliaria';

  const [name, setName] = useState(fullName);
  const [accountEmail, setAccountEmail] = useState(email);
  const [accountPhone, setAccountPhone] = useState(phone);
  const [accountStatus, setAccountStatus] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  const [slug, setSlug] = useState(publicSlug || buildPublicProfileSlug(fullName, userId));
  const [company, setCompany] = useState(companyName);
  const [about, setAbout] = useState(bio);
  const [creciValue, setCreciValue] = useState(creci);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountLoading(true);
    setAccountStatus('');

    const response = await fetch('/api/profile/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: name,
        email: accountEmail,
        phone: accountPhone
      })
    });

    const payload = await response.json();
    setAccountLoading(false);

    if (!response.ok) {
      setAccountStatus(payload.error ?? 'Nao foi possivel salvar os dados.');
      return;
    }

    setAccountStatus(
      payload.emailConfirmationSent
        ? 'Dados salvos. Enviamos a confirmacao para o novo email.'
        : 'Dados salvos.'
    );
    router.refresh();
  }

  async function handlePublicSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isProfessional) return;

    setLoading(true);
    setStatus('');

    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      setStatus('Informe um endereco publico valido.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/profile/public', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_slug: normalizedSlug,
        company_name: company.trim() || null,
        bio: about.trim() || null,
        creci: creciValue.trim() || null
      })
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Nao foi possivel salvar o perfil.');
      return;
    }

    setStatus('Perfil publico atualizado.');
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <form onSubmit={handleAccountSubmit} className="glass-card space-y-5 p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Dados da conta</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Veja e edite seus dados basicos. Se trocar o email, precisa confirmar pelo codigo enviado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nome</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tipo de conta</label>
            <input
              value={getAccountTypeLabel(accountType)}
              disabled
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              value={accountEmail}
              onChange={(event) => setAccountEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Telefone</label>
            <input
              value={accountPhone}
              onChange={(event) => setAccountPhone(event.target.value)}
              placeholder="+55 84 99999-9999"
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        {accountStatus && <p className="text-sm font-semibold text-ocean-700">{accountStatus}</p>}
        <button type="submit" disabled={accountLoading} className="rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {accountLoading ? 'Salvando...' : 'Salvar dados'}
        </button>
      </form>

      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Perfil publico</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {isProfessional
            ? 'Configure como clientes veem sua pagina publica Potilar.'
            : 'Disponivel para contas de corretor ou imobiliaria.'}
        </p>
      </section>

      {isProfessional && (
        <form onSubmit={handlePublicSubmit} className="glass-card space-y-4 p-6 lg:col-span-2">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Endereco publico</label>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <span>potilar.com.br{getPublicProfilePath('')}</span>
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="flex-1 rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {accountType === 'imobiliaria' ? 'Nome da imobiliaria' : 'Nome profissional'}
            </label>
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder={fullName}
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">CRECI</label>
            <input
              value={creciValue}
              onChange={(event) => setCreciValue(event.target.value)}
              placeholder="Ex: CRECI-RN 0000-F"
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <p className={`mt-2 text-xs font-semibold ${creciVerified ? 'text-green-700' : 'text-slate-500'}`}>
              {creciVerified
                ? 'CRECI verificado pela Potilar.'
                : creci
                  ? 'CRECI informado. A verificacao oficial pela equipe Potilar ainda esta em andamento.'
                  : 'Informe seu CRECI para liberar o selo de profissional.'}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sobre voce</label>
            <textarea
              rows={4}
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              placeholder="Conte em poucas linhas como voce atua no RN."
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          {status && <p className="text-sm font-semibold text-ocean-700">{status}</p>}
          <button type="submit" disabled={loading} className="rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Salvando...' : 'Salvar perfil publico'}
          </button>
        </form>
      )}
    </div>
  );
}
