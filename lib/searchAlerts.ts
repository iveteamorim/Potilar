export type SavedSearchFilters = {
  q?: string;
  propertyType?: string;
  transaction?: string;
  city?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking?: string;
  minArea?: string;
  petFriendly?: string;
};

export function filtersToSearchParams(filters: SavedSearchFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

export function searchParamsToFilters(searchParams: URLSearchParams): SavedSearchFilters {
  const keys: (keyof SavedSearchFilters)[] = [
    'q',
    'propertyType',
    'transaction',
    'city',
    'sort',
    'minPrice',
    'maxPrice',
    'bedrooms',
    'bathrooms',
    'parking',
    'minArea',
    'petFriendly'
  ];

  const filters: SavedSearchFilters = {};
  keys.forEach((key) => {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  });
  return filters;
}

export function buildAlertLabel(filters: SavedSearchFilters) {
  const parts = [
    filters.transaction,
    filters.propertyType,
    filters.city,
    filters.minPrice && `de R$ ${filters.minPrice}`,
    filters.maxPrice && `ate R$ ${filters.maxPrice}`,
    filters.bedrooms && `${filters.bedrooms}+ quartos`,
    filters.minArea && `${filters.minArea}+ m2`,
    filters.petFriendly === '1' && 'aceita pet'
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' - ') : 'Busca personalizada';
}

export function buildImoveisHref(filters: SavedSearchFilters) {
  const params = filtersToSearchParams(filters);
  const query = params.toString();
  return query ? `/imoveis?${query}` : '/imoveis';
}
