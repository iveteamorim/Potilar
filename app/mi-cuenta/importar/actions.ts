'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';
import { cities as RN_CITIES } from '@/data/cities';
import { getActiveListingStatuses, getListingLimitForAccount } from '@/lib/listingLimits';

type ImportRow = {
  title: string;
  propertyType: string;
  transaction: string;
  price: number;
  city: string;
  neighborhood: string | null;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  areaSqm: number | null;
  description: string;
  images: string[];
};

const ALLOWED_PROPERTY_TYPES = ['Casa', 'Apartamento', 'Terreno', 'Kitnet/Conjugado', 'Ponto comercial'];
const ALLOWED_TRANSACTIONS = ['Compra', 'Aluguel', 'Temporada'];
const MAX_IMPORT_ROWS = 120;
const USER_AGENT = 'PotilarImporter/1.0 (+https://potilar.com.br)';

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if ((char === ';' || char === ',') && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseNumber(value: string, fallback = 0) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeChoice(value: string, allowed: string[], fallback: string) {
  const normalized = slugify(value);
  return allowed.find((item) => slugify(item) === normalized) ?? fallback;
}

function cleanHtml(value: string) {
  return decodeXml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
  );
}

function isSafePublicUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return ['http:', 'https:'].includes(url.protocol) && !/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/i.test(url.hostname);
  } catch {
    return false;
  }
}

function detectCity(value: string) {
  const normalized = slugify(value);
  return RN_CITIES.find((city) => normalized.includes(slugify(city))) ?? '';
}

function detectPropertyType(value: string) {
  const normalized = slugify(value);
  if (/apartamento|apto/.test(normalized)) return 'Apartamento';
  if (/terreno|lote/.test(normalized)) return 'Terreno';
  if (/kitnet|conjugado|studio/.test(normalized)) return 'Kitnet/Conjugado';
  if (/comercial|loja|sala|galpao|ponto/.test(normalized)) return 'Ponto comercial';
  return 'Casa';
}

function detectTransaction(value: string) {
  const normalized = slugify(value);
  if (/temporada|diaria/.test(normalized)) return 'Temporada';
  if (/venda|comprar|vende|sale/.test(normalized)) return 'Compra';
  return 'Aluguel';
}

