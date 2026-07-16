import type { SupabaseClient } from '@supabase/supabase-js';
import { getDemoProfessionalProfile } from '@/data/demoProfessionalProfiles';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const PUBLIC_ADVERTISER_PROFILE_SELECT =
  'id,full_name,company_name,bio,phone,account_type,professional_plan,public_slug,creci,creci_verified,profile_image_url,banner_image_url,languages';

export type PublicAdvertiserProfileRow = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  bio?: string | null;
  phone?: string | null;
  account_type?: string | null;
  professional_plan?: string | null;
  public_slug?: string | null;
  creci?: string | null;
  creci_verified?: boolean | null;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  languages?: string[] | null;
};

function normalizeSlug(slug: string) {
  return decodeURIComponent(slug).trim().toLowerCase();
}

function withFallbackFields(
  profile: PublicAdvertiserProfileRow,
  fallbackSlug: string
): PublicAdvertiserProfileRow {
  return {
    ...profile,
    professional_plan: profile.professional_plan ?? null,
    creci_verified: Boolean(profile.creci_verified),
    languages: profile.languages?.length ? profile.languages : ['Português'],
    public_slug: profile.public_slug?.trim() || fallbackSlug
  };
}

async function queryProfileBySlug(
  supabase: SupabaseClient,
  slug: string,
  mode: 'exact' | 'prefix' = 'exact'
) {
  let query = supabase
    .from('profiles')
    .select(PUBLIC_ADVERTISER_PROFILE_SELECT)
    .in('account_type', ['corretor', 'imobiliaria']);

  query =
    mode === 'exact'
      ? query.ilike('public_slug', slug)
      : query.ilike('public_slug', `${slug}%`);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error || !data) return null;
  return data as PublicAdvertiserProfileRow;
}

async function queryProfileFromRpc(supabase: SupabaseClient, slug: string) {
  const rpc = await supabase.rpc('get_public_profile_by_slug', { profile_slug: slug });
  if (rpc.error || !rpc.data?.length) return null;
  return rpc.data[0] as PublicAdvertiserProfileRow;
}

export async function fetchPublicAdvertiserProfile(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  const supabase = createClient();

  const rpcProfile = await queryProfileFromRpc(supabase, normalizedSlug);
  if (rpcProfile?.public_slug) {
    return withFallbackFields(rpcProfile, normalizedSlug);
  }

  const directProfile = await queryProfileBySlug(supabase, normalizedSlug, 'exact');
  if (directProfile?.public_slug) {
    return withFallbackFields(directProfile, normalizedSlug);
  }

  try {
    const admin = createAdminClient();

    const adminRpc = await admin.rpc('get_public_profile_by_slug', { profile_slug: normalizedSlug });
    if (!adminRpc.error && adminRpc.data?.[0]) {
      return withFallbackFields(adminRpc.data[0] as PublicAdvertiserProfileRow, normalizedSlug);
    }

    const adminExact = await queryProfileBySlug(admin, normalizedSlug, 'exact');
    if (adminExact) {
      return withFallbackFields(adminExact, normalizedSlug);
    }

    const adminPrefix = await queryProfileBySlug(admin, normalizedSlug, 'prefix');
    if (adminPrefix) {
      return withFallbackFields(adminPrefix, normalizedSlug);
    }
  } catch {
    // Service role not configured in this environment.
  }

  const demo = getDemoProfessionalProfile(normalizedSlug);
  return demo ?? null;
}
