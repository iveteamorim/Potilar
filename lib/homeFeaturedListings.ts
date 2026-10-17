import type { Property } from '@/data/properties';
import { showsInHomeFeaturedCarousel } from '@/lib/legacyHomeFeatured';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';

export function getHomeFeaturedListings(listings: Property[]) {
  const items = listings.filter((listing) => showsInHomeFeaturedCarousel(listing));

  return {
    items: orderListingsForDisplay(items)
  };
}