function extractFirstPrice(value: string) {
  const match = value.match(/R\$\s*([\d.]+(?:,\d{2})?)/i) ?? value.match(/(?:preco|valor|price)["'\s:=]+([\d.]+(?:,\d{2})?)/i);
  return match?.[1] ? parseNumber(match[1]) : 0;
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function getTagValue(block: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = block.match(new RegExp(`<(?:[\\w-]+:)?${escaped}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${escaped}>`, 'i'));
    if (match?.[1]) return decodeXml(match[1].replace(/<[^>]*>/g, ' '));
  }
  return '';
}

function getRepeatedTagValues(block: string, names: string[]) {
  const values: string[] = [];

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`<(?:[\\w-]+:)?${escaped}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${escaped}>`, 'gi');
    for (const match of block.matchAll(pattern)) {
      const value = decodeXml((match[1] ?? '').replace(/<[^>]*>/g, ' '));
      if (/^https?:\/\//i.test(value)) values.push(value);
    }
  }

  const urlMatches = block.match(/https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|webp)(?:\?[^\s<>"']*)?/gi) ?? [];
  return Array.from(new Set([...values, ...urlMatches])).slice(0, 12);
}

function splitXmlItems(xml: string) {
  const itemPattern = /<(Listing|Imovel|Imóvel|Property|item|ad|Anuncio|Anúncio)[^>]*>[\s\S]*?<\/\1>/gi;
  const items = xml.match(itemPattern);
  if (items?.length) return items;

  const listingPattern = /<[^>]*(?:Listing|Imovel|Property|Anuncio)[^>]*>[\s\S]*?<\/[^>]*(?:Listing|Imovel|Property|Anuncio)>/gi;
  return xml.match(listingPattern) ?? [];
}

function parseRowsFromXml(xml: string): ImportRow[] {
  return splitXmlItems(xml)
    .map((block) => {
      const title = getTagValue(block, ['Title', 'Titulo', 'Título', 'title', 'titulo']);
      const propertyType = getTagValue(block, ['PropertyType', 'TipoImovel', 'Tipo', 'type', 'categoria']);
      const transaction = getTagValue(block, ['TransactionType', 'Finalidade', 'Operacao', 'Operação', 'transaction']);
      const price = getTagValue(block, ['Price', 'Preco', 'Preço', 'Valor', 'price']);
      const city = getTagValue(block, ['City', 'Cidade', 'city', 'Localidade']);
      const neighborhood = getTagValue(block, ['Neighborhood', 'Bairro', 'neighborhood']);
      const bedrooms = getTagValue(block, ['Bedrooms', 'Dormitorios', 'Dormitórios', 'Quartos', 'bedrooms']);
      const bathrooms = getTagValue(block, ['Bathrooms', 'Banheiros', 'bathrooms']);
      const parking = getTagValue(block, ['Garage', 'Garagem', 'Vagas', 'ParkingSpaces', 'parking']);
      const areaSqm = getTagValue(block, ['LivingArea', 'AreaUtil', 'ÁreaÚtil', 'Area', 'area']);
      const description = getTagValue(block, ['Description', 'Descricao', 'Descrição', 'description']);
      const images = getRepeatedTagValues(block, ['Image', 'Imagem', 'Foto', 'Photo', 'URLArquivo', 'Url']);

      return {
        title: title || `${normalizeChoice(propertyType, ALLOWED_PROPERTY_TYPES, 'Imovel')} em ${city}`,
        propertyType: normalizeChoice(propertyType, ALLOWED_PROPERTY_TYPES, 'Casa'),
        transaction: normalizeChoice(transaction, ALLOWED_TRANSACTIONS, /venda|compr/i.test(transaction) ? 'Compra' : 'Aluguel'),
        price: Math.max(0, Math.round(parseNumber(price))),
        city,
        neighborhood: neighborhood || null,
        bedrooms: Math.max(0, Math.round(parseNumber(bedrooms))),
        bathrooms: Math.max(0, Math.round(parseNumber(bathrooms))),
        parking: Math.max(0, Math.round(parseNumber(parking))),
        areaSqm: areaSqm ? Math.max(0, parseNumber(areaSqm)) : null,
        description: description || title,
        images
      };
    })
    .filter((row) => row.title && row.city && row.description);
}

function parseRows(csv: string): ImportRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines[0]?.toLowerCase().includes('titulo') ? lines.slice(1) : lines;

  return rows
    .map((line) => {
      const [
        title,
        propertyType,
        transaction,
        price,
        city,
        neighborhood,
        bedrooms,
        bathrooms,
        parking,
        areaSqm,
        description,
        images
      ] = parseCsvLine(line);

      return {
        title: title?.trim(),
        propertyType: normalizeChoice(propertyType ?? '', ALLOWED_PROPERTY_TYPES, 'Casa'),
        transaction: normalizeChoice(transaction ?? '', ALLOWED_TRANSACTIONS, 'Aluguel'),
        price: Math.max(0, Math.round(parseNumber(price ?? '0'))),
        city: city?.trim(),
        neighborhood: neighborhood?.trim() || null,
        bedrooms: Math.max(0, Math.round(parseNumber(bedrooms ?? '0'))),
        bathrooms: Math.max(0, Math.round(parseNumber(bathrooms ?? '0'))),
        parking: Math.max(0, Math.round(parseNumber(parking ?? '0'))),
        areaSqm: areaSqm ? Math.max(0, parseNumber(areaSqm)) : null,
        description: description?.trim(),
        images: (images ?? '')
          .split('|')
          .map((url) => url.trim())
          .filter((url) => /^https?:\/\//i.test(url))
      };
    })
    .filter((row) => row.title && row.city && row.description);
}

export async function importListingsFromCsv(formData: FormData) {
  const csv = String(formData.get('csv') ?? '').trim();
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta/importar');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,professional_plan,full_name,company_name,phone,email')
    .eq('id', user.id)
    .single();

  if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type)) {
    redirect('/mi-cuenta/importar?error=professional');
  }

  const rows = parseRows(csv).slice(0, MAX_IMPORT_ROWS);

  if (rows.length === 0) {
    redirect('/mi-cuenta/importar?error=empty');
  }

  await insertImportedRows(rows);
  revalidatePath('/mi-cuenta');
  redirect(`/mi-cuenta/importar?success=${rows.length}`);
}

