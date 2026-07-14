import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@/data/properties';
import { createAdminClient } from '@/lib/supabase/admin';

type ListingContactRow = {
  id: string;
  owner_id?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  contact_methods?: string[] | null;
};

async function loadContactRowsFromAdmin(ids: string[]) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('listings')
      .select('id,owner_id,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods')
      .in('id', ids);

    if (!error && data?.length) {
      return data as ListingContactRow[];
    }
  } catch {
    // Service role key not configured in this environment.
  }

  return null;
}

async function loadContactRowsFromPublicRpc(supabase: SupabaseClient, ids: string[]) {
  const contactsRpc = await supabase.rpc('get_public_listing_contacts', { listing_ids: ids });
  if (!contactsRpc.error && contactsRpc.data?.length) {
    return contactsRpc.data as ListingContactRow[];
  }

  const rows = await Promise.all(
    ids.map(async (id) => {
      const result = await supabase.rpc('get_public_approved_listing_by_id', { listing_id: id });
      if (result.error || !result.data?.[0]) return null;
      const row = result.data[0] as ListingContactRow;
      return {
        id: row.id,
        owner_id: row.owner_id ?? null,
        contact_name: row.contact_name ?? null,
        contact_phone: row.contact_phone ?? null,
        contact_whatsapp: row.contact_whatsapp ?? null,
        contact_email: row.contact_email ?? null,
        contact_methods: row.contact_methods ?? null
      };
    })
  );

  const validRows = rows.filter(Boolean) as ListingContactRow[];
  return validRows.length > 0 ? validRows : null;
}

async function loadContactRows(supabase: SupabaseClient, ids: string[]) {
  const fromPublicRpc = await loadContactRowsFromPublicRpc(supabase, ids);
  if (fromPublicRpc?.length) {
    return fromPublicRpc;
  }

  const initial = await supabase
    .from('listings')
    .select('id,owner_id,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods')
    .in('id', ids);

  if (!initial.error && initial.data?.length) {
    return initial.data as ListingContactRow[];
  }

  const fallback = await supabase
    .from('listings')
    .select('id,owner_id,contact_name,contact_phone,contact_whatsapp,contact_email')
    .in('id', ids);

  if (!fallback.error && fallback.data?.length) {
    return fallback.data as ListingContactRow[];
  }

  return loadContactRowsFromAdmin(ids);
}

function mergeContact(property: Property, contact: ListingContactRow) {
  const contactMethods =
    contact.contact_methods && contact.contact_methods.length > 0
      ? contact.contact_methods
      : [
          contact.contact_whatsapp ? 'whatsapp' : '',
          contact.contact_phone ? 'phone' : '',
          contact.contact_email ? 'email' : ''
        ].filter(Boolean);

  return {
    ...property,
    ownerId: contact.owner_id ?? property.ownerId,
    contactName: contact.contact_name ?? property.contactName,
    contactPhone: contact.contact_phone ?? property.contactPhone,
    contactWhatsapp: contact.contact_whatsapp ?? property.contactWhatsapp,
    contactEmail: contact.contact_email ?? property.contactEmail,
    contactMethods: contactMethods.length > 0 ? contactMethods : property.contactMethods
  };
}

export async function attachListingContactFields(supabase: SupabaseClient, properties: Property[]) {
  const ids = properties.map((property) => property.id).filter(Boolean);
  if (ids.length === 0) return properties;

  const needsContact = properties.some(
    (property) =>
      !property.ownerId &&
      !property.contactWhatsapp &&
      !property.contactPhone &&
      !property.contactEmail &&
      !(property.contactMethods?.length ?? 0)
  );

  if (!needsContact) return properties;

  const data = await loadContactRows(supabase, ids);
  if (!data?.length) return properties;

  const contactById = new Map(data.map((row) => [row.id, row]));

  return properties.map((property) => {
    const contact = contactById.get(property.id);
    if (!contact) return property;
    return mergeContact(property, contact);
  });
}
