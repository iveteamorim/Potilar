'use client';

import { useState } from 'react';

export default function ContatoForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit() {
    const text = [
      'Olá, quero informações sobre imóveis.',
      `Nome: ${name || '—'}`,
      `Email: ${email || '—'}`,
      `Mensagem: ${message || '—'}`
    ].join('\n');
    const url = `https://wa.me/5584999999999?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <form className="glass-card space-y-4 p-6">
      <input
        type="text"
        placeholder="Seu nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <input
        type="email"
        placeholder="Seu email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <textarea
        rows={4}
        placeholder="Conte sobre o imóvel que procura ou deseja divulgar"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white"
      >
        Receber informações
      </button>
      <a href="https://wa.me/5584999999999" className="block text-center text-sm font-semibold text-ocean-700">
        Ou falar com atendimento no WhatsApp
      </a>
      <p className="text-center text-xs text-slate-500">
        Seus dados são usados apenas para contato e retorno do atendimento.
      </p>
      <div className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <p className="font-semibold">Publicação gratuita sujeita a critérios mínimos.</p>
        <p className="mt-2">
          A publicação gratuita inclui 1 anúncio por proprietário, com informações completas e no mínimo 3 fotos. O
          destaque é opcional, por período definido, e os valores são informados via WhatsApp conforme tipo de imóvel e
          região.
        </p>
      </div>
    </form>
  );
}
