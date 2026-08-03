import type { Property } from '@/data/properties';
import { isActiveFeaturedListing } from './listingLifecycle';
import { isDefaultListingCoordinate, isKnownCityCenterCoordinate, resolveListingCoordinates } from './locationCoordinates';
import { formatPlaceName } from './textFormat';
import { normalizeListingImageUrls } from './imageUrls';

export const PUBLIC_LISTING_SELECT =
  'id,owner_id,slug,title,property_type,transaction,price,price_period,bedrooms,bathrooms,parking,area_sqm,condo_fee,condo_included,is_pet_friendly,is_furnished,location,neighborhood,community,address_extra,lat,lng,images,video_url,tour_url,featured_plan,featured_payment_status,featured_starts_at,featured_expires_at,description,features,created_at,updated_at';

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
  condo_included?: boolean | null;
  is_pet_friendly?: boolean | null;
  is_furnished?: boolean | null;
  location: string;
  neighborhood?: string | null;
  community?: string | null;
  address_extra?: string | null;
  lat: number;
  lng: number;
  images: string[];
  video_url?: string | null;
  tour_url?: string | null;
  featured_plan?: '7_days' | '15_days' | '30_days' | 'super_30_days' | null;
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
  advertiser_account_type?: string | null;
  advertiser_public_slug?: string | null;
  advertiser_display_name?: string | null;
  advertiser_profile_image_url?: string | null;
  advertiser_creci_verified?: boolean | null;
};

export function applyAdvertiserFieldsFromListingRow(property: Property, row: ListingRow): Property {
  const accountType = row.advertiser_account_type?.trim();
  if (!accountType || !['corretor', 'imobiliaria'].includes(accountType)) {
    return property;
  }

  return {
    ...property,
    advertiserAccountType: accountType,
    advertiserPublicSlug: row.advertiser_public_slug ?? property.advertiserPublicSlug,
    advertiserDisplayName: row.advertiser_display_name ?? property.advertiserDisplayName,
    advertiserImageUrl: row.advertiser_profile_image_url ?? property.advertiserImageUrl,
    advertiserCreciVerified: Boolean(row.advertiser_creci_verified ?? property.advertiserCreciVerified)
  };
}

export function listingRowToProperty(row: ListingRow): Property {
  const baseLocation = row.location.split(',')[0] || row.location;
  const formattedLocation = formatPlaceName(baseLocation);
  const formattedNeighborhood = row.neighborhood ? formatPlaceName(row.neighborhood) : undefined;
  const formattedCommunity = row.community ? formatPlaceName(row.community) : undefined;
  const formattedAddressExtra = row.address_extra ? formatPlaceName(row.address_extra) : undefined;
  const now = Date.now();
  const isFeatured = isActiveFeaturedListing(row, now);
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

  return applyAdvertiserFieldsFromListingRow(
    {
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
    condoIncluded: Boolean(row.condo_included),
    location: formattedLocation,
    neighborhood: formattedNeighborhood,
    community: formattedCommunity,
    addressExtra: formattedAddressExtra,
    lat: resolvedLat,
    lng: resolvedLng,
    isPetFriendly: Boolean(row.is_pet_friendly),
    isFurnished: Boolean(row.is_furnished),
    isFeatured,
    featuredPlan: row.featured_plan ?? undefined,
    images: normalizeListingImageUrls(row.images),
    videoUrl: row.video_url ?? undefined,
    tourUrl: row.tour_url ?? undefined,
    contactName: row.contact_name ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    contactWhatsapp: row.contact_whatsapp ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactMethods: row.contact_methods ?? undefined,
    description: row.description,
    features: row.features,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
    },
    row
  );
}
