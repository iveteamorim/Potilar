import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAlertLabel, type SavedSearchFilters } from '@/lib/searchAlerts';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('listing_search_alerts')
    .select('id,label,filters,is_active,last_seen_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as { filters?: SavedSearchFilters; label?: string };
  const filters = body.filters ?? {};
  const label = body.label?.trim() || buildAlertLabel(filters);

  const { data, error } = await supabase
    .from('listing_search_alerts')
    .insert({
      user_id: user.id,
      label,
      filters,
      is_active: true,
      last_seen_at: new Date().toISOString()
    })
    .select('id,label,filters,is_active,last_seen_at,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data });
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; is_active?: boolean; mark_seen?: boolean };
  if (!body.id) {
    return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
  if (body.mark_seen) updates.last_seen_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('listing_search_alerts')
    .update(updates)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select('id,label,filters,is_active,last_seen_at,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
  }

  const { error } = await supabase.from('listing_search_alerts').delete().eq('id', id).eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
