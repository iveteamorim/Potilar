import type { SupabaseClient } from '@supabase/supabase-js';

type ListingFeaturedRow = {
  id: string;
  featured_plan?: string | null;
  featured_payment_status?: string | null;
  featured_starts_at?: string | null;
  featured_expires_at?: string | null;
};

export async function enrichFeaturedListingRows<T extends ListingFeaturedRow>(supabase: SupabaseClient, rows: T[]) {
  const ids = rows.filter((row) => row.featured_plan).map((row) => row.id);
  if (ids.length === 0) return rows;

  const featuredById = new Map<string, ListingFeaturedRow>();

  await Promise.all(
    ids.map(async (id) => {
      const result = await supabase.rpc('get_public_approved_listing_by_id', { listing_id: id });
      const row = result.data?.[0] as ListingFeaturedRow | undefined;
      if (row?.id) {
        featuredById.set(id, row);
      }
    })
  );

  if (featuredById.size === 0) return rows;

  return rows.map((row) => {
    const featured = featuredById.get(row.id);
    if (!featured) return row;

    return {
      ...row,
      featured_plan: featured.featured_plan ?? row.featured_plan,
      featured_payment_status: featured.featured_payment_status ?? row.featured_payment_status,
      featured_starts_at: featured.featured_starts_at ?? row.featured_starts_at,
      featured_expires_at: featured.featured_expires_at ?? row.featured_expires_at
    };
  });
}
