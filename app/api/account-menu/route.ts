import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, accountType: null });
  }

  const { data } = await supabase
    .from('profiles')
    .select('account_type,role')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    authenticated: true,
    accountType: data?.account_type ?? 'particular',
    role: data?.role ?? null
  });
}
