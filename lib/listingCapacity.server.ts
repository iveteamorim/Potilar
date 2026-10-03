import { createAdminClient } from '@/lib/supabase/admin';
import { PLANS } from '@/lib/plans';
import {
  CAPACITY_ACTIVE_STATUSES,
  buildCapacitySnapshot,
  countCapacityActiveListings,
  getAvulsoOffer,
  getFreeActiveLimit,
  normalizeAccountType,
  resolveListingCapacity,
  type CapacityListing,
  type CapacitySnapshot
} from '@/lib/listingCapacity';

const CAPACITY_LISTING_SELECT =
  'id,status,updated_at,created_at,publication_kind,payment_status,payment_confirmed_at,listing_expires_at,payment_amount,is_paid,transaction';

type ProfileCapacityRow = {
  account_type?: string | null;
  professional_plan?: string | null;
  role?: string | null;
};

export async function loadCapacityListings(userId: string): Promise<CapacityListing[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('listings').select(CAPACITY_LISTING_SELECT).eq('owner_id', userId);

  if (!error) {
    return (data ?? []) as CapacityListing[];
  }

  if (!/publication_kind|column|schema cache/i.test(error.message)) {
    throw new Error(error.message);
  }

  const fallback = await supabase
    .from('listings')
    .select('id,status,updated_at,created_at,payment_status,payment_confirmed_at,listing_expires_at,payment_amount,is_paid,transaction')
    .eq('owner_id', userId);

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }

  return (fallback.data ?? []) as CapacityListing[];
}

export async function getListingCapacitySnapshot(
  userId: string,
  profile: ProfileCapacityRow,
  options?: { excludeListingId?: string | null; isSeasonal?: boolean }
): Promise<CapacitySnapshot> {
  const listings = await loadCapacityListings(userId);
  const isAdmin = profile.role === 'admin';
  const activeCount = countCapacityActiveListings(listings, options?.excludeListingId);

  return buildCapacitySnapshot({
    accountType: profile.account_type,
    professionalPlan: profile.professional_plan,
    activeCount,
    isAdmin,
    isSeasonal: options?.isSeasonal,
    listings
  });
}

export async function applyProfessionalPlanLoss(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc('apply_professional_plan_loss', { target_user_id: userId });
  if (!error) return;

  if (!/apply_professional_plan_loss|could not find|schema cache|function/i.test(error.message)) {
    throw new Error(error.message);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_type,professional_plan')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const freeLimit = getFreeActiveLimit(profile?.account_type);
  const listings = await loadCapacityListings(userId);
  const keepIds = new Set(
    listings
      .filter((listing) => CAPACITY_ACTIVE_STATUSES.includes(listing.status as (typeof CAPACITY_ACTIVE_STATUSES)[number]))
      .sort((left, right) => {
        const leftUpdated = new Date(left.updated_at || left.created_at || 0).getTime();
        const rightUpdated = new Date(right.updated_at || right.created_at || 0).getTime();
        if (rightUpdated !== leftUpdated) return rightUpdated - leftUpdated;
        return String(right.id ?? '').localeCompare(String(left.id ?? ''));
      })
      .slice(0, freeLimit)
      .map((listing) => listing.id)
  );

  const demoteIds = listings
    .filter((listing) => CAPACITY_ACTIVE_STATUSES.includes(listing.status as (typeof CAPACITY_ACTIVE_STATUSES)[number]))
    .map((listing) => listing.id)
    .filter((id): id is string => Boolean(id) && !keepIds.has(id));

  await supabase.from('profiles').update({ professional_plan: null }).eq('id', userId);

  if (demoteIds.length > 0) {
    const now = new Date().toISOString();
    await supabase.from('listings').update({ status: 'needs_renewal', updated_at: now }).in('id', demoteIds);
  }
}

export async function reactivateListingWithCapacity(userId: string, listingId: string) {
  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_type,professional_plan,role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? 'Perfil nao encontrado.');
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id,owner_id,status,is_paid,payment_status,transaction')
    .eq('id', listingId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (listingError || !listing) {
    throw new Error(listingError?.message ?? 'Anuncio nao encontrado.');
  }

  if (!['paused', 'needs_renewal'].includes(String(listing.status))) {
    throw new Error('Este anuncio nao pode ser reativado.');
  }

  const snapshot = await getListingCapacitySnapshot(userId, profile, { excludeListingId: listingId });
  const decision = resolveListingCapacity({
    accountType: profile.account_type,
    professionalPlan: profile.professional_plan,
    activeCount: snapshot.activeCount,
    isAdmin: profile.role === 'admin',
    isSeasonal: listing.transaction === 'Temporada'
  });

  if (decision.action === 'require_avulso') {
    const now = new Date().toISOString();
    const offer =
      listing.transaction === 'Temporada'
        ? { amount: PLANS.listing.seasonalPrice, durationDays: PLANS.listing.seasonalDurationDays }
        : getAvulsoOffer(normalizeAccountType(profile.account_type));
    const update = {
      payment_status: 'pix_pending',
      is_paid: true,
      payment_amount: offer.amount,
      publication_kind: 'avulso',
      updated_at: now
    };

    let { error } = await supabase.from('listings').update(update).eq('id', listingId).eq('owner_id', userId);
    if (error && /publication_kind|column|schema cache/i.test(error.message)) {
      const fallback = await supabase
        .from('listings')
        .update({
          payment_status: 'pix_pending',
          is_paid: true,
          payment_amount: offer.amount,
          updated_at: now
        })
        .eq('id', listingId)
        .eq('owner_id', userId);
      error = fallback.error;
    }

    if (error) {
      throw new Error(error.message);
    }

    return {
      status: 'payment_required' as const,
      listingId,
      amount: offer.amount,
      durationDays: offer.durationDays,
      paymentKind: listing.transaction === 'Temporada' ? 'seasonal' : 'listing'
    };
  }

  const nextStatus = listing.is_paid && listing.payment_status !== 'confirmed' ? 'pending' : 'approved';
  const now = new Date().toISOString();
  const update = {
    status: nextStatus,
    publication_kind: decision.publicationKind,
    updated_at: now
  };

  let { error } = await supabase.from('listings').update(update).eq('id', listingId).eq('owner_id', userId);
  if (error && /publication_kind|column|schema cache/i.test(error.message)) {
    const fallback = await supabase
      .from('listings')
      .update({ status: nextStatus, updated_at: now })
      .eq('id', listingId)
      .eq('owner_id', userId);
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return { status: 'reactivated' as const, nextStatus };
}
