import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { properties } from '@/data/properties';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/imoveis/')) {
    return NextResponse.next();
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
  matcher: ['/imoveis/:path*']
};
