import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@/data/properties';
import { isMissingColumnError } from '@/lib/fetchApprovedListings';
import { showsInHomeFeaturedCarousel } from '@/lib/legacyHomeFeatured';
import { showsInPublicFeaturedCarousel } from '@/lib/listingLifecycle';
import { listingRowToProperty, PUBLIC_LISTING_SELECT, type ListingRow } from '@/lib/listings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';

const FEATURED_HOME_SELECT = `${PUBLIC_LISTING_SELECT},listing_expires_at,status`;

type FeaturedListingRow = ListingRow & {
  status?: string | null;
  listing_expires_at?: string | null;
};

export function getHomeFeaturedListings(listings: Property[]) {
  const items = listings.filter((listing) => showsInHomeFeaturedCarousel(listing));

  return {
    items: orderListingsForDisplay(items)
  };
}

export async function loadHomeFeaturedListings(
  supabase: SupabaseClient,
  alreadyLoaded: Property[] = []
): Promise<Property[]> {
  const dedicated = await fetchActiveFeaturedRows(supabase);
  const fromLoaded = getHomeFeaturedListings(alreadyLoaded).items;
  const byId = new Map<string, Property>();

  for (const listing of [...fromLoaded, ...dedicated]) {
    byId.set(listing.id, listing);
  }

  return orderListingsForDisplay(Array.from(byId.values()));
}

async function fetchActiveFeaturedRows(supabase: SupabaseClient): Promise<Property[]> {
  const now = Date.now();

  async function run(client: SupabaseClient, select: string) {
    return client
      .from('listings')
      .select(select)
      .eq('status', 'approved')
      .eq('featured_payment_status', 'confirmed')
      .not('featured_plan', 'is', null)
      .order('featured_starts_at', { ascending: false, nullsFirst: false });
  }

  async function loadRows(client: SupabaseClient) {
    let { data, error } = await run(client, FEATURED_HOME_SELECT);

    if (error && isMissingColumnError(error.message ?? '')) {
      const fallback = await run(client, PUBLIC_LISTING_SELECT);
      data = fallback.data;
      error = fallback.error;
    }

    return { data: (data ?? null) as FeaturedListingRow[] | null, error };
  }

  let data: FeaturedListingRow[] | null = null;
  let error: { message?: string } | null = null;

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminResult = await loadRows(createAdminClient());
    data = adminResult.data;
    error = adminResult.error;
  } catch {
    error = { message: 'admin_unavailable' };
  }

  if (error) {
    const userResult = await loadRows(supabase);
    if (!userResult.error) {
      data = userResult.data;
      error = null;
    } else {
      error = userResult.error;
      if (!data) data = userResult.data;
    }
  }

  if (error || !data?.length) {
    return [];
  }

  return data.filter((row) => showsInPublicFeaturedCarousel(row, now)).map(listingRowToProperty);
}
