import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CLEARED_HIGHLIGHT_FIELDS } from '@/lib/listingLifecycle';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: expiredListings, error: expiredListingsError } = await supabase
      .from('listings')
      .update({ status: 'paused', updated_at: nowIso })
      .eq('status', 'approved')
      .lt('listing_expires_at', nowIso)
      .select('id');

    if (expiredListingsError) {
      throw expiredListingsError;
    }

    const { data: expiredHighlights, error: expiredHighlightsError } = await supabase
      .from('listings')
      .update({
        ...CLEARED_HIGHLIGHT_FIELDS,
        updated_at: nowIso
      })
      .eq('featured_payment_status', 'confirmed')
      .not('featured_expires_at', 'is', null)
      .lt('featured_expires_at', nowIso)
      .select('id');

    if (expiredHighlightsError) {
      throw expiredHighlightsError;
    }

    return NextResponse.json({
      ok: true,
      pausedListings: expiredListings?.length ?? 0,
      clearedHighlights: expiredHighlights?.length ?? 0,
      ranAt: nowIso
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to expire listings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
