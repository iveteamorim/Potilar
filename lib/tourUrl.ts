/**
 * Normalizes public 3D tour URLs (Matterport, Kuula, etc.) for iframe embeds.
 */
export function normalizeTourUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    const host = url.hostname.toLowerCase();
    const matterportModelFromPath = url.pathname.match(/\/(?:discover\/space|models)\/([^/]+)/i)?.[1];

    if (host.includes('matterport.com')) {
      const modelId = url.searchParams.get('m') || matterportModelFromPath;
      if (modelId) {
        return `https://my.matterport.com/show/?m=${modelId}&play=1`;
      }
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function hasTourUrl(tourUrl?: string | null) {
  return Boolean(tourUrl?.trim());
}
