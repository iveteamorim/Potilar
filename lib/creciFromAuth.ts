import { createAdminClient } from '@/lib/supabase/admin';

type ProfileCreciRow = {
  id: string;
  account_type?: string | null;
  creci?: string | null;
};

export function readCreciFromMetadata(metadata?: Record<string, unknown> | null) {
  const value = metadata?.creci;
  return typeof value === 'string' && value.trim().length >= 3 ? value.trim() : null;
}

function needsCreci(row: ProfileCreciRow) {
  return ['corretor', 'imobiliaria'].includes(row.account_type ?? '') && !String(row.creci ?? '').trim();
}

export async function fillMissingCreciFromAuth<T extends ProfileCreciRow>(rows: T[]): Promise<T[]> {
  const missing = rows.filter(needsCreci);
  if (missing.length === 0) return rows;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return rows;
  }

  const recovered = new Map<string, string>();

  await Promise.all(
    missing.map(async (row) => {
      try {
        const { data } = await admin.auth.admin.getUserById(row.id);
        const creci = readCreciFromMetadata(data.user?.user_metadata as Record<string, unknown> | undefined);
        if (creci) recovered.set(row.id, creci);
      } catch {
        // Keep the empty CRECI if Auth metadata is unavailable.
      }
    })
  );

  if (recovered.size === 0) return rows;

  await Promise.all(
    [...recovered.entries()].map(([id, creci]) => admin.from('profiles').update({ creci }).eq('id', id))
  );

  return rows.map((row) => (recovered.has(row.id) ? { ...row, creci: recovered.get(row.id) } : row));
}
