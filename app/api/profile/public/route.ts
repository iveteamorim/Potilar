import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/slugify';

type ProfilePublicBody = {
  public_slug?: string;
  company_name?: string | null;
  bio?: string | null;
  creci?: string | null;
  languages?: string[] | null;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
};

function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as ProfilePublicBody;

  const publicSlug = body.public_slug ? slugify(body.public_slug) : '';
  if (!publicSlug) {
    return NextResponse.json({ error: 'Endereço público inválido' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,creci')
    .eq('id', user.id)
    .single();

  if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type)) {
    return NextResponse.json({ error: 'Perfil público disponível apenas para corretores e imobiliárias' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .ilike('public_slug', publicSlug)
    .neq('id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Este endereço público já está em uso' }, { status: 409 });
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

  const selectCols = 'id,public_slug,banner_image_url,profile_image_url';

  let { data: updated, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)
    .select(selectCols)
    .maybeSingle();

  if (error && /languages|creci_verified|creci_verified_at|schema cache|column/i.test(error.message)) {
    const { languages: _languages, creci_verified: _verified, creci_verified_at: _verifiedAt, ...fallbackPayload } = updatePayload;
    const fallback = await supabase
      .from('profiles')
      .update(fallbackPayload)
      .eq('id', user.id)
      .select(selectCols)
      .maybeSingle();
    updated = fallback.data;
    error = fallback.error;
  }

  // RLS can return success with 0 rows; verify and fall back to service role.
  if (!error && !updated) {
    const admin = tryCreateAdminClient();
    if (admin) {
      const adminUpdate = await admin
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select(selectCols)
        .maybeSingle();
      updated = adminUpdate.data;
      error = adminUpdate.error;
    }
  }

  if (error) {
    const message = /INVALID_CPF|INVALID_CNPJ|CRECI_REQUIRED/i.test(error.message)
      ? 'Não foi possível salvar a imagem por validação do perfil. Execute fix_profile_banner_update.sql no Supabase.'
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json(
      { error: 'Não foi possível gravar a capa. Confira permissões do perfil ou execute fix_profile_banner_update.sql.' },
      { status: 500 }
    );
  }

  if ('banner_image_url' in body && (updated.banner_image_url ?? null) !== (body.banner_image_url ?? null)) {
    return NextResponse.json({ error: 'A capa não foi persistida. Tente novamente.' }, { status: 500 });
  }

  if ('profile_image_url' in body && (updated.profile_image_url ?? null) !== (body.profile_image_url ?? null)) {
    return NextResponse.json({ error: 'A foto não foi persistida. Tente novamente.' }, { status: 500 });
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/mi-cuenta/perfil');
  revalidatePath(`/anunciante/${publicSlug}`);
  if (updated.public_slug && updated.public_slug !== publicSlug) {
    revalidatePath(`/anunciante/${updated.public_slug}`);
  }

  return NextResponse.json({
    public_slug: updated.public_slug ?? publicSlug,
    banner_image_url: updated.banner_image_url ?? null,
    profile_image_url: updated.profile_image_url ?? null
  });
}
