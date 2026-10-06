import { NextRequest, NextResponse } from 'next/server';
import { QR_CARD_CONTENT, recordQrScan } from '@/lib/qrScans';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.info('[Potilar QR] cartao-anunciar route hit before insert');
  await recordQrScan(request, QR_CARD_CONTENT.anunciar);
  return NextResponse.redirect(new URL('/anunciar', request.url), 302);
}

export async function HEAD(request: NextRequest) {
  return NextResponse.redirect(new URL('/anunciar', request.url), 302);
}
