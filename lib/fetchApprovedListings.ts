import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicListingExpiryFilterIso } from '@/lib/listingLifecycle';
import { enrichFeaturedListingRows } from '@/lib/listingFeaturedFields';
import { PUBLIC_LISTING_SELECT, PUBLIC_LISTING_SELECT_WITH_CONTACT } from '@/lib/listings';

type EnrichableListingRow = Record<string, unknown> & {
  id: string;
  featured_plan?: string | null;
  featured_payment_status?: string | null;
  featured_starts_at?: string | null;
  featured_expires_at?: string | null;
};

/** Colunas que existiam antes do bloque verde (sem area_sqm, pet, etc.). */
export const PUBLIC_LISTING_SELECT_LEGACY =
  'id,owner_id,slug,title,property_type,transaction,price,price_period,bedrooms,bathrooms,parking,location,neighborhood,community,address_extra,lat,lng,images,featured_plan,featured_payment_status,featured_starts_at,featured_expires_at,description,features,created_at,updated_at';

export const PUBLIC_LISTING_SELECT_GREEN_LEGACY =
  'id,owner_id,slug,title,property_type,transaction,price,price_period,bedrooms,bathrooms,parking,area_sqm,condo_fee,is_pet_friendly,is_furnished,location,neighborhood,community,address_extra,lat,lng,images,featured_plan,featured_payment_status,featured_starts_at,featured_expires_at,description,features,created_at,updated_at';

export const PUBLIC_LISTING_SELECT_LEGACY_WITH_CONTACT =
  `${PUBLIC_LISTING_SELECT_LEGACY},contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods`;

/** Ficha do imovel com owner_id (compativel sem migracao verde). */
export const LISTING_DETAIL_SELECT_LEGACY = `owner_id,${PUBLIC_LISTING_SELECT_LEGACY_WITH_CONTACT}`;

const FULL_UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractListingIdFromSlug(slug: string) {
  const normalized = decodeURIComponent(slug).toLowerCase().trim();
  const fromSuffix = normalized.match(FULL_UUID_PATTERN)?.[0] ?? null;
  if (fromSuffix) return fromSuffix;
  if (FULL_UUID_PATTERN.test(normalized)) return normalized;
  return null;
}

export function isMissingColumnError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('column') &&
    (lower.includes('does not exist') || lower.includes('could not find') || lower.includes('schema cache'))
  );
}

type FetchOptions = {
  withContact?: boolean;
  ownerId?: string;
  listingIds?: string[];
  hideExpired?: boolean;
  /** SELECT customizado (ex.: incluir owner_id na ficha). */
  select?: string;
};

export async function fetchApprovedListingRows(supabase: SupabaseClient, options: FetchOptions = {}) {
  const withContact = options.withContact !== false;
  const extendedSelect =
    options.select ?? (withContact ? PUBLIC_LISTING_SELECT_WITH_CONTACT : PUBLIC_LISTING_SELECT);
  const greenLegacySelect = options.select ?? (withContact ? `${PUBLIC_LISTING_SELECT_GREEN_LEGACY},contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods` : PUBLIC_LISTING_SELECT_GREEN_LEGACY);
  const legacySelect = options.select ?? (withContact ? PUBLIC_LISTING_SELECT_LEGACY_WITH_CONTACT : PUBLIC_LISTING_SELECT_LEGACY);
  const canUsePublicRpc =
    options.withContact === false &&
    !options.ownerId &&
    !options.listingIds?.length &&
    !options.hideExpired &&
    !options.select;

  async function runQuery(select: string, includeExpiryFilter = true) {
    let query = supabase.from('listings').select(select).eq('status', 'approved');

    if (options.ownerId) {
      query = query.eq('owner_id', options.ownerId);
    }

    if (options.listingIds?.length) {
      query = query.in('id', options.listingIds);
    }

    if (options.hideExpired && includeExpiryFilter) {
      const nowIso = getPublicListingExpiryFilterIso();
      query = query.or(`listing_expires_at.is.null,listing_expires_at.gt.${nowIso}`);
    }

    return query.order('created_at', { ascending: false });
  }

  if (canUsePublicRpc) {
    const rpcResult = await supabase.rpc('get_public_approved_listings');

    if (!rpcResult.error && (rpcResult.data?.length ?? 0) > 0) {
      const mapped = (rpcResult.data ?? []).map((listing: Record<string, unknown>) =>
        mapPublicRpcListingRow(listing)
      );

      return enrichFeaturedListingRows(supabase, mapped);
    }

    if (rpcResult.error) {
      console.error('[Potilar] RPC publica falhou, tentando tabela:', rpcResult.error.message);
    }
  }

  let { data, error } = await runQuery(extendedSelect);

  if (error && isMissingColumnError(error.message)) {
    const fallback = await runQuery(greenLegacySelect, false);
    data = fallback.data;
    error = fallback.error;
  }

  if (error && isMissingColumnError(error.message)) {
    const fallback = await runQuery(legacySelect, false);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('[Potilar] Erro ao carregar anuncios:', error.message);
    return [];
  }

  const rows = data ?? [];

  if (rows.length > 0) {
    return enrichFeaturedListingRows(supabase, rows as unknown as EnrichableListingRow[]);
  }

  if (canUsePublicRpc && rows.length === 0) {
    const rpcRetry = await supabase.rpc('get_public_approved_listings');
    if (!rpcRetry.error && (rpcRetry.data?.length ?? 0) > 0) {
      return enrichFeaturedListingRows(supabase, (rpcRetry.data ?? []) as unknown as EnrichableListingRow[]);
    }
  }

  return rows;
}