async function insertImportedRows(rows: ImportRow[]) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta/importar');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,professional_plan,full_name,company_name,phone,email')
    .eq('id', user.id)
    .single();

  if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type)) {
    redirect('/mi-cuenta/importar?error=professional');
  }

  if (!profile.professional_plan) {
    redirect('/mi-cuenta/importar?error=plan_required');
  }

  const listingLimit = getListingLimitForAccount(profile.account_type, false, profile.professional_plan);
  const { count, error: countError } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .in('status', [...getActiveListingStatuses()]);

  if (countError) {
    redirect(`/mi-cuenta/importar?error=${encodeURIComponent(countError.message)}`);
  }

  const activeCount = count ?? 0;
  const availableSlots = Number.isFinite(listingLimit) ? Math.max(0, listingLimit - activeCount) : rows.length;

  if (Number.isFinite(listingLimit) && (availableSlots <= 0 || rows.length > availableSlots)) {
    redirect(`/mi-cuenta/importar?error=import_limit&limit=${listingLimit}&available=${availableSlots}`);
  }

  const now = Date.now();
  const contactName = profile.company_name || profile.full_name || user.email || 'Anunciante';
  const payload = rows.map((row, index) => ({
    owner_id: user.id,
    title: row.title,
    slug: slugify(`${row.title}-${row.city}-${now}-${index}`),
    property_type: row.propertyType,
    transaction: row.transaction,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    area_sqm: row.areaSqm,
    location: row.city,
    neighborhood: row.neighborhood,
    lat: -5.7945,
    lng: -35.211,
    description: row.description,
    features: [],
    images: row.images,
    contact_name: contactName,
    contact_phone: profile.phone ?? null,
    contact_whatsapp: profile.phone ?? null,
    contact_email: profile.email ?? user.email ?? null,
    contact_methods: profile.phone ? ['whatsapp'] : ['email'],
    status: 'pending',
    payment_status: 'not_required'
  }));

  const { error } = await supabase.from('listings').insert(payload as any);

  if (error) {
    redirect(`/mi-cuenta/importar?error=${encodeURIComponent(error.message)}`);
  }
}

export async function importListingsFromXml(formData: FormData) {
  const xmlUrl = String(formData.get('xml_url') ?? '').trim();

  if (!isSafePublicUrl(xmlUrl)) {
    redirect('/mi-cuenta/importar?error=xml_url');
  }
  const url = new URL(xmlUrl);

  const response = await fetch(url.toString(), {
    headers: { accept: 'application/xml,text/xml,text/plain,*/*', 'user-agent': USER_AGENT },
    cache: 'no-store'
  });

  if (!response.ok) {
    redirect('/mi-cuenta/importar?error=xml_fetch');
  }

  const xml = (await response.text()).slice(0, 8_000_000);
  const rows = parseRowsFromXml(xml).slice(0, MAX_IMPORT_ROWS);

  if (rows.length === 0) {
    redirect('/mi-cuenta/importar?error=xml_empty');
  }

  await insertImportedRows(rows);
  revalidatePath('/mi-cuenta');
  redirect(`/mi-cuenta/importar?success=${rows.length}&source=xml`);
}

function flattenJsonLd(value: unknown): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (typeof value !== 'object') return [];
  const item = value as Record<string, any>;
  return [item, ...flattenJsonLd(item['@graph']), ...flattenJsonLd(item.itemListElement).map((entry) => entry.item ?? entry)];
}

