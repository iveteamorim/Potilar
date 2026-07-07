import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const body = (await request.json()) as {
    messageId?: string;
    reply?: string;
  };

  const messageId = body.messageId?.trim();
  const reply = body.reply?.trim() ?? '';

  if (!messageId) {
    return NextResponse.json({ error: 'Mensagem obrigatoria.' }, { status: 400 });
  }

  if (reply.length < 2 || reply.length > 2000) {
    return NextResponse.json({ error: 'Escreva uma mensagem entre 2 e 2000 caracteres.' }, { status: 400 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Entre na sua conta para enviar mensagem.' }, { status: 401 });
  }

  const { data: currentMessage, error: currentError } = await supabase
    .from('listing_messages')
    .select('owner_reply')
    .eq('id', messageId)
    .eq('listing_owner_id', user.id)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }

  const previousReply = typeof currentMessage?.owner_reply === 'string' ? currentMessage.owner_reply.trim() : '';
  const nextReply = previousReply ? `${previousReply}\n\n${reply}` : reply;

  const { error } = await supabase
    .from('listing_messages')
    .update({
      owner_reply: nextReply,
      owner_replied_at: new Date().toISOString(),
      status: 'answered'
    })
    .eq('id', messageId)
    .eq('listing_owner_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
