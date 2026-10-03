import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getListingCapacitySnapshot } from '@/lib/listingCapacity.server';

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,professional_plan,role')
    .eq('id', user.id)
    .maybeSingle();

  const snapshot = await getListingCapacitySnapshot(user.id, profile ?? {}, {
    excludeListingId: searchParams.get('excludeListingId'),
    isSeasonal: searchParams.get('seasonal') === '1'
  });

  return NextResponse.json(snapshot);
}
