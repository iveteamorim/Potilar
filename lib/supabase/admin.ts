import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for maintenance tasks.');
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
