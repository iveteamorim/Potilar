import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const QR_CARD_CAMPAIGN = 'cartao_rn_2026';
export const QR_CARD_CONTENT = {
  anunciar: 'frente_anunciar',
  imoveis: 'verso_buscar'
} as const;

export type QrCardContent = (typeof QR_CARD_CONTENT)[keyof typeof QR_CARD_CONTENT];
type HeaderReader = Pick<Headers, 'get'>;

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|telegrambot|bingpreview|linkchecker|uptimerobot|pingdom|curl|wget|python-requests|go-http-client|headless|lighthouse|pagespeed/i;

function getQrScanSkipReason(headers: HeaderReader, method = 'GET') {
  if (method.toUpperCase() === 'HEAD') return 'head_request';

  const userAgent = headers.get('user-agent') ?? '';
  const purpose = headers.get('purpose') ?? headers.get('sec-purpose') ?? '';
  const fetchMode = headers.get('sec-fetch-mode') ?? '';
  const nextRouterPrefetch = headers.get('next-router-prefetch') ?? '';

  if (purpose.toLowerCase().includes('prefetch')) return 'prefetch_purpose';
  if (purpose.toLowerCase().includes('prerender')) return 'prerender_purpose';
  if (fetchMode.toLowerCase() === 'prefetch') return 'prefetch_fetch_mode';
  if (nextRouterPrefetch === '1') return 'next_router_prefetch';
  if (userAgent && BOT_USER_AGENT_PATTERN.test(userAgent)) return 'bot_user_agent';
  return null;
}

export function isObviousBot(request: NextRequest) {
  return Boolean(getQrScanSkipReason(request.headers, request.method));
}

export async function recordQrScan(request: NextRequest, content: QrCardContent) {
  return recordQrScanFromHeaders(request.headers, content, request.method);
}

export async function recordQrScanFromHeaders(headers: HeaderReader, content: QrCardContent, method = 'GET') {
  const skipReason = getQrScanSkipReason(headers, method);
  if (skipReason) {
    console.info('[Potilar QR] Scan skipped before insert', {
      campaign: QR_CARD_CAMPAIGN,
      content,
      method,
      reason: skipReason
    });
    return;
  }

  try {
    let clientType = 'service_role';
    const supabase = (() => {
      try {
        return createAdminClient();
      } catch (error) {
        clientType = 'public_server_client';
        console.error('[Potilar QR] Service role unavailable, falling back to public insert client', {
          campaign: QR_CARD_CAMPAIGN,
          content,
          message: error instanceof Error ? error.message : String(error)
        });
        // Local/dev can still rely on the public insert policy when service_role is absent.
        return createClient();
      }
    })();

    const { data, error } = await supabase
      .from('qr_scans')
      .insert({
        campaign: QR_CARD_CAMPAIGN,
        content
      })
      .select();

    if (error) {
      console.error('[Potilar QR] Insert failed before redirect', {
        campaign: QR_CARD_CAMPAIGN,
        content,
        clientType,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return;
    }

    console.info('[Potilar QR] Insert result before redirect', {
      campaign: QR_CARD_CAMPAIGN,
      content,
      clientType,
      rowCount: data?.length ?? 0,
      data
    });
  } catch (error) {
    console.error('[Potilar QR] Unexpected insert exception before redirect', {
      campaign: QR_CARD_CAMPAIGN,
      content,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
