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
  };

  const publicSlug = body.public_slug ? slugify(body.public_slug) : '';
  if (!publicSlug) {
    return NextResponse.json({ error: 'Endereco publico invalido' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
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

  const { error } = await supabase
    .from('profiles')
    .update({
      public_slug: publicSlug,
      company_name: body.company_name ?? null,
      bio: body.bio ?? null
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ public_slug: publicSlug });
}
