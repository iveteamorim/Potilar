import { NextResponse } from 'next/server';
import { AI_CREDIT_ACTIONS } from '@/lib/aiCredits';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Entre na sua conta para usar creditos de IA.' }, { status: 401 });
  }

  const action = AI_CREDIT_ACTIONS.professionalListing;
  const { data, error } = await supabase.rpc('consume_ai_credits', {
    p_amount: action.credits,
    p_description: action.label,
    p_metadata: { action: action.key }
  });

  if (error) {
    const message = /INSUFFICIENT_AI_CREDITS/i.test(error.message)
      ? 'Voce nao tem creditos de IA suficientes. Compre creditos em Minha conta.'
      : 'Nao foi possivel consumir creditos de IA. Verifique se o SQL de creditos foi aplicado no Supabase.';

    return NextResponse.json({ error: message }, { status: 402 });
  }

  return NextResponse.json({ ok: true, balance: data ?? 0 });
}
