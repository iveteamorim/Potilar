'use client';

import { useState } from 'react';

const CONTACT_EMAIL = 'contato@potilar.com.br';

export default function ContatoForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit() {
    const body = [
      'Ola, vim pelo site Potilar e quero informacoes sobre imoveis.',
      '',
      `Nome: ${name || '-'}`,
      `Email: ${email || '-'}`,
      `Mensagem: ${message || '-'}`
    ].join('\n');
    const subject = 'Contato pelo site Potilar';
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
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
        placeholder="Conte sobre o imovel que procura ou deseja divulgar"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white"
      >
        Enviar por email
      </button>
      <p className="text-center text-xs text-slate-500">
        O formulario abre seu aplicativo de email com a mensagem pronta para envio.
      </p>
    </form>
  );
}
