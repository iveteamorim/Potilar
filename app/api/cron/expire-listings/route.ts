import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
        featured_plan: null,
        featured_payment_status: 'not_requested',
        featured_payment_amount: null,
        featured_starts_at: null,
        featured_expires_at: null,
        updated_at: nowIso
      })
      .eq('featured_payment_status', 'confirmed')
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
