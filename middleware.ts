import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { properties } from '@/data/properties';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host');

  if (host === 'rn-lar.vercel.app' || host === 'viva-rn.vercel.app' || host === 'potilar.vercel.app') {
    const url = request.nextUrl.clone();
    url.hostname = 'potilar.com.br';
    return NextResponse.redirect(url, 301);
  }

  const rootListingCode = pathname.slice(1);
  if (
    !pathname.includes('/', 1) &&
    /^[0-9a-f-]{4,}$/i.test(rootListingCode)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/a/${rootListingCode.replace(/-/g, '').slice(0, 8)}`;
    return NextResponse.redirect(url, 302);
  }

  if (!pathname.startsWith('/imoveis/')) {
    return NextResponse.next();
  }

  const listingCodeFromImoveis = pathname.replace('/imoveis/', '').replace(/\/+$/g, '');
  if (/^[0-9a-f-]{4,}$/i.test(listingCodeFromImoveis) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingCodeFromImoveis)) {
    const url = request.nextUrl.clone();
    url.pathname = `/a/${listingCodeFromImoveis.replace(/-/g, '').slice(0, 8)}`;
    return NextResponse.redirect(url, 302);
  }

  const id = pathname.replace('/imoveis/', '');
  const match = properties.find((item) => item.id === id);

  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = `/imoveis/${match.slug}`;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*']
};
