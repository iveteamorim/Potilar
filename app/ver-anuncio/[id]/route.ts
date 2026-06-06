import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractListingIdFromSlug } from '@/lib/fetchApprovedListings';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_PREFIX_PATTERN = /^[0-9a-f-]{4,}$/i;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const requestUrl = new URL(_request.url);
  const fallbackSlug = requestUrl.searchParams.get('slug')?.trim();
  const safeFallbackSlug = fallbackSlug && /^[a-z0-9-]+$/i.test(fallbackSlug) ? fallbackSlug.toLowerCase() : null;

  if (!id || id === 'undefined' || id === 'null') {
    return NextResponse.redirect(new URL('/imoveis', _request.url));
  }

  if (!UUID_PATTERN.test(id) && !ID_PREFIX_PATTERN.test(id)) {
    return NextResponse.redirect(new URL(`/imoveis/${id}`, _request.url));
  }

  try {
    const supabase = createClient();
    const normalizedId = id.toLowerCase();

    if (UUID_PATTERN.test(id)) {
      const byId = await supabase.rpc('get_public_approved_listing_by_id', {
        listing_id: normalizedId
      });

      if (!byId.error && byId.data?.[0]?.slug) {
        return NextResponse.redirect(new URL(`/imoveis/${byId.data[0].slug}`, _request.url));
      }
    }

    const allPublic = await supabase.rpc('get_public_approved_listings');
    const lookupData = allPublic.error
      ? (
          await supabase
            .from('listings')
            .select('id, slug')
            .eq('status', 'approved')
            .limit(500)
        ).data
      : allPublic.data;

    const listing = lookupData?.find((item: { id: string; slug?: string | null }) =>
      String(item.id).toLowerCase().replace(/-/g, '').startsWith(normalizedId.replace(/-/g, ''))
    );

    if (listing?.slug) {
      return NextResponse.redirect(new URL(`/imoveis/${listing.slug}`, _request.url));
    }
  } catch {
    // Fall through to slug fallback.
  }

  if (safeFallbackSlug) {
    return NextResponse.redirect(new URL(`/imoveis/${safeFallbackSlug}`, _request.url));
  }

  const listingIdFromSlug = safeFallbackSlug ? extractListingIdFromSlug(safeFallbackSlug) : null;
  if (listingIdFromSlug) {
    return NextResponse.redirect(new URL(`/imoveis/${listingIdFromSlug}`, _request.url));
  }

  return NextResponse.redirect(new URL('/imoveis', _request.url));
}
