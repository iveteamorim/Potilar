'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidContactPhone, normalizeContactPhone } from '@/lib/contactPhone';
import { slugify } from '@/lib/slugify';

export type SaveListingEditorPayload = {
  listingId: string;
  title: string;
  propertyType: string;
  transaction: string;
  price: number;
  pricePeriod: string | null;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  location: string;
  neighborhood: string | null;
  community: string | null;
  addressExtra: string | null;
  lat: number;
  lng: number;
  description: string;
  features: string[];
  images: string[];
  contactName: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
  contactMethods: string[];
  videoUrl: string | null;
  tourUrl: string | null;
  condoIncluded: boolean;
  isPetFriendly: boolean;
  isFurnished: boolean;
};

type ListingLookup = {
  id: string;
  owner_id: string;
  status: string | null;
  title: string | null;
  location: string | null;
  slug: string | null;
};

function buildListingUpdate(
  payload: SaveListingEditorPayload,
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    methods: string[];
  },
  keepApproved: boolean
) {
  return {
    title: payload.title,
    property_type: payload.propertyType,
    transaction: payload.transaction,
    price: payload.price,
    price_period: payload.transaction === 'Temporada' ? payload.pricePeriod : null,
    bedrooms: payload.bedrooms,
    bathrooms: payload.bathrooms,
    parking: payload.parking,
    location: payload.location,
    neighborhood: payload.neighborhood,
    community: payload.community,
    address_extra: payload.addressExtra,
    lat: payload.lat,
    lng: payload.lng,
    description: payload.description,
    features: payload.features,
    images: payload.images,
    contact_name: payload.contactName,
    contact_phone: contact.phone,
    contact_whatsapp: contact.whatsapp,
    contact_email: contact.email,
    contact_methods: contact.methods,
    video_url: payload.videoUrl,
    tour_url: payload.tourUrl,
    condo_included: payload.condoIncluded,
    is_pet_friendly: payload.isPetFriendly,
    is_furnished: payload.isFurnished,
    updated_at: new Date().toISOString(),
    ...(keepApproved ? { status: 'approved' as const } : {})
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LISTING_LOOKUP_SELECT = 'id,owner_id,status,title,location,slug';

async function loadListingLookup(
  client: ReturnType<typeof createClient>,
  listingRef: string
): Promise<{ listing: ListingLookup | null; error: string | null }> {
  const safeRef = listingRef?.trim();
  if (!safeRef) {
    return { listing: null, error: 'ID do anuncio ausente.' };
  }

  if (UUID_PATTERN.test(safeRef)) {
    const byId = await client.from('listings').select(LISTING_LOOKUP_SELECT).eq('id', safeRef).maybeSingle();
    if (byId.error) return { listing: null, error: byId.error.message };
    if (byId.data) return { listing: byId.data as ListingLookup, error: null };
  }

  const bySlug = await client.from('listings').select(LISTING_LOOKUP_SELECT).eq('slug', safeRef).maybeSingle();
  if (bySlug.error) return { listing: null, error: bySlug.error.message };
  return { listing: (bySlug.data as ListingLookup | null) ?? null, error: null };
}

function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function saveListingEditorChanges(payload: SaveListingEditorPayload) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: 'Faça login novamente.' };
  }

  // Prefer the signed-in user client (same path that opens the editor).
  // Admin/service-role is optional fallback only — a bad SERVICE_ROLE_KEY must not block saves.
  let { listing, error: listingError } = await loadListingLookup(supabase, payload.listingId);

  if (!listing) {
    const admin = tryCreateAdminClient();
    if (admin) {
      const adminLoad = await loadListingLookup(admin as ReturnType<typeof createClient>, payload.listingId);
      if (adminLoad.listing) {
        listing = adminLoad.listing;
        listingError = null;
      } else if (adminLoad.error && /permission denied/i.test(adminLoad.error)) {
        listingError =
          'Chave SUPABASE_SERVICE_ROLE_KEY invalida ou sem acesso. O save usara o RPC com seu usuario logado.';
      } else if (adminLoad.error) {
        listingError = adminLoad.error;
      }
    }
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdmin = profile?.role === 'admin';

  // If we still cannot read the row, still attempt RPCs when the ref is a UUID (owner/admin checked inside RPC).
  const listingId = listing?.id ?? (UUID_PATTERN.test(payload.listingId.trim()) ? payload.listingId.trim() : null);

  if (!listingId) {
    return {
      ok: false as const,
      error: listingError
        ? `Nao foi possivel carregar o anuncio: ${listingError}`
        : 'Anuncio nao encontrado. Abra novamente pela lista de anuncios e tente salvar de novo.'
    };
  }

  if (listing && !isAdmin && listing.owner_id !== user.id) {
    return { ok: false as const, error: 'Not allowed' };
  }

  const contactMethods = payload.contactMethods.filter(Boolean);
  const contactPhone = payload.contactPhone ? normalizeContactPhone(payload.contactPhone) : '';
  const contactWhatsapp = payload.contactWhatsapp ? normalizeContactPhone(payload.contactWhatsapp) : '';
  const resolvedPhone = contactPhone || contactWhatsapp;

  if ((contactMethods.includes('phone') || contactMethods.includes('whatsapp')) && !isValidContactPhone(resolvedPhone)) {
    return {
      ok: false as const,
      error: 'Informe o telefone/WhatsApp com DDI (ex: +55 47 99263-1299).'
    };
  }

  if (contactMethods.includes('email') && !payload.contactEmail) {
    return { ok: false as const, error: 'Informe um email valido ou desmarque a opcao Email.' };
  }

  if (contactMethods.length === 0) {
    return { ok: false as const, error: 'Selecione ao menos um canal de contato.' };
  }

  const contact = {
    phone: contactMethods.includes('phone') ? resolvedPhone || null : null,
    whatsapp: contactMethods.includes('whatsapp') ? resolvedPhone || null : null,
    email: contactMethods.includes('email') ? payload.contactEmail : null,
    methods: contactMethods
  };

  const keepApproved = listing?.status === 'approved';

  const rpc = await supabase.rpc('update_listing_details', {
    listing_id: listingId,
    new_title: payload.title,
    new_property_type: payload.propertyType,
    new_transaction: payload.transaction,
    new_price: payload.price,
    new_price_period: payload.pricePeriod,
    new_bedrooms: payload.bedrooms,
    new_bathrooms: payload.bathrooms,
    new_parking: payload.parking,
    new_location: payload.location,
    new_neighborhood: payload.neighborhood,
    new_community: payload.community,
    new_address_extra: payload.addressExtra,
    new_lat: payload.lat,
    new_lng: payload.lng,
    new_description: payload.description,
    new_features: payload.features,
    new_images: payload.images,
    new_contact_name: payload.contactName,
    new_contact_phone: contact.phone,
    new_contact_whatsapp: contact.whatsapp,
    new_contact_email: contact.email,
    new_contact_methods: contact.methods
  });

  if (!rpc.error) {
    await supabase.rpc('update_listing_contact', {
      listing_id: listingId,
      new_contact_name: payload.contactName,
      new_contact_phone: contact.phone,
      new_contact_whatsapp: contact.whatsapp,
      new_contact_email: contact.email,
      new_contact_methods: contact.methods
    });

    const admin = tryCreateAdminClient();
    if (admin) {
      await admin
        .from('listings')
        .update({
          video_url: payload.videoUrl,
          tour_url: payload.tourUrl,
          condo_included: payload.condoIncluded,
          is_pet_friendly: payload.isPetFriendly,
          is_furnished: payload.isFurnished,
          updated_at: new Date().toISOString(),
          ...(keepApproved ? { status: 'approved' } : {})
        })
        .eq('id', listingId);
    }

    revalidateListingPaths(listing, listingId);
    return { ok: true as const };
  }

  // Fallback: service role (optional). Main fix is running the SQL RPCs in Supabase.
  const admin = tryCreateAdminClient();
  if (!admin) {
    return {
      ok: false as const,
      error:
        rpc.error.message.includes('permission denied') || rpc.error.message.includes('Not allowed')
          ? 'Sem permissao para atualizar. Execute no Supabase: fix_update_listing_details_admin_allowed.sql e fix_update_listing_contact_keep_approved.sql'
          : rpc.error.message
    };
  }

  const { error: adminError } = await admin
    .from('listings')
    .update(buildListingUpdate(payload, contact, keepApproved))
    .eq('id', listingId);

  if (adminError) {
    return {
      ok: false as const,
      error:
        adminError.message.includes('permission denied')
          ? 'Sem permissao para atualizar. Execute os SQL de fix no Supabase e confira se SUPABASE_SERVICE_ROLE_KEY e a service_role (nao a anon).'
          : adminError.message
    };
  }

  revalidateListingPaths(listing, listingId);
  return { ok: true as const };
}

function revalidateListingPaths(
  listing: { title?: string | null; location?: string | null; slug?: string | null } | null,
  listingId: string
) {
  if (listing?.title && listing?.location) {
    revalidatePath(`/imoveis/${slugify(`${listing.title}-${listing.location}-${listingId}`)}`);
  }
  if (listing?.slug) {
    revalidatePath(`/imoveis/${listing.slug}`);
  }
  revalidatePath('/mi-cuenta');
  revalidatePath('/admin');
  revalidatePath('/imoveis');
  revalidatePath('/');
}
