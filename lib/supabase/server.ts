import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export function createClient() {
  const cookieStore = cookies();
  const url = SUPABASE_URL;
  const anonKey = SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot persist refreshed cookies; middleware/actions will handle them.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Server Components cannot persist refreshed cookies; middleware/actions will handle them.
        }
      }
    }
  });
}
