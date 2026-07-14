import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDemoProfessionalProfile } from '@/data/demoProfessionalProfiles';

const demoProfiles = new Set([
  'joao-medeiros-corretor-demo',
  'praia-sul-imoveis-demo',
  'natal-prime-imobiliaria-demo'
]);

export function GET(request: NextRequest) {
  const profileSlug = request.nextUrl.searchParams.get('profile') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const profile = demoProfiles.has(profileSlug) ? getDemoProfessionalProfile(profileSlug) : null;
  const expectedToken = process.env.DEMO_LOGIN_TOKEN || 'potilar-corretor-demo';

  if (!profile || token !== expectedToken) {
    return NextResponse.redirect(new URL('/login?demo=erro', request.url));
  }

  const response = NextResponse.redirect(new URL(`/mi-cuenta/demo/${profile.public_slug}`, request.url));
  response.cookies.set('potilar_demo_profile', profile.public_slug, {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return response;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const profileSlug = String(formData.get('profile') ?? '');
  const password = String(formData.get('password') ?? '');
  const profile = demoProfiles.has(profileSlug) ? getDemoProfessionalProfile(profileSlug) : null;
  const expectedPassword = process.env.DEMO_LOGIN_PASSWORD || process.env.DEMO_LOGIN_TOKEN || 'potilar-corretor-demo';

  if (!profile || password !== expectedPassword) {
    return NextResponse.redirect(new URL('/admin/demo-login?error=1', request.url));
  }

  const response = NextResponse.redirect(new URL(`/mi-cuenta/demo/${profile.public_slug}`, request.url));
  response.cookies.set('potilar_demo_profile', profile.public_slug, {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return response;
}
