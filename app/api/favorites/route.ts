import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ favorites: [] });
  }

  const { data, error } = await supabase.from('listing_favorites').select('listing_id').eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    favorites: (data ?? []).map((row) => row.listing_id)
  });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as { listingId?: string; favorite?: boolean };
  const listingId = body.listingId?.trim();

  if (!listingId) {
    return NextResponse.json({ error: 'listingId obrigatorio' }, { status: 400 });
  }

  if (body.favorite) {
    const { error } = await supabase.from('listing_favorites').upsert({
      user_id: user.id,
      listing_id: listingId
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from('listing_favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, listingId, favorite: Boolean(body.favorite) });
}
