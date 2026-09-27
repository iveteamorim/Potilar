import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeNewsTrackEvent } from '@/lib/newsAnalytics';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const normalized = normalizeNewsTrackEvent(body);

  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('track_news_event', {
    p_slug: normalized.event.slug,
    p_kind: normalized.event.kind,
    p_surface: normalized.event.surface,
    p_share_channel: normalized.event.shareChannel
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data !== true) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
