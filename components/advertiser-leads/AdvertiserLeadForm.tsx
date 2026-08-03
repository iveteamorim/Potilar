'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const advertiserTypes = ['Proprietário', 'Corretor', 'Imobiliária', 'Outro'];
const propertyTypes = ['Casa', 'Apartamento', 'Terreno', 'Kitnet/Conjugado', 'Ponto comercial', 'Vários imóveis'];

export default function AdvertiserLeadForm() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/advertiser-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(data.error ?? 'Não foi possível enviar agora. Tente novamente em instantes.');
        return;
      }

      router.push('/anunciar-obrigado');
    } catch {
      setStatus('Não foi possível enviar agora. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-sand-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Nome</span>
          <input name="name" required minLength={2} className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">WhatsApp</span>
          <input name="whatsapp" required inputMode="tel" placeholder="DDD + número" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">E-mail</span>
          <input name="email" type="email" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cidade no RN</span>
          <input name="city" required placeholder="Ex: Natal, Caicó, Mossoró" className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Você é</span>
          <select name="advertiserType" required className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="">Selecione</option>
            {advertiserTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tipo de imóvel</span>
          <select name="propertyType" required className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="">Selecione</option>
            {propertyTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mensagem ou dúvida</span>
        <textarea name="message" rows={5} placeholder="Escreva sua mensagem ou dúvida. Responderemos o mais rápido possível." className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
      </label>

      <input type="hidden" name="source" value="quero-anunciar" />

      {status && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-200">{status}</p>}

      <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60">
        {isSubmitting ? 'Enviando...' : 'Enviar contato'}
      </button>
    </form>
  );
}
