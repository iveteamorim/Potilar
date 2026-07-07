import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@/data/properties';

type AdvertiserProfile = {
  id: string;
  account_type: string | null;
  creci: string | null;
  creci_verified?: boolean | null;
};

export async function enrichPropertiesWithAdvertiserVerification(
  supabase: SupabaseClient,
  properties: Property[]
) {
  const ownerIds = Array.from(new Set(properties.map((property) => property.ownerId).filter(Boolean)));
  if (ownerIds.length === 0) return properties;

  let { data, error } = await supabase
    .from('profiles')
    .select('id,account_type,creci,creci_verified')
    .in('id', ownerIds);

  if (error && /creci_verified|schema cache|column/i.test(error.message)) {
    const fallback = await supabase.from('profiles').select('id,account_type,creci').in('id', ownerIds);
    data = fallback.data?.map((profile) => ({ ...profile, creci_verified: false })) ?? [];
    error = fallback.error;
  }

  if (error || !data?.length) return properties;

  const profileById = new Map(
    (data as AdvertiserProfile[]).map((profile) => [
      profile.id,
      {
        accountType: profile.account_type ?? 'particular',
        creciVerified: Boolean(profile.creci && profile.creci_verified)
      }
    ])
  );

  return properties.map((property) => {
    const profile = property.ownerId ? profileById.get(property.ownerId) : undefined;
    if (!profile) return property;

    return {
      ...property,
      advertiserAccountType: profile.accountType,
      advertiserCreciVerified:
        ['corretor', 'imobiliaria'].includes(profile.accountType) && profile.creciVerified
    };
  });
}
