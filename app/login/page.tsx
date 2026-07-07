import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import { Bell, Heart, Home, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Entrar | Potilar',
  description: 'Acesse sua conta para salvar favoritos, criar alertas e publicar anuncios na Potilar.'
};

export default function LoginPage() {
  return (
    <main className="px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-14">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <div className="relative hidden overflow-hidden rounded-[2rem] p-1 lg:block lg:min-h-[520px]">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_20%_20%,#075f8f_0,transparent_28%),radial-gradient(circle_at_80%_70%,#16a34a_0,transparent_24%)]" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ocean-600 sm:text-sm">Conta Potilar</p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-slate-900 dark:text-white sm:mt-4 sm:text-3xl">
            Entre para salvar imóveis.
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300 sm:mt-3">
            Favoritos, alertas, mensagens e anúncios em um só lugar.
          </p>
          <div className="mt-8 hidden gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:grid">
            {[
              [Heart, 'Guarde seus imoveis favoritos'],
              [Bell, 'Receba alertas de novos anuncios'],
              [Home, 'Publique imoveis gratuitamente'],
              [MessageCircle, 'Fale direto com interessados']
            ].map(([Icon, label]) => (
              <div key={label as string} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-50 text-ocean-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{label as string}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 hidden flex-wrap gap-3 text-xs font-semibold text-slate-500 lg:flex">
            <span className="rounded-full border border-sand-200 bg-white px-3 py-2">+ de 20 imoveis publicados</span>
            <span className="rounded-full border border-sand-200 bg-white px-3 py-2">100% focado no Rio Grande do Norte</span>
          </div>
        </div>
        <Suspense fallback={<div className="glass-card h-80 animate-pulse p-6" />}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
