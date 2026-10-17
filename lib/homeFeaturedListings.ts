import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@/data/properties';
import { showsInHomeFeaturedCarousel } from '@/lib/legacyHomeFeatured';
import { getPublicListingExpiryFilterIso, isActiveFeaturedListing, isListingExpired } from '@/lib/listingLifecycle';
import { listingRowToProperty, PUBLIC_LISTING_SELECT, type ListingRow } from '@/lib/listings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';

const FEATURED_HOME_SELECT = `${PUBLIC_LISTING_SELECT},listing_expires_at`;

type FeaturedListingRow = ListingRow & {
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
  const fromLoaded = getHomeFeaturedListings(alreadyLoaded).items;
  const dedicated = await fetchActiveFeaturedRows(supabase);
  const byId = new Map<string, Property>();

  for (const listing of [...dedicated, ...fromLoaded]) {
    byId.set(listing.id, listing);
  }

  return orderListingsForDisplay(Array.from(byId.values()));
}

async function fetchActiveFeaturedRows(supabase: SupabaseClient): Promise<Property[]> {
  const now = Date.now();

  async function loadRows(client: SupabaseClient) {
    const nowIso = getPublicListingExpiryFilterIso(new Date(now));
    const { data, error } = await client
      .from('listings')
      .select(FEATURED_HOME_SELECT)
      .eq('status', 'approved')
      .eq('featured_payment_status', 'confirmed')
      .not('featured_plan', 'is', null)
      .or(`listing_expires_at.is.null,listing_expires_at.gt.${nowIso}`)
      .order('featured_starts_at', { ascending: false, nullsFirst: false });

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
      if (!data) {
        data = userResult.data;
      }
    }
  }

  if (error || !data?.length) {
    return [];
  }

  return data
    .filter((row) => !isListingExpired(row.listing_expires_at ?? null, now))
    .filter((row) => isActiveFeaturedListing(row, now))
    .map(listingRowToProperty);
}
