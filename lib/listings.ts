import type { Property } from '@/data/properties';
import { isDefaultListingCoordinate, isKnownCityCenterCoordinate, resolveListingCoordinates } from './locationCoordinates';
import { formatPlaceName } from './textFormat';

export const PUBLIC_LISTING_SELECT =
  'id,slug,title,property_type,transaction,price,price_period,bedrooms,bathrooms,parking,area_sqm,condo_fee,is_pet_friendly,is_furnished,location,neighborhood,community,address_extra,lat,lng,images,featured_plan,featured_payment_status,featured_starts_at,featured_expires_at,description,features,created_at,updated_at';

export const PUBLIC_LISTING_SELECT_WITH_CONTACT =
  `${PUBLIC_LISTING_SELECT},contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods`;

export type ListingRow = {
  id: string;
  owner_id?: string | null;
  slug: string;
  title: string;
  property_type: Property['propertyType'];
  transaction: Property['transaction'];
  price: number;
  price_period?: Property['pricePeriod'] | null;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area_sqm?: number | null;
  condo_fee?: number | null;
  is_pet_friendly?: boolean | null;
  is_furnished?: boolean | null;
  location: string;
  neighborhood?: string | null;
  community?: string | null;
  address_extra?: string | null;
  lat: number;
  lng: number;
  images: string[];
  featured_plan?: '7_days' | '30_days' | 'super_30_days' | null;
  featured_payment_status?: 'not_requested' | 'pix_pending' | 'confirmed' | null;
  featured_starts_at?: string | null;
  featured_expires_at?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  contact_methods?: string[] | null;
  description: string;
  features: string[];
  created_at?: string | null;
  updated_at?: string | null;
};

export function listingRowToProperty(row: ListingRow): Property {
  const baseLocation = row.location.split(',')[0] || row.location;
  const formattedLocation = formatPlaceName(baseLocation);
  const formattedNeighborhood = row.neighborhood ? formatPlaceName(row.neighborhood) : undefined;
  const formattedCommunity = row.community ? formatPlaceName(row.community) : undefined;
  const formattedAddressExtra = row.address_extra ? formatPlaceName(row.address_extra) : undefined;
  const now = Date.now();
  const featuredStartsAt = row.featured_starts_at ? new Date(row.featured_starts_at).getTime() : null;
  const featuredExpiresAt = row.featured_expires_at ? new Date(row.featured_expires_at).getTime() : null;
  const hasFeaturedDates = Boolean(featuredStartsAt && featuredExpiresAt);
  const isFeatured = Boolean(
    row.featured_plan &&
      row.featured_payment_status === 'confirmed' &&
      (!hasFeaturedDates || (featuredStartsAt! <= now && featuredExpiresAt! > now))
  );
  const resolvedFromAddress = resolveListingCoordinates(
    row.location,
    row.neighborhood,
    row.community,
    row.address_extra,
    row.title,
    row.description
  );
  const storedIsDefaultNatal = isDefaultListingCoordinate(row.lat, row.lng);
  const resolvedIsDefaultNatal = isDefaultListingCoordinate(resolvedFromAddress[0], resolvedFromAddress[1]);
  const hasPreciseStoredCoordinates =
    Number.isFinite(row.lat) &&
    Number.isFinite(row.lng) &&
    !isKnownCityCenterCoordinate(row.lat, row.lng) &&
    !(storedIsDefaultNatal && !resolvedIsDefaultNatal);
  const [resolvedLat, resolvedLng] = hasPreciseStoredCoordinates ? [row.lat, row.lng] : resolvedFromAddress;

  return {
    id: row.id,
    ownerId: row.owner_id ?? undefined,
    slug: row.slug,
    title: row.title,
    propertyType: row.property_type,
    transaction: row.transaction,
    price: row.price,
    pricePeriod: row.price_period ?? undefined,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    areaSqm: row.area_sqm ?? undefined,
    condoFee: row.condo_fee ?? undefined,
    location: formattedLocation,
    neighborhood: formattedNeighborhood,
    community: formattedCommunity,
    addressExtra: formattedAddressExtra,
    lat: resolvedLat,
    lng: resolvedLng,
    isPetFriendly: Boolean(row.is_pet_friendly),
    isFurnished: Boolean(row.is_furnished),
    isFeatured,
    featuredPlan: isFeatured ? row.featured_plan ?? undefined : undefined,
    images: row.images,
    contactName: row.contact_name ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    contactWhatsapp: row.contact_whatsapp ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactMethods: row.contact_methods ?? undefined,
    description: row.description,
    features: row.features,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
  };
}
