export const NEWS_EVENT_KINDS = ['view', 'share_whatsapp', 'share_copy', 'share_native'] as const;
export const NEWS_SHARE_CHANNELS = ['whatsapp', 'copy', 'native'] as const;
export const NEWS_SURFACES = ['article', 'card'] as const;
export const NEWS_SHARE_MARKERS = {
  wa: 'whatsapp',
  cp: 'copy',
  ns: 'native'
} as const;

export type NewsEventKind = (typeof NEWS_EVENT_KINDS)[number];
export type NewsShareChannel = (typeof NEWS_SHARE_CHANNELS)[number];
export type NewsSurface = (typeof NEWS_SURFACES)[number];
export type NewsShareAction = NewsShareChannel;
export type NewsShareMarker = keyof typeof NEWS_SHARE_MARKERS;

export type NormalizedNewsEvent = {
  slug: string;
  kind: NewsEventKind;
  surface: NewsSurface | null;
  shareChannel: NewsShareChannel | null;
};

export type NewsArticleMetrics = {
  views: number;
  shareActions: number;
  shareWhatsapp: number;
  shareCopy: number;
  shareNative: number;
  visitsFromShare: number;
  visitsFromWhatsapp: number;
  visitsFromCopy: number;
  visitsFromNative: number;
};

export type NewsTrackError =
  | 'invalid_slug'
  | 'invalid_kind'
  | 'invalid_surface'
  | 'invalid_share_channel'
  | 'unpublished';

const SHARE_MARKER_BY_CHANNEL: Record<NewsShareChannel, NewsShareMarker> = {
  whatsapp: 'wa',
  copy: 'cp',
  native: 'ns'
};

export function emptyNewsArticleMetrics(): NewsArticleMetrics {
  return {
    views: 0,
    shareActions: 0,
    shareWhatsapp: 0,
    shareCopy: 0,
    shareNative: 0,
    visitsFromShare: 0,
    visitsFromWhatsapp: 0,
    visitsFromCopy: 0,
    visitsFromNative: 0
  };
}

export function isNewsEventKind(value: unknown): value is NewsEventKind {
  return typeof value === 'string' && (NEWS_EVENT_KINDS as readonly string[]).includes(value);
}

export function isNewsShareChannel(value: unknown): value is NewsShareChannel {
  return typeof value === 'string' && (NEWS_SHARE_CHANNELS as readonly string[]).includes(value);
}

export function isNewsSurface(value: unknown): value is NewsSurface {
  return typeof value === 'string' && (NEWS_SURFACES as readonly string[]).includes(value);
}

export function parseNewsShareMarker(value: unknown): NewsShareChannel | null {
  if (value === 'wa') return 'whatsapp';
  if (value === 'cp') return 'copy';
  if (value === 'ns') return 'native';
  return null;
}

export function buildNewsShareUrl(canonicalUrl: string, channel: NewsShareChannel) {
  const parsed = new URL(canonicalUrl);
  parsed.searchParams.set('s', SHARE_MARKER_BY_CHANNEL[channel]);
  return parsed.toString();
}

export function shareActionToKind(action: NewsShareAction): Exclude<NewsEventKind, 'view'> {
  if (action === 'whatsapp') return 'share_whatsapp';
  if (action === 'copy') return 'share_copy';
  return 'share_native';
}

export function isNativeShareAbortError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
}

export function shouldCountNativeShare(outcome: 'resolved' | 'rejected') {
  return outcome === 'resolved';
}

export function shouldCountCopy(clipboardSucceeded: boolean) {
  return clipboardSucceeded;
}

export function canTrackPublishedNewsArticle(article: { status?: string | null } | null | undefined) {
  return article?.status === 'published';
}