function mapPublicRpcListingRow(listing: Record<string, unknown>) {
  return {
    ...listing,
    owner_id: listing.owner_id ?? null,
    area_sqm: listing.area_sqm ?? null,
    condo_fee: listing.condo_fee ?? null,
    condo_included: listing.condo_included ?? false,
    is_pet_friendly: listing.is_pet_friendly ?? false,
    is_furnished: listing.is_furnished ?? false,
    video_url: listing.video_url ?? null,
    tour_url: listing.tour_url ?? null,
    featured_starts_at: listing.featured_starts_at ?? null,
    featured_expires_at: listing.featured_expires_at ?? null,
    contact_name: listing.contact_name ?? null,
    contact_phone: listing.contact_phone ?? null,
    contact_whatsapp: listing.contact_whatsapp ?? null,
    contact_email: listing.contact_email ?? null,
    contact_methods: listing.contact_methods ?? null,
    advertiser_account_type: listing.advertiser_account_type ?? null,
    advertiser_public_slug: listing.advertiser_public_slug ?? null,
    advertiser_display_name: listing.advertiser_display_name ?? null,
    advertiser_profile_image_url: listing.advertiser_profile_image_url ?? null,
    advertiser_creci_verified: listing.advertiser_creci_verified ?? false
  };
}

export async function fetchOwnerPublicListings(supabase: SupabaseClient, ownerId: string) {
  const rpcResult = await supabase.rpc('get_public_listings_by_owner', { p_owner_id: ownerId });

  if (!rpcResult.error && (rpcResult.data?.length ?? 0) > 0) {
    const mapped = (rpcResult.data ?? []).map((listing: Record<string, unknown>) =>
      mapPublicRpcListingRow(listing)
    );
    return enrichFeaturedListingRows(supabase, mapped as EnrichableListingRow[]);
  }

  if (rpcResult.error) {
    console.error('[Potilar] RPC de anuncios por corretor falhou:', rpcResult.error.message);
  }

  return fetchApprovedListingRows(supabase, {
    ownerId,
    withContact: true,
    hideExpired: true
  });
}

type PublicListingDetailRow = Record<string, unknown>;

function pickListingFromRpcRows(rows: PublicListingDetailRow[] | null | undefined) {
  if (!rows?.length) return null;
  return rows[0];
}

