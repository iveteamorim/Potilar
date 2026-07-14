'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHighlightPrice, type FeaturedPlanId } from '@/lib/plans';
import { slugify } from '@/lib/slugify';

function cleanPhone(value: string) {
  return value.replace(/\D/g, '');
}

function isValidBrazilMobilePhone(value: string) {
  const digits = cleanPhone(value);
  return digits.length === 11 && digits[2] === '9';
}

function parseLanguages(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateProfessionalProfile(formData: FormData) {
  const displayName = String(formData.get('company_name') ?? '').trim();
  const creci = String(formData.get('creci') ?? '').trim();
  const languages = parseLanguages(String(formData.get('languages') ?? ''));
  const bio = String(formData.get('bio') ?? '').trim();

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,public_slug,creci,full_name,company_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type)) {
    redirect('/mi-cuenta?profile_error=not_professional');
  }

  const creciChanged = (profile.creci ?? '') !== creci;
  const nextSlug = profile.public_slug || slugify(displayName || profile.company_name || profile.full_name || user.id);
  const updatePayload: Record<string, string | string[] | boolean | null> = {
    public_slug: nextSlug,
    company_name: displayName || null,
    creci: creci || null,
    bio: bio || null,
    languages,
    ...(creciChanged ? { creci_verified: false, creci_verified_at: null } : {})
  };

  let { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);

  if (error && /languages|creci_verified|creci_verified_at|schema cache|column/i.test(error.message)) {
    const { languages: _languages, creci_verified: _verified, creci_verified_at: _verifiedAt, ...fallbackPayload } = updatePayload;
    const fallback = await supabase.from('profiles').update(fallbackPayload).eq('id', user.id);
    error = fallback.error;
  }

  if (error) {
    redirect(`/mi-cuenta?profile_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/mi-cuenta/perfil');
  if (nextSlug) revalidatePath(`/anunciante/${nextSlug}`);
  redirect('/mi-cuenta?profile_success=1');
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

  if (!id || !['7_days', '15_days', '30_days'].includes(plan)) {
    redirect('/mi-cuenta?highlight_error=missing');
  }

  const supabase = createClient();
  const paymentAmount = getHighlightPrice(plan as FeaturedPlanId);

  const { error } = await supabase.rpc('request_listing_highlight', {
    listing_id: id,
    new_featured_plan: plan,
    new_featured_payment_amount: paymentAmount
  });

  if (error) {
    if (/INVALID_FEATURED_PLAN|featured_plan|constraint/i.test(error.message)) {
      redirect('/mi-cuenta?highlight_error=sql_highlight_15_days');
    }
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

export async function cancelProfessionalSubscription(formData: FormData) {
  const confirmation = String(formData.get('confirmation') ?? '').trim().toUpperCase();

  if (confirmation !== 'CANCELAR') {
    redirect('/mi-cuenta?subscription_error=confirm');
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta');
  }

  const adminSupabase = createAdminClient();
  const { data: subscription } = await adminSupabase
    .from('professional_plan_subscriptions')
    .select('provider_subscription_id, metadata')
    .eq('user_id', user.id)
    .maybeSingle();

  const now = new Date().toISOString();

  if (subscription?.provider_subscription_id && process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    await fetch(`https://api.mercadopago.com/preapproval/${subscription.provider_subscription_id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'cancelled' })
    }).catch(() => null);
  }

  const { error: subscriptionError } = await adminSupabase
    .from('professional_plan_subscriptions')
    .update({
      status: 'cancelled',
      metadata: { ...(subscription?.metadata ?? {}), cancelled_by_user: true, cancelled_at: now },
      cancelled_at: now,
      updated_at: now
    })
    .eq('user_id', user.id);

  if (subscriptionError) {
    redirect(`/mi-cuenta?subscription_error=${encodeURIComponent(subscriptionError.message)}`);
  }

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({
      account_type: 'particular',
      professional_plan: null
    })
    .eq('id', user.id);

  if (profileError) {
    redirect(`/mi-cuenta?subscription_error=${encodeURIComponent(profileError.message)}`);
  }

  revalidatePath('/mi-cuenta');
  redirect('/mi-cuenta?subscription_cancelled=1');
}

export async function requestAccountDeletion(formData: FormData) {
  const confirmation = String(formData.get('confirmation') ?? '').trim().toUpperCase();

  if (confirmation !== 'EXCLUIR') {
    redirect('/mi-cuenta?account_delete_error=confirm');
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mi-cuenta');
  }

  const now = new Date().toISOString();
  await supabase
    .from('listings')
    .update({ status: 'paused', updated_at: now })
    .eq('owner_id', user.id);

  const { error } = await supabase
    .from('profiles')
    .update({
      account_type: 'particular',
      professional_plan: null,
      public_slug: null,
      company_name: null,
      bio: null
    })
    .eq('id', user.id);

  if (error) {
    redirect(`/mi-cuenta?account_delete_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/mi-cuenta');
  revalidatePath('/imoveis');
  revalidatePath('/');
  redirect('/mi-cuenta?account_delete_requested=1');
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
