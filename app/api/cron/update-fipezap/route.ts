import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchFipeZapCityRows } from '@/lib/fipezapSync';
import { invalidateMarketCityCache } from '@/lib/marketCityCache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await fetchFipeZapCityRows('RN');
    const syncedAt = new Date().toISOString();
    const supabase = createAdminClient();

    const payload = rows.map((row) => ({
      city_key: row.cityKey,
      city: row.city,
      state: row.state,
      sale_sqm: row.saleSqm,
      rent_sqm: row.rentSqm,
      source: row.source,
      reference_period: row.referencePeriod,
      reference_date: row.referenceDate,
      synced_at: syncedAt
    }));

    const { error } = await supabase.from('market_city_benchmarks').upsert(payload, { onConflict: 'city_key' });

    if (error) {
      throw error;
    }

    invalidateMarketCityCache();

    return NextResponse.json({
      ok: true,
      syncedAt,
      cities: rows.map((row) => ({
        city: row.city,
        saleSqm: row.saleSqm,
        rentSqm: row.rentSqm,
        referencePeriod: row.referencePeriod
      }))
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Failed to sync FipeZAP';
    const details =
      typeof error === 'object' && error && 'details' in error
        ? String((error as { details?: unknown }).details)
        : null;
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: unknown }).code)
        : null;

    return NextResponse.json({ error: message, details, code }, { status: 500 });
  }
}
