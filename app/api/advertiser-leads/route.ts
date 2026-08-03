import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return 'Não foi possível salvar o contato.';
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = clean(body.name);
  const whatsapp = clean(body.whatsapp);
  const email = clean(body.email).toLowerCase();
  const city = clean(body.city);
  const advertiserType = clean(body.advertiserType);
  const propertyType = clean(body.propertyType);
  const message = clean(body.message);
  const source = clean(body.source) || 'site';

  if (name.length < 2) {
    return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 });
  }

  if (whatsapp.length < 8) {
    return NextResponse.json({ error: 'Informe um WhatsApp válido.' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
  }

  if (!city || !advertiserType || !propertyType) {
    return NextResponse.json({ error: 'Preencha cidade, perfil e tipo de imóvel.' }, { status: 400 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const { error } = await supabase.from('advertiser_leads').insert({
      name,
      whatsapp,
      email: email || null,
      city,
      advertiser_type: advertiserType,
      property_type: propertyType,
      message: message || null,
      source
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
