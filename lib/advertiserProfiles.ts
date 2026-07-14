import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@/data/properties';

type AdvertiserProfileRow = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  account_type?: string | null;
  public_slug?: string | null;
  profile_image_url?: string | null;
  creci?: string | null;
  creci_verified?: boolean | null;
};

export async function attachAdvertiserProfiles(supabase: SupabaseClient, properties: Property[]) {
  const ownerIds = Array.from(new Set(properties.map((property) => property.ownerId).filter(Boolean))) as string[];
  if (ownerIds.length === 0) return properties;

  let { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,company_name,account_type,public_slug,profile_image_url,creci,creci_verified')
    .in('id', ownerIds);

  if (error) {
    const fallback = await supabase
      .from('profiles')
      .select('id,full_name,account_type,public_slug,creci')
      .in('id', ownerIds);
    data = fallback.error
      ? null
      : fallback.data?.map((profile) => ({ ...profile, company_name: null, profile_image_url: null, creci_verified: false })) ?? null;
  }

  const profileById = new Map((data ?? []).map((profile) => [profile.id, profile as AdvertiserProfileRow]));

  return properties.map((property) => {
    if (!property.ownerId) return property;
    const profile = profileById.get(property.ownerId);
    if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type ?? '')) return property;

    return {
      ...property,
      advertiserAccountType: profile.account_type ?? property.advertiserAccountType,
      advertiserCreciVerified: Boolean(profile.creci && profile.creci_verified),
      advertiserPublicSlug: profile.public_slug ?? property.advertiserPublicSlug,
      advertiserDisplayName: profile.company_name || profile.full_name || property.advertiserDisplayName,
      advertiserImageUrl: profile.profile_image_url ?? property.advertiserImageUrl
    };
  });
}
