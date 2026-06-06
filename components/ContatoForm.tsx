'use client';

import { useState } from 'react';

export default function ContatoForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit() {
    const text = [
      'Ola, vim pelo site Potilar e quero informacoes sobre imoveis.',
      `Nome: ${name || '-'}`,
      `Email: ${email || '-'}`,
      `Mensagem: ${message || '-'}`
    ].join('\n');
    const url = `https://wa.me/5521969724141?text=${encodeURIComponent(text)}`;
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
        Receber informacoes
      </button>
      <a
        href="https://wa.me/5521969724141?text=Ola%2C%20vim%20pelo%20site%20Potilar%20e%20quero%20falar%20com%20atendimento."
        className="block text-center text-sm font-semibold text-ocean-700"
      >
        Ou falar com atendimento no WhatsApp
      </a>
      <p className="text-center text-xs text-slate-500">
        Seus dados sao usados apenas para contato e retorno do atendimento.
      </p>
    </form>
  );
}
