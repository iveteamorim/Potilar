import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@/data/properties';
import { attachListingContactFields } from '@/lib/listingContactFields';
import { createAdminClient } from '@/lib/supabase/admin';

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

const ADVERTISER_PROFILE_SELECT =
  'id,full_name,company_name,account_type,public_slug,profile_image_url,creci,creci_verified';

async function attachListingOwnerIds(supabase: SupabaseClient, properties: Property[]) {
  const missingIds = properties.filter((property) => !property.ownerId).map((property) => property.id);
  if (missingIds.length === 0) return properties;

  try {
    const { data } = await supabase.rpc('get_public_listing_contacts', { listing_ids: missingIds });
    if (!data?.length) return properties;

    const ownerByListingId = new Map(
      (data as Array<{ id: string; owner_id?: string | null }>).map((row) => [row.id, row.owner_id ?? null])
    );

    return properties.map((property) => {
      if (property.ownerId) return property;
      const ownerId = ownerByListingId.get(property.id);
      return ownerId ? { ...property, ownerId } : property;
    });
  } catch {
    return properties;
  }
}

async function loadAdvertiserProfileRows(supabase: SupabaseClient, ownerIds: string[]) {
  if (ownerIds.length === 0) return [] as AdvertiserProfileRow[];

  const rpcResult = await supabase.rpc('get_public_advertiser_profiles', { profile_ids: ownerIds });
  if (!rpcResult.error && rpcResult.data?.length) {
    return rpcResult.data as AdvertiserProfileRow[];
  }

  try {
    const admin = createAdminClient();
    const adminResult = await admin.from('profiles').select(ADVERTISER_PROFILE_SELECT).in('id', ownerIds);
    if (adminResult.data?.length) {
      return adminResult.data as AdvertiserProfileRow[];
    }
  } catch {
    // Service role not configured in this environment.
  }

  const { data, error } = await supabase.from('profiles').select(ADVERTISER_PROFILE_SELECT).in('id', ownerIds);

  if (!error && data?.length) {
    return data as AdvertiserProfileRow[];
  }

  const fallback = await supabase
    .from('profiles')
    .select('id,full_name,account_type,public_slug,creci')
    .in('id', ownerIds);

  if (!fallback.error && fallback.data?.length) {
    return fallback.data.map((profile) => ({
      ...profile,
      company_name: null,
      profile_image_url: null,
      creci_verified: false
    })) as AdvertiserProfileRow[];
  }

  return [];
}

export async function attachAdvertiserProfiles(supabase: SupabaseClient, properties: Property[]) {
  const withOwners = await attachListingOwnerIds(supabase, properties);
  const ownerIds = Array.from(new Set(withOwners.map((property) => property.ownerId).filter(Boolean))) as string[];
  if (ownerIds.length === 0) return withOwners;

  const profiles = await loadAdvertiserProfileRows(supabase, ownerIds);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return withOwners.map((property) => {
    if (!property.ownerId) return property;
    const profile = profileById.get(property.ownerId);
    if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type ?? '')) return property;

    return {
      ...property,
      advertiserAccountType: profile.account_type ?? property.advertiserAccountType,
      advertiserCreciVerified:
        profile.creci && profile.creci_verified
          ? true
          : property.advertiserCreciVerified,
      advertiserPublicSlug: profile.public_slug ?? property.advertiserPublicSlug,
      advertiserDisplayName:
        profile.company_name || profile.full_name || property.advertiserDisplayName,
      advertiserImageUrl: profile.profile_image_url?.trim() || property.advertiserImageUrl
    };
  });
}

export async function enrichPublicListings(supabase: SupabaseClient, properties: Property[]) {
  let enriched = properties;

  try {
    enriched = await attachListingContactFields(supabase, properties);
  } catch {
    enriched = properties;
  }

  try {
    return await attachAdvertiserProfiles(supabase, enriched);
  } catch {
    return enriched;
  }
}