export async function fetchPublicListingDetail(
  supabase: SupabaseClient,
  slugOrId: string,
  options: { withContact?: boolean } = {}
) {
  const withContact = options.withContact !== false;
  const normalizedSlug = decodeURIComponent(slugOrId).toLowerCase().trim();
  const listingId = extractListingIdFromSlug(normalizedSlug);

  async function loadFreshContactFields(row: PublicListingDetailRow): Promise<PublicListingDetailRow> {
    if (!withContact) return row;

    const id = String(row.id ?? '');
    if (!id) return row;

    const fresh = await supabase
      .from('listings')
      .select('contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods,updated_at')
      .eq('id', id)
      .maybeSingle();

    if (fresh.error || !fresh.data) {
      // Anon RLS may block contact columns; try service role.
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient();
        const adminFresh = await admin
          .from('listings')
          .select('contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods,updated_at')
          .eq('id', id)
          .maybeSingle();
        if (!adminFresh.error && adminFresh.data) {
          return {
            ...row,
            contact_name: adminFresh.data.contact_name ?? null,
            contact_phone: adminFresh.data.contact_phone ?? null,
            contact_whatsapp: adminFresh.data.contact_whatsapp ?? null,
            contact_email: adminFresh.data.contact_email ?? null,
            contact_methods: adminFresh.data.contact_methods ?? null,
            updated_at: adminFresh.data.updated_at ?? row.updated_at
          };
        }
      } catch {
        // Service role unavailable in this environment.
      }
      return row;
    }

    return {
      ...row,
      contact_name: fresh.data.contact_name ?? null,
      contact_phone: fresh.data.contact_phone ?? null,
      contact_whatsapp: fresh.data.contact_whatsapp ?? null,
      contact_email: fresh.data.contact_email ?? null,
      contact_methods: fresh.data.contact_methods ?? null,
      updated_at: fresh.data.updated_at ?? row.updated_at
    };
  }

  const bySlug = await supabase.rpc('get_public_approved_listing_by_slug', {
    listing_slug: normalizedSlug
  });
  const bySlugRow = pickListingFromRpcRows(bySlug.data as PublicListingDetailRow[] | null);
  if (!bySlug.error && bySlugRow) {
    return loadFreshContactFields(bySlugRow);
  }

  if (listingId) {
    const byId = await supabase.rpc('get_public_approved_listing_by_id', {
      listing_id: listingId
    });
    const byIdRow = pickListingFromRpcRows(byId.data as PublicListingDetailRow[] | null);
    if (!byId.error && byIdRow) {
      return loadFreshContactFields(byIdRow);
    }
  }

  const allPublic = await supabase.rpc('get_public_approved_listings');
  if (!allPublic.error && allPublic.data?.length) {
    const idPrefix = listingId?.replace(/-/g, '') ?? '';
    const found = (allPublic.data as PublicListingDetailRow[]).find((row) => {
      const rowSlug = String(row.slug ?? '').toLowerCase();
      const rowId = String(row.id ?? '').toLowerCase();
      const rowIdCompact = rowId.replace(/-/g, '');
      return (
        rowSlug === normalizedSlug ||
        (listingId && rowId === listingId) ||
        (idPrefix.length >= 8 && rowIdCompact.startsWith(idPrefix.slice(0, 8)))
      );
    });

    if (found?.slug) {
      const resolved = await supabase.rpc('get_public_approved_listing_by_slug', {
        listing_slug: String(found.slug).toLowerCase()
      });
      const resolvedRow = pickListingFromRpcRows(resolved.data as PublicListingDetailRow[] | null);
      if (!resolved.error && resolvedRow) {
        return loadFreshContactFields(resolvedRow);
      }
    }

    if (found && !withContact) {
      return found;
    }
  }

  const extendedSelect = withContact ? PUBLIC_LISTING_SELECT_WITH_CONTACT : PUBLIC_LISTING_SELECT;
  const greenLegacySelect = withContact ? `${PUBLIC_LISTING_SELECT_GREEN_LEGACY},contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods` : PUBLIC_LISTING_SELECT_GREEN_LEGACY;
  const legacySelect = withContact ? PUBLIC_LISTING_SELECT_LEGACY_WITH_CONTACT : PUBLIC_LISTING_SELECT_LEGACY;
  const greenLegacyDetailSelect = `owner_id,${greenLegacySelect}`;
  const legacyDetailSelect = `owner_id,${legacySelect}`;

  async function queryDetail(select: string, field: 'slug' | 'id', value: string) {
    return supabase
      .from('listings')
      .select(select)
      .eq(field, value)
      .eq('status', 'approved')
      .maybeSingle();
  }

  let data: PublicListingDetailRow | null = null;
  let errorMessage = '';

  const primary = listingId
    ? await queryDetail(`owner_id,${extendedSelect}`, 'id', listingId)
    : await queryDetail(`owner_id,${extendedSelect}`, 'slug', normalizedSlug);

  data = (primary.data as PublicListingDetailRow | null) ?? null;
  errorMessage = primary.error?.message ?? '';

  if ((errorMessage || !data) && !listingId) {
    const insensitive = await supabase
      .from('listings')
      .select(`owner_id,${extendedSelect}`)
      .ilike('slug', normalizedSlug)
      .eq('status', 'approved')
      .maybeSingle();
    data = (insensitive.data as PublicListingDetailRow | null) ?? null;
    errorMessage = insensitive.error?.message ?? '';
  }

  if ((errorMessage || !data) && listingId) {
    const byId = await queryDetail(`owner_id,${extendedSelect}`, 'id', listingId);
    data = (byId.data as PublicListingDetailRow | null) ?? null;
    errorMessage = byId.error?.message ?? '';
  }

  if (errorMessage && isMissingColumnError(errorMessage)) {
    const greenLegacy = listingId
      ? await queryDetail(greenLegacyDetailSelect, 'id', listingId)
      : await queryDetail(greenLegacyDetailSelect, 'slug', normalizedSlug);
    data = (greenLegacy.data as PublicListingDetailRow | null) ?? null;
    errorMessage = greenLegacy.error?.message ?? '';
  }

  if (errorMessage && isMissingColumnError(errorMessage)) {
    const legacy = listingId
      ? await queryDetail(legacyDetailSelect, 'id', listingId)
      : await queryDetail(legacyDetailSelect, 'slug', normalizedSlug);
    data = (legacy.data as PublicListingDetailRow | null) ?? null;
    errorMessage = legacy.error?.message ?? '';
  }

  if (errorMessage || !data) {
    return null;
  }

  return loadFreshContactFields(data);
}