function normalizeOptionalString(value: unknown) {
  if (value == null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeNewsTrackEvent(input: unknown): { ok: true; event: NormalizedNewsEvent } | { ok: false; error: NewsTrackError } {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'invalid_slug' };
  }

  const body = input as {
    slug?: unknown;
    kind?: unknown;
    surface?: unknown;
    shareChannel?: unknown;
  };

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug) {
    return { ok: false, error: 'invalid_slug' };
  }

  if (!isNewsEventKind(body.kind)) {
    return { ok: false, error: 'invalid_kind' };
  }

  const surfaceValue = normalizeOptionalString(body.surface);
  const channelValue = normalizeOptionalString(body.shareChannel);

  if (surfaceValue === undefined) {
    return { ok: false, error: 'invalid_surface' };
  }
  if (channelValue === undefined) {
    return { ok: false, error: 'invalid_share_channel' };
  }

  if (body.kind === 'view') {
    if (surfaceValue !== null) {
      return { ok: false, error: 'invalid_surface' };
    }
    if (channelValue !== null && !isNewsShareChannel(channelValue)) {
      return { ok: false, error: 'invalid_share_channel' };
    }

    return {
      ok: true,
      event: {
        slug,
        kind: 'view',
        surface: null,
        shareChannel: channelValue
      }
    };
  }

  if (!isNewsSurface(surfaceValue)) {
    return { ok: false, error: 'invalid_surface' };
  }
  if (channelValue !== null && !isNewsShareChannel(channelValue)) {
    return { ok: false, error: 'invalid_share_channel' };
  }

  return {
    ok: true,
    event: {
      slug,
      kind: body.kind,
      surface: surfaceValue,
      shareChannel: null
    }
  };
}

export function authorizeNewsTrack(
  input: unknown,
  article: { status?: string | null } | null | undefined
): { ok: true; event: NormalizedNewsEvent } | { ok: false; error: NewsTrackError } {
  const normalized = normalizeNewsTrackEvent(input);
  if (!normalized.ok) {
    return normalized;
  }
  if (!canTrackPublishedNewsArticle(article)) {
    return { ok: false, error: 'unpublished' };
  }
  return normalized;
}

export function aggregateNewsEvents(
  events: Array<{ kind: string; share_channel?: string | null; shareChannel?: string | null }>
): NewsArticleMetrics {
  const metrics = emptyNewsArticleMetrics();

  for (const event of events) {
    const channel = event.shareChannel ?? event.share_channel ?? null;

    if (event.kind === 'view') {
      metrics.views += 1;
      if (channel === 'whatsapp') {
        metrics.visitsFromShare += 1;
        metrics.visitsFromWhatsapp += 1;
      } else if (channel === 'copy') {
        metrics.visitsFromShare += 1;
        metrics.visitsFromCopy += 1;
      } else if (channel === 'native') {
        metrics.visitsFromShare += 1;
        metrics.visitsFromNative += 1;
      }
      continue;
    }

    if (event.kind === 'share_whatsapp') {
      metrics.shareActions += 1;
      metrics.shareWhatsapp += 1;
    } else if (event.kind === 'share_copy') {
      metrics.shareActions += 1;
      metrics.shareCopy += 1;
    } else if (event.kind === 'share_native') {
      metrics.shareActions += 1;
      metrics.shareNative += 1;
    }
  }

  return metrics;
}

export type NewsMetricsRpcRow = {
  article_id?: string;
  views?: number | string | null;
  share_actions?: number | string | null;
  share_whatsapp?: number | string | null;
  share_copy?: number | string | null;
  share_native?: number | string | null;
  visits_from_share?: number | string | null;
  visits_from_whatsapp?: number | string | null;
  visits_from_copy?: number | string | null;
  visits_from_native?: number | string | null;
};

export function metricsFromRpcRow(row: NewsMetricsRpcRow | null | undefined): NewsArticleMetrics {
  const toCount = (value: number | string | null | undefined) => Number(value ?? 0) || 0;
  if (!row) {
    return emptyNewsArticleMetrics();
  }

  return {
    views: toCount(row.views),
    shareActions: toCount(row.share_actions),
    shareWhatsapp: toCount(row.share_whatsapp),
    shareCopy: toCount(row.share_copy),
    shareNative: toCount(row.share_native),
    visitsFromShare: toCount(row.visits_from_share),
    visitsFromWhatsapp: toCount(row.visits_from_whatsapp),
    visitsFromCopy: toCount(row.visits_from_copy),
    visitsFromNative: toCount(row.visits_from_native)
  };
}

export const NEWS_SHARE_HELP_TEXT =
  'Ações de compartilhamento registram a ação no PotiLar; não confirmam que o conteúdo foi enviado ao destinatário.';
