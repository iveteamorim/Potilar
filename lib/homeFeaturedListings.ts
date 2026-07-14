import type { Property } from '@/data/properties';
import { showsInHomeFeaturedCarousel } from '@/lib/legacyHomeFeatured';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';

const HOME_FEATURED_LIMIT = 10;

export function getHomeFeaturedListings(listings: Property[]) {
  const items = listings.filter((listing) => showsInHomeFeaturedCarousel(listing));

  return {
    items: orderListingsForDisplay(items).slice(0, HOME_FEATURED_LIMIT)
  };
}
