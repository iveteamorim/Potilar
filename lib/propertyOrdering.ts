import type { Property } from '@/data/properties';

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
  const superFeatured = items.filter((item) => item.featuredPlan === 'super_30_days');
  const featured = items.filter((item) => item.isFeatured && item.featuredPlan !== 'super_30_days');
  const regular = items.filter((item) => !item.isFeatured);

  return [...sortByRecency(superFeatured), ...sortByRecency(featured), ...sortByRecency(regular)];
}
