import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).toLowerCase().replace(/[^0-9a-f]/g, '');

  if (!code || code.length < 4) {
    return NextResponse.redirect(new URL('/imoveis', request.url), 302);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_public_approved_listings');

    const lookupData = error
      ? (
          await supabase
            .from('listings')
            .select('id, slug')
            .eq('status', 'approved')
            .limit(500)
        ).data
      : data;

    const listing = lookupData?.find((item: { id: string; slug?: string | null }) =>
      String(item.id).toLowerCase().replace(/-/g, '').startsWith(code)
    );

    if (listing?.slug) {
      return NextResponse.redirect(new URL(`/imoveis/${listing.slug}`, request.url), 302);
    }

    if (listing?.id) {
      return NextResponse.redirect(new URL(`/imoveis/${listing.id}`, request.url), 302);
    }
  } catch {
    // Fall through to the listings page when the database cannot resolve the short code.
  }

  return NextResponse.redirect(new URL('/imoveis', request.url), 302);
}
