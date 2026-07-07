'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PLANS, getHighlightDurationDays } from '@/lib/plans';

async function ensureAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Nao autenticado');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error('Sem permissao de admin');

  return supabase;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getListingDurationDays(transaction?: string | null) {
  return transaction === 'Temporada' ? PLANS.listing.seasonalDurationDays : PLANS.listing.standardDurationDays;
}

export async function updateListingStatus(formData: FormData) {
  try {
    const id = String(formData.get('id') || '');
    const status = String(formData.get('status') || '');

    if (!id || !['approved', 'rejected', 'paused'].includes(status)) {
      throw new Error('Status invalido');
    }

    const supabase = await ensureAdmin();

    if (status === 'approved') {
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('is_paid,payment_status')
        .eq('id', id)
        .single();

      if (listingError || !listing) {
        throw new Error(listingError?.message ?? 'Anuncio nao encontrado');
      }

      if (listing.is_paid && listing.payment_status !== 'confirmed') {
        throw new Error('Confirme o Pix do anuncio antes de aprovar.');
      }
    }

    const { error: rpcError } = await supabase.rpc('moderate_listing', {
      listing_id: id,
      new_status: status
    });

    if (rpcError) {
      const { data, error: updateError } = await supabase
        .from('listings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id,status')
        .single();

      if (updateError || !data) {
        throw new Error(updateError?.message ?? rpcError.message);
      }
    }

    revalidatePath('/admin');
    revalidatePath('/imoveis');
    revalidatePath('/');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin?success=1');
}

export async function setMainImage(formData: FormData) {
  try {
    const id = String(formData.get('id') || '');
    const imageUrl = String(formData.get('image_url') || '');

    if (!id || !imageUrl) {
      throw new Error('Imagem invalida');
    }

    const supabase = await ensureAdmin();
    const { error } = await supabase.rpc('set_listing_main_image', {
      listing_id: id,
      image_url: imageUrl
    });

    if (error) throw new Error(error.message);

    revalidatePath('/admin');
    revalidatePath('/imoveis');
    revalidatePath('/');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin?success=1');
}

export async function updateListingPaymentStatus(formData: FormData) {
  try {
    const id = String(formData.get('id') || '');
    const action = String(formData.get('action') || '');

    if (!id || !['confirm', 'cancel'].includes(action)) {
      throw new Error('Pagamento invalido');
    }

    const supabase = await ensureAdmin();
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id,transaction,status')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      throw new Error(listingError?.message ?? 'Anuncio nao encontrado');
    }

    const now = new Date();
    const update =
      action === 'confirm'
        ? {
            payment_status: 'confirmed',
            payment_confirmed_at: now.toISOString(),
            listing_expires_at: addDays(now, getListingDurationDays(listing.transaction)).toISOString(),
            status: listing.status === 'rejected' ? 'pending' : listing.status,
            updated_at: now.toISOString()
          }
        : {
            payment_status: 'pix_pending',
            payment_confirmed_at: null,
            listing_expires_at: null,
            updated_at: now.toISOString()
          };

    const { data, error } = await supabase
      .from('listings')
      .update(update)
      .eq('id', id)
      .select('id,payment_status')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Nao foi possivel atualizar o pagamento');
    }

    revalidatePath('/admin');
    revalidatePath('/mi-cuenta');
    revalidatePath('/imoveis');
    revalidatePath('/');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin?success=1');
}

export async function updateHighlightStatus(formData: FormData) {
  try {
    const id = String(formData.get('id') || '');
    const action = String(formData.get('action') || '');

    if (!id || !['confirm', 'cancel'].includes(action)) {
      throw new Error('Destaque invalido');
    }

    const supabase = await ensureAdmin();
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id,featured_plan')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      throw new Error(listingError?.message ?? 'Anuncio nao encontrado');
    }

    const now = new Date();
    const update =
      action === 'confirm'
        ? {
            featured_payment_status: 'confirmed',
            featured_starts_at: now.toISOString(),
            featured_expires_at: addDays(now, getHighlightDurationDays(listing.featured_plan)).toISOString(),
            updated_at: now.toISOString()
          }
        : {
            featured_plan: null,
            featured_payment_status: 'not_requested',
            featured_payment_amount: null,
            featured_starts_at: null,
            featured_expires_at: null,
            updated_at: now.toISOString()
          };

    const { data, error } = await supabase
      .from('listings')
      .update(update)
      .eq('id', id)
      .select('id,featured_payment_status')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Nao foi possivel atualizar o destaque');
    }

    revalidatePath('/admin');
    revalidatePath('/imoveis');
    revalidatePath('/');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin?success=1');
}

export async function updateCreciVerification(formData: FormData) {
  try {
    const ownerId = String(formData.get('owner_id') || '');
    const action = String(formData.get('action') || '');

    if (!ownerId || !['verify', 'unverify'].includes(action)) {
      throw new Error('Verificacao CRECI invalida');
    }

    const supabase = await ensureAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        creci_verified: action === 'verify',
        creci_verified_at: action === 'verify' ? new Date().toISOString() : null
      })
      .eq('id', ownerId)
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Nao foi possivel atualizar o CRECI');
    }

    revalidatePath('/admin');
    revalidatePath('/imoveis');
    revalidatePath('/');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin?success=1');
}
