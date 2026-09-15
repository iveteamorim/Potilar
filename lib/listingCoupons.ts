import type { SupabaseClient } from '@supabase/supabase-js';

export const SECOND_LISTING_COUPON = {
  code: 'POTILAR2',
  discountedAmount: 9.9,
  maxTotalUses: 25,
  maxUsesPerUser: 2,
  minListingNumber: 2,
  maxListingNumber: 3
} as const;

export function normalizeCouponCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? '';
}

export function isSecondListingCoupon(value?: string | null) {
  return normalizeCouponCode(value) === SECOND_LISTING_COUPON.code;
}

type CouponListing = {
  id: string;
  owner_id: string;
  transaction: string;
  payment_status: string;
  payment_amount: number | null;
};

export async function validateSecondListingCoupon(
  supabase: SupabaseClient,
  listing: CouponListing,
  userId: string,
  couponCode?: string | null
) {
  if (!isSecondListingCoupon(couponCode)) {
    return { ok: false as const, error: 'Cupom invalido.' };
  }

  if (listing.owner_id !== userId || listing.payment_status !== 'pix_pending') {
    return { ok: false as const, error: 'Cupom indisponivel para este anuncio.' };
  }

  if (listing.transaction === 'Temporada') {
    return { ok: false as const, error: 'Cupom valido apenas para anuncio comum.' };
  }

  const { count: totalUses, error: totalError } = await supabase
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_code', SECOND_LISTING_COUPON.code);

  if (totalError) {
    return { ok: false as const, error: 'Nao foi possivel validar o cupom.' };
  }

  if ((totalUses ?? 0) >= SECOND_LISTING_COUPON.maxTotalUses) {
    return { ok: false as const, error: 'Cupom esgotado.' };
  }

  const { count: userUses, error: userError } = await supabase
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_code', SECOND_LISTING_COUPON.code)
    .eq('user_id', userId);

  if (userError) {
    return { ok: false as const, error: 'Nao foi possivel validar o cupom.' };
  }

  if ((userUses ?? 0) >= SECOND_LISTING_COUPON.maxUsesPerUser) {
    return { ok: false as const, error: 'Voce ja usou este cupom.' };
  }

  const { count: listingCount, error: listingCountError } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  if (listingCountError) {
    return { ok: false as const, error: 'Nao foi possivel validar seus anuncios.' };
  }

  const listingNumber = listingCount ?? 0;
  if (
    listingNumber < SECOND_LISTING_COUPON.minListingNumber ||
    listingNumber > SECOND_LISTING_COUPON.maxListingNumber
  ) {
    return { ok: false as const, error: 'Cupom valido apenas para o 2o ou 3o anuncio da conta.' };
  }

  const amountBefore = Number(listing.payment_amount ?? 0);
  if (amountBefore <= SECOND_LISTING_COUPON.discountedAmount) {
    return { ok: false as const, error: 'Cupom indisponivel para este valor.' };
  }

  return {
    ok: true as const,
    code: SECOND_LISTING_COUPON.code,
    amountBefore,
    amountAfter: SECOND_LISTING_COUPON.discountedAmount
  };
}
