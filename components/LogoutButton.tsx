'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-xl border border-sand-200 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
    >
      Sair
    </button>
  );
}
