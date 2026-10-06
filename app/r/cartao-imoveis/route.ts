import { NextRequest, NextResponse } from 'next/server';
import { QR_CARD_CONTENT, recordQrScan } from '@/lib/qrScans';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await recordQrScan(request, QR_CARD_CONTENT.imoveis);
  return NextResponse.redirect(new URL('/imoveis', request.url), 302);
}

export async function HEAD(request: NextRequest) {
  return NextResponse.redirect(new URL('/imoveis', request.url), 302);
}
