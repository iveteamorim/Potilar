import type { Metadata } from 'next';
import { LockKeyhole } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login demo privado | Potilar',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminDemoLoginPage({
  searchParams
}: {
  searchParams?: {
    error?: string;
  };
}) {
  return (
    <main className="section-padding">
      <div className="mx-auto max-w-md rounded-3xl border border-sand-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-50 text-ocean-700">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean-600">Admin demo</p>
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Entrar como João</h1>
          </div>
        </div>

        <form action="/api/demo-login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="profile" value="joao-medeiros-corretor-demo" />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Senha privada</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-2xl border border-sand-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-ocean-400 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          {searchParams?.error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Senha incorreta.
            </p>
          )}

          <button type="submit" className="h-12 w-full rounded-2xl bg-ocean-700 px-5 text-sm font-semibold text-white transition hover:bg-ocean-800">
            Entrar na demo Corretor
          </button>
        </form>
      </div>
    </main>
  );
}
