import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RN_BOUNDS = {
  minLat: -7.05,
  maxLat: -4.65,
  minLng: -38.85,
  maxLng: -34.7
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isInsideRn(lat: number, lng: number) {
  return lat >= RN_BOUNDS.minLat && lat <= RN_BOUNDS.maxLat && lng >= RN_BOUNDS.minLng && lng <= RN_BOUNDS.maxLng;
}

function buildQueries(parts: {
  street?: string;
  neighborhood?: string;
  community?: string;
  city?: string;
}) {
  const city = parts.city?.trim();
  const neighborhood = parts.neighborhood?.trim();
  const community = parts.community?.trim();
  const street = parts.street?.trim();
  const base = [city, 'Rio Grande do Norte', 'Brasil'].filter(Boolean).join(', ');

  return [
    [street, neighborhood, community, base].filter(Boolean).join(', '),
    [street, neighborhood, base].filter(Boolean).join(', '),
    [neighborhood, community, base].filter(Boolean).join(', '),
    [neighborhood, base].filter(Boolean).join(', '),
    [community, base].filter(Boolean).join(', '),
    base
  ].filter((query, index, all) => query && all.indexOf(query) === index);
}

async function fetchNominatim(query: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'br');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('q', query);

  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'User-Agent': 'Potilar/1.0 (https://potilar.com.br)'
    },
    next: { revalidate: 60 * 60 * 24 * 30 }
  });

  if (!response.ok) return null;

  const results = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const result = results[0];
  if (!result?.lat || !result.lon) return null;

  const lat = Number(result.lat);
  const lng = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInsideRn(lat, lng)) return null;

  return {
    lat,
    lng,
    label: result.display_name ?? query
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      street?: string;
      neighborhood?: string;
      community?: string;
      city?: string;
    };
    const queries = buildQueries(body);

    if (queries.length === 0) {
      return NextResponse.json({ found: false });
    }

    const supabase = createClient();

    for (const query of queries) {
      const normalizedQuery = normalize(query);

      try {
        const { data: cached } = await supabase
          .from('geocoding_cache')
          .select('lat,lng,label')
          .eq('normalized_query', normalizedQuery)
          .maybeSingle();

        if (cached?.lat && cached.lng) {
          return NextResponse.json({
            found: true,
            source: 'cache',
            lat: cached.lat,
            lng: cached.lng,
            label: cached.label
          });
        }
      } catch {
        // Cache table may not exist yet. Geocoding still works without it.
      }

      const result = await fetchNominatim(query);
      if (!result) continue;

      try {
        await supabase.from('geocoding_cache').upsert({
          normalized_query: normalizedQuery,
          query,
          lat: result.lat,
          lng: result.lng,
          label: result.label
        });
      } catch {
        // Keep the geocoding result even if cache write fails.
      }

      return NextResponse.json({
        found: true,
        source: 'nominatim',
        ...result
      });
    }

    return NextResponse.json({ found: false });
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  }
}
