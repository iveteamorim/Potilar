export async function geocodeListingAddress(parts: {
  street?: string;
  neighborhood?: string;
  community?: string;
  city?: string;
}): Promise<[number, number] | null> {
  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parts)
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { found?: boolean; lat?: number; lng?: number };
    if (!data.found || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return null;

    return [Number(data.lat), Number(data.lng)];
  } catch {
    return null;
  }
}
