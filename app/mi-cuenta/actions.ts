'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getHighlightPrice, type FeaturedPlanId } from '@/lib/plans';

function cleanPhone(value: string) {
  return value.replace(/\D/g, '');
}

function isValidBrazilMobilePhone(value: string) {
  const digits = cleanPhone(value);
  return digits.length === 11 && digits[2] === '9';
}

export async function updateListingContact(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const contactName = String(formData.get('contact_name') ?? '').trim();
  const contactPhone = String(formData.get('contact_phone') ?? '').trim();
  const contactEmail = String(formData.get('contact_email') ?? '').trim();
  const methods = formData.getAll('contact_methods').map(String);

  if (!id || methods.length === 0) {
    redirect('/mi-cuenta?contact_error=missing');
  }

  if ((methods.includes('phone') || methods.includes('whatsapp')) && !isValidBrazilMobilePhone(contactPhone)) {
    redirect('/mi-cuenta?contact_error=phone');
  }

  const supabase = createClient();
  const { error } = await supabase.rpc('update_listing_contact', {
    listing_id: id,
    new_contact_name: contactName || null,
    new_contact_phone: methods.includes('phone') ? contactPhone : null,
    new_contact_whatsapp: methods.includes('whatsapp') ? contactPhone : null,
    new_contact_email: methods.includes('email') ? contactEmail : null,
    new_contact_methods: methods
  });

  if (error) {
    redirect(`/mi-cuenta?contact_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  redirect('/mi-cuenta?contact_success=1');
}

export async function setMainImage(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const imageUrl = String(formData.get('image_url') ?? '');

  if (!id || !imageUrl) {
    redirect('/mi-cuenta?image_error=missing');
  }

  const supabase = createClient();
  const { error } = await supabase.rpc('set_listing_main_image', {
    listing_id: id,
    image_url: imageUrl
  });

  if (error) {
    redirect(`/mi-cuenta?image_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/imoveis');
  revalidatePath('/');
  redirect('/mi-cuenta?image_success=1');
}

export async function requestListingHighlight(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const plan = String(formData.get('featured_plan') ?? '');

  if (!id || !['7_days', '30_days', 'super_30_days'].includes(plan)) {
    redirect('/mi-cuenta?highlight_error=missing');
  }

  const supabase = createClient();
  const { data: listing } = await supabase.from('listings').select('transaction').eq('id', id).single();
  const paymentAmount = getHighlightPrice(plan as FeaturedPlanId);

  const { error } = await supabase.rpc('request_listing_highlight', {
    listing_id: id,
    new_featured_plan: plan,
    new_featured_payment_amount: paymentAmount
  });

  if (error) {
    redirect(`/mi-cuenta?highlight_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/imoveis');
  revalidatePath('/');
  redirect(`/mi-cuenta/pagar/${id}?tipo=highlight`);
}

export async function cancelListingHighlight(formData: FormData) {
  const id = String(formData.get('id') ?? '');

  if (!id) {
    redirect('/mi-cuenta?highlight_error=missing');
  }

  const supabase = createClient();
  const { error } = await supabase.rpc('cancel_listing_highlight', {
    listing_id: id
  });

  if (error) {
    redirect(`/mi-cuenta?highlight_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/imoveis');
  revalidatePath('/');
  redirect('/mi-cuenta?highlight_cancelled=1');
}

export async function markPixProofSent(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const kind = String(formData.get('kind') ?? 'listing');

  if (!id || !['listing', 'highlight'].includes(kind)) {
    redirect('/mi-cuenta?payment_error=missing');
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta');
  }

  const update =
    kind === 'highlight'
      ? { featured_payment_proof_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : { payment_proof_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from('listings')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) {
    redirect(`/mi-cuenta?payment_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  redirect('/mi-cuenta?payment_proof=1');
}

export async function updateOwnListingStatus(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const action = String(formData.get('action') ?? '');

  if (!id || !['pause', 'reactivate'].includes(action)) {
    redirect('/mi-cuenta?listing_error=status');
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta');
  }

  const rpcName = action === 'pause' ? 'owner_pause_listing' : 'owner_reactivate_listing';
  const { error } = await supabase.rpc(rpcName, { listing_id: id });

  if (error) {
    redirect(`/mi-cuenta?listing_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/imoveis');
  revalidatePath('/');
  redirect(action === 'pause' ? '/mi-cuenta?listing_paused=1' : '/mi-cuenta?listing_reactivated=1');
}

export async function deleteOwnListing(formData: FormData) {
  const id = String(formData.get('id') ?? '');

  if (!id) {
    redirect('/mi-cuenta?listing_error=missing');
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta');
  }

  const { error } = await supabase.rpc('owner_delete_listing', { listing_id: id });

  if (error) {
    redirect(`/mi-cuenta?listing_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/imoveis');
  revalidatePath('/');
  redirect('/mi-cuenta?listing_deleted=1');
}
