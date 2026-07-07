'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildPublicProfileSlug, getPublicProfilePath } from '@/lib/publicProfile';
import { slugify } from '@/lib/slugify';

type Props = {
  fullName: string;
  companyName: string;
  bio: string;
  publicSlug: string;
  accountType: string;
  creci: string;
  creciVerified: boolean;
  userId: string;
};

export default function ProfileEditorForm({ fullName, companyName, bio, publicSlug, accountType, creci, creciVerified, userId }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(publicSlug || buildPublicProfileSlug(fullName, userId));
  const [company, setCompany] = useState(companyName);
  const [about, setAbout] = useState(bio);
  const [creciValue, setCreciValue] = useState(creci);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const isProfessional = accountType === 'corretor' || accountType === 'imobiliaria';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  if (!isProfessional) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Perfis publicos estao disponiveis para contas de corretor ou imobiliaria.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
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
          {creciVerified ? 'CRECI verificado pela Potilar.' : 'CRECI pendente de verificação pela Potilar.'}
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
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Salvando...' : 'Salvar perfil publico'}
      </button>
    </form>
  );
}
