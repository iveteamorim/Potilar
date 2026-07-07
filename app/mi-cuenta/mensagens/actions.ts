'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function replyToListingMessage(formData: FormData) {
  const messageId = String(formData.get('messageId') ?? '').trim();
  const reply = String(formData.get('reply') ?? '').trim();

  if (!messageId || reply.length < 2 || reply.length > 2000) {
    return;
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: currentMessage } = await supabase
    .from('listing_messages')
    .select('owner_reply')
    .eq('id', messageId)
    .eq('listing_owner_id', user.id)
    .maybeSingle();

  const previousReply = typeof currentMessage?.owner_reply === 'string' ? currentMessage.owner_reply.trim() : '';
  const nextReply = previousReply ? `${previousReply}\n\n${reply}` : reply;

  await supabase
    .from('listing_messages')
    .update({
      owner_reply: nextReply,
      owner_replied_at: new Date().toISOString(),
      status: 'answered'
    })
    .eq('id', messageId)
    .eq('listing_owner_id', user.id);

  revalidatePath('/mi-cuenta/mensagens');
}

export async function sendListingMessageFollowUp(formData: FormData) {
  const listingId = String(formData.get('listingId') ?? '').trim();
  const ownerId = String(formData.get('ownerId') ?? '').trim();
  const senderName = String(formData.get('senderName') ?? '').trim();
  const senderEmail = String(formData.get('senderEmail') ?? '').trim().toLowerCase();
  const message = String(formData.get('message') ?? '').trim();

  if (!listingId || !ownerId || message.length < 2 || message.length > 2000) {
    return;
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from('listing_messages').insert({
    listing_id: listingId,
    listing_owner_id: ownerId,
    sender_user_id: user.id,
    sender_name: senderName || senderEmail.split('@')[0] || 'Visitante',
    sender_email: senderEmail || user.email || '',
    message
  });

  revalidatePath('/mi-cuenta/mensagens');
}
