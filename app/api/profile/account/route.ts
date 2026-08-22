import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isValidContactPhone, normalizeContactPhone } from '@/lib/contactPhone';

type ProfileAccountBody = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as ProfileAccountBody;
  const fullName = String(body.full_name ?? '').trim();
  const nextEmail = String(body.email ?? '').trim().toLowerCase();
  const phone = normalizeContactPhone(String(body.phone ?? ''));

  if (!fullName) {
    return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 });
  }

  if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return NextResponse.json({ error: 'Informe um email válido.' }, { status: 400 });
  }

  if (phone && !isValidContactPhone(phone)) {
    return NextResponse.json({ error: 'Informe o telefone com DDI, por exemplo +55 84 99999-9999.' }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null
    })
    .eq('id', user.id);

  if (profileError) {
    return NextResponse.json({ error: 'Não foi possível salvar os dados.' }, { status: 500 });
  }

  let emailConfirmationSent = false;
  if (nextEmail !== (user.email ?? '').toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });

    if (emailError) {
      return NextResponse.json({ error: emailError.message || 'Não foi possível alterar o email.' }, { status: 500 });
    }

    emailConfirmationSent = true;
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/mi-cuenta/perfil');

  return NextResponse.json({ ok: true, emailConfirmationSent });
}
