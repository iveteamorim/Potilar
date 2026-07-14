import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as {
    public_slug?: string;
    company_name?: string | null;
    bio?: string | null;
    creci?: string | null;
    languages?: string[] | null;
    profile_image_url?: string | null;
    banner_image_url?: string | null;
  };

  const publicSlug = body.public_slug ? slugify(body.public_slug) : '';
  if (!publicSlug) {
    return NextResponse.json({ error: 'Endereco publico invalido' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,creci')
    .eq('id', user.id)
    .single();

  if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type)) {
    return NextResponse.json({ error: 'Perfil publico disponivel apenas para corretores e imobiliarias' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .ilike('public_slug', publicSlug)
    .neq('id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Este endereco publico ja esta em uso' }, { status: 409 });
  }

  const nextCreci = body.creci?.trim() || null;
  const creciChanged = 'creci' in body && (profile.creci ?? null) !== nextCreci;

  const updatePayload: Record<string, string | string[] | null | boolean> = {
    public_slug: publicSlug,
    ...(creciChanged ? { creci_verified: false, creci_verified_at: null } : {})
  };

  if ('company_name' in body) updatePayload.company_name = body.company_name ?? null;
  if ('bio' in body) updatePayload.bio = body.bio ?? null;
  if ('creci' in body) updatePayload.creci = nextCreci;
  if ('languages' in body) updatePayload.languages = Array.isArray(body.languages) ? body.languages : [];
  if ('profile_image_url' in body) updatePayload.profile_image_url = body.profile_image_url ?? null;
  if ('banner_image_url' in body) updatePayload.banner_image_url = body.banner_image_url ?? null;

  let { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id);

  if (error && /languages|creci_verified|creci_verified_at|schema cache|column/i.test(error.message)) {
    const { languages: _languages, creci_verified: _verified, creci_verified_at: _verifiedAt, ...fallbackPayload } = updatePayload;
    const fallback = await supabase
      .from('profiles')
      .update(fallbackPayload)
      .eq('id', user.id);
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ public_slug: publicSlug });
}
