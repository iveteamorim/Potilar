import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type StatsAction = 'view' | 'whatsapp';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const listingId = params.id;
  if (!listingId) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: StatsAction };
  const action: StatsAction = body.action === 'whatsapp' ? 'whatsapp' : 'view';
  const supabase = createClient();

  const rpcName = action === 'whatsapp' ? 'track_listing_whatsapp_click' : 'track_listing_view';
  const { error } = await supabase.rpc(rpcName, { p_listing_id: listingId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
