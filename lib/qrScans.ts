import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const QR_CARD_CAMPAIGN = 'cartao_rn_2026';
export const QR_CARD_CONTENT = {
  anunciar: 'frente_anunciar',
  imoveis: 'verso_buscar'
} as const;

export type QrCardContent = (typeof QR_CARD_CONTENT)[keyof typeof QR_CARD_CONTENT];

const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|telegrambot|preview|linkchecker|monitor|uptime|curl|wget|python-requests|go-http-client|headless|lighthouse|pagespeed/i;

export function isObviousBot(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';
  const purpose = request.headers.get('purpose') ?? request.headers.get('sec-purpose') ?? '';
  const fetchMode = request.headers.get('sec-fetch-mode') ?? '';

  return (
    !userAgent ||
    BOT_USER_AGENT_PATTERN.test(userAgent) ||
    purpose.toLowerCase().includes('prefetch') ||
    fetchMode.toLowerCase() === 'prefetch'
  );
}

export async function recordQrScan(request: NextRequest, content: QrCardContent) {
  if (isObviousBot(request)) return;

  try {
    const supabase = (() => {
      try {
        return createAdminClient();
      } catch {
        // Local/dev can still rely on the public insert policy when service_role is absent.
        return createClient();
      }
    })();

    await supabase.from('qr_scans').insert({
      campaign: QR_CARD_CAMPAIGN,
      content
    });
  } catch (error) {
    console.error('[Potilar] Failed to record QR scan:', error);
  }
}
