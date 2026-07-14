import type { Property } from '@/data/properties';
import { isLegacyAdminGiftFeatured } from '@/lib/legacyHomeFeatured';

function getListingTimestamp(property: Property) {
  const value = property.updatedAt ?? property.createdAt;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortByRecency(items: Property[]) {
  return [...items].sort((left, right) => getListingTimestamp(right) - getListingTimestamp(left));
}

export function orderListingsForDisplay(items: Property[]) {
  const superFeatured = items.filter((item) => item.featuredPlan === 'super_30_days' && item.isFeatured);
  const paidFeatured = items.filter(
    (item) => item.isFeatured && item.featuredPlan !== 'super_30_days'
  );
  const legacyGifts = items.filter((item) => isLegacyAdminGiftFeatured(item) && !item.isFeatured);
  const regular = items.filter((item) => !item.isFeatured && !isLegacyAdminGiftFeatured(item));

  return [
    ...sortByRecency(superFeatured),
    ...sortByRecency(paidFeatured),
    ...sortByRecency(legacyGifts),
    ...sortByRecency(regular)
  ];
}
