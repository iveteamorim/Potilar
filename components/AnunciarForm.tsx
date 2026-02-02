'use client';

import { useState } from 'react';

export default function AnunciarForm() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [transaction, setTransaction] = useState('');
  const [details, setDetails] = useState('');

  function handleSubmit() {
    const message = [
      'Olá, quero anunciar meu imóvel.',
      `Nome: ${name || '—'}`,
      `Cidade/Bairro: ${location || '—'}`,
      `Tipo: ${propertyType || '—'}`,
      `Negociação: ${transaction || '—'}`,
      `Detalhes: ${details || '—'}`
    ].join('\n');
    const url = `https://wa.me/5584999999999?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  return (
    <form className="glass-card space-y-4 p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">Dados do imóvel</h3>
      <input
        type="text"
        placeholder="Nome completo"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <input
        type="text"
        placeholder="Cidade / Bairro"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={propertyType}
          onChange={(event) => setPropertyType(event.target.value)}
          className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option>Tipo de imóvel</option>
          <option>Casa</option>
          <option>Terreno</option>
          <option>Apartamento</option>
        </select>
        <select
          value={transaction}
          onChange={(event) => setTransaction(event.target.value)}
          className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option>Negociação</option>
          <option>Compra</option>
          <option>Aluguel</option>
        </select>
      </div>
      <textarea
        rows={4}
        placeholder="Resumo do imóvel (quartos, metragem, diferenciais)"
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white"
      >
        Enviar informações
      </button>
      <a
        href="https://wa.me/5584999999999"
        className="inline-flex w-full justify-center rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700"
      >
        Falar com atendimento
      </a>
      <a href="https://wa.me/5584999999999" className="block text-center text-sm font-semibold text-ocean-700">
        Ou falar com atendimento no WhatsApp
      </a>
      <p className="text-center text-xs text-slate-500">
        Seus dados são usados apenas para contato sobre a divulgação do imóvel.
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
