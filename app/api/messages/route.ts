import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function isValidEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function isMissingModernChatError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : String(error);
  return message.toLowerCase().includes('chat_conversations') || message.toLowerCase().includes('chat_messages');
}

async function sendModernMessage(client: ReturnType<typeof createClient>, input: {
  conversationId?: string;
  listingId?: string;
  ownerId?: string;
  userId: string;
  senderName: string;
  senderEmail: string;
  message: string;
}) {
  let targetConversationId = input.conversationId;

  if (!targetConversationId) {
    const { data: existingConversation, error: existingError } = await client
      .from('chat_conversations')
      .select('id')
      .eq('listing_id', input.listingId)
      .eq('seeker_user_id', input.userId)
      .maybeSingle();

    if (existingError) throw existingError;
    targetConversationId = existingConversation?.id;

    if (!targetConversationId) {
      const { data: createdConversation, error: conversationError } = await client
        .from('chat_conversations')
        .insert({
          listing_id: input.listingId,
          listing_owner_id: input.ownerId,
          seeker_user_id: input.userId,
          seeker_name: input.senderName,
          seeker_email: input.senderEmail
        })
        .select('id')
        .single();

      if (conversationError) throw conversationError;
      targetConversationId = createdConversation.id;
    }
  }

  const { error: messageError } = await client.from('chat_messages').insert({
    conversation_id: targetConversationId,
    sender_user_id: input.userId,
    body: input.message
  });

  if (messageError) throw messageError;

  await client
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', targetConversationId);

  return targetConversationId;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const body = (await request.json()) as {
    conversationId?: string;
    listingId?: string;
    ownerId?: string;
    name?: string;
    email?: string;
    message?: string;
  };

  const conversationId = body.conversationId?.trim();
  const listingId = body.listingId?.trim();
  let ownerId = body.ownerId?.trim();
  const senderEmail = body.email?.trim().toLowerCase() ?? '';
  const senderName = body.name?.trim() || senderEmail.split('@')[0] || 'Visitante';
  const message = body.message?.trim() ?? '';

  if (!conversationId && !listingId) {
    return NextResponse.json({ error: 'Anuncio obrigatorio' }, { status: 400 });
  }

  if (!conversationId && senderName.length < 2) {
    return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 });
  }

  if (!conversationId && !isValidEmail(senderEmail)) {
    return NextResponse.json({ error: 'Informe um email valido.' }, { status: 400 });
  }

  if (message.length < 2 || message.length > 2000) {
    return NextResponse.json({ error: 'Escreva uma mensagem entre 2 e 2000 caracteres.' }, { status: 400 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Entre na sua conta para enviar mensagem.' }, { status: 401 });
  }

  if (!conversationId && listingId) {
    try {
      const adminSupabase = createAdminClient();
      const { data: listing, error: listingError } = await adminSupabase
        .from('listings')
        .select('owner_id')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;
      ownerId = listing?.owner_id || ownerId;
    } catch {
      const { data: listing } = await supabase
        .from('listings')
        .select('owner_id')
        .eq('id', listingId)
        .single();

      ownerId = listing?.owner_id || ownerId;
    }
  }

  if (!conversationId && !ownerId) {
    return NextResponse.json({ error: 'Anunciante obrigatorio' }, { status: 400 });
  }

  let modernError: unknown;

  try {
    const adminSupabase = createAdminClient();
    const targetConversationId = await sendModernMessage(adminSupabase as any, {
      conversationId,
      listingId,
      ownerId,
      userId: user.id,
      senderName,
      senderEmail,
      message
    });
    return NextResponse.json({ ok: true, conversationId: targetConversationId });
  } catch (error) {
    modernError = error;
    // Try modern chat with the authenticated client before falling back to the legacy table.
  }

  try {
    const targetConversationId = await sendModernMessage(supabase, {
      conversationId,
      listingId,
      ownerId,
      userId: user.id,
      senderName,
      senderEmail,
      message
    });
    return NextResponse.json({ ok: true, conversationId: targetConversationId });
  } catch (error) {
    modernError = error;
    // Fall back to the legacy message table only if the modern chat SQL is not available.
  }

  if (!isMissingModernChatError(modernError)) {
    const errorMessage = modernError instanceof Error ? modernError.message : 'Não foi possível enviar a mensagem.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  const insertPayload = {
    listing_id: listingId,
    listing_owner_id: ownerId,
    sender_user_id: user.id,
    sender_name: senderName,
    sender_email: senderEmail,
    message
  };

  let error;

  try {
    const adminSupabase = createAdminClient();
    const result = await adminSupabase.from('listing_messages').insert(insertPayload);
    error = result.error;
  } catch {
    const result = await supabase.from('listing_messages').insert(insertPayload);
    error = result.error;
  }

  if (error) {
    const policyError = error.message.toLowerCase().includes('row-level security') || error.message.toLowerCase().includes('violates check');
    return NextResponse.json(
      {
        error: policyError
          ? 'Supabase bloqueou esta mensagem. Aplique o SQL para permitir mensagens curtas.'
          : error.message
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
