'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export function createClient() {
  const url = SUPABASE_URL;
  const anonKey = SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createBrowserClient(url, anonKey);
}