function parseRowsFromJsonLd(html: string): ImportRow[] {
  const scripts = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));

  return scripts.flatMap((script) => {
    try {
      const parsed = JSON.parse(decodeXml(script[1] ?? ''));
      return flattenJsonLd(parsed)
        .map((item) => {
          const text = [
            item.name,
            item.title,
            item.description,
            item.address?.addressLocality,
            item.address?.streetAddress,
            item.offers?.price,
            item.offers?.priceSpecification?.price
          ]
            .filter(Boolean)
            .join(' ');
          const city = item.address?.addressLocality || detectCity(text);
          const title = String(item.name || item.title || '').trim();
          const description = String(item.description || title || '').trim();
          const imageValue = item.image;
          const images = Array.isArray(imageValue) ? imageValue : imageValue ? [imageValue] : [];

          return {
            title,
            propertyType: detectPropertyType(text),
            transaction: detectTransaction(text),
            price: Math.max(0, Math.round(parseNumber(String(item.offers?.price ?? item.offers?.priceSpecification?.price ?? '0'), extractFirstPrice(text)))),
            city,
            neighborhood: item.address?.streetAddress ? String(item.address.streetAddress).slice(0, 80) : null,
            bedrooms: Math.max(0, Math.round(parseNumber(String(item.numberOfRooms ?? item.numberOfBedrooms ?? '0')))),
            bathrooms: Math.max(0, Math.round(parseNumber(String(item.numberOfBathroomsTotal ?? item.numberOfBathrooms ?? '0')))),
            parking: 0,
            areaSqm: item.floorSize?.value ? parseNumber(String(item.floorSize.value)) : null,
            description,
            images: images.map(String).filter((url) => /^https?:\/\//i.test(url)).slice(0, 12)
          };
        })
        .filter((row) => row.title && row.city && row.description);
    } catch {
      return [];
    }
  });
}

function parseRowsFromPortalHtml(html: string, sourceUrl: string): ImportRow[] {
  const jsonRows = parseRowsFromJsonLd(html);
  if (jsonRows.length > 0) return jsonRows;

  const pageText = cleanHtml(html);
  const city = detectCity(pageText);
  const anchors = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));
  const base = new URL(sourceUrl);
  const seen = new Set<string>();

  return anchors
    .map((match) => {
      const href = match[1] ?? '';
      const label = cleanHtml(match[2] ?? '');
      const normalized = slugify(`${href} ${label}`);
      if (!/(imovel|imoveis|apartamento|casa|terreno|aluguel|venda|property|ad)/.test(normalized)) return null;

      let absoluteUrl = '';
      try {
        absoluteUrl = new URL(href, base).toString();
      } catch {
        return null;
      }

      const key = slugify(`${absoluteUrl}-${label}`);
      if (seen.has(key)) return null;
      seen.add(key);

      const title = label.slice(0, 90) || `Imovel importado de ${base.hostname}`;
      const rowCity = detectCity(label) || city;
      if (!rowCity) return null;

      return {
        title,
        propertyType: detectPropertyType(label),
        transaction: detectTransaction(label),
        price: Math.max(0, Math.round(extractFirstPrice(label))),
        city: rowCity,
        neighborhood: null,
        bedrooms: 0,
        bathrooms: 0,
        parking: 0,
        areaSqm: null,
        description: `${title}\n\nImportado de ${absoluteUrl}`,
        images: []
      } satisfies ImportRow;
    })
    .filter(Boolean)
    .slice(0, 40) as ImportRow[];
}

export async function importListingsFromPortal(formData: FormData) {
  const portalUrl = String(formData.get('url') ?? '').trim();
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta/importar');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,professional_plan,creci_verified,full_name,company_name,phone,email')
    .eq('id', user.id)
    .single();

  if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type)) {
    redirect('/mi-cuenta/importar?error=professional');
  }

  if (!isSafePublicUrl(portalUrl)) {
    redirect('/mi-cuenta/importar?error=portal_url');
  }

  const response = await fetch(portalUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,*/*',
      'user-agent': USER_AGENT
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    redirect('/mi-cuenta/importar?error=portal_fetch');
  }

  const html = (await response.text()).slice(0, 6_000_000);
  const rows = parseRowsFromPortalHtml(html, portalUrl).slice(0, MAX_IMPORT_ROWS);

  if (rows.length === 0) {
    redirect('/mi-cuenta/importar?error=portal_empty');
  }

  await insertImportedRows(rows);
  revalidatePath('/mi-cuenta');
  redirect(`/mi-cuenta/importar?success=${rows.length}&source=portal`);
}
