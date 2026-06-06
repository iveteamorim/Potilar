import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl.clone();
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  const next = nextParam?.startsWith('/') ? nextParam : '/login?confirmed=1';
  const redirectUrl = new URL(next, requestUrl.origin);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
