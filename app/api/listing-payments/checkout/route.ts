import { NextResponse } from 'next/server';
import { PLANS, getHighlightDurationDays, getHighlightLabel, getHighlightPrice, type FeaturedPlanId } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeCouponCode, validateSecondListingCoupon } from '@/lib/listingCoupons';

type PaymentKind = 'listing' | 'seasonal' | 'highlight' | 'renewal30' | 'renewal60';
type ResolvedPayment = {
  product: 'listing_highlight' | 'listing_renewal' | 'seasonal_listing' | 'listing_publication';
  title: string;
  amount: number;
  description: string;
  renewal_days?: number;
};

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) return configured.startsWith('http') ? configured : `https://${configured}`;
  return new URL(request.url).origin;
}

function resolvePayment(listing: any, kind: PaymentKind): ResolvedPayment | null {
  if (kind === 'highlight') {
    if (!listing.featured_plan || listing.featured_payment_status !== 'pix_pending') return null;
    if (!['7_days', '15_days', '30_days'].includes(listing.featured_plan)) return null;
    const planId = listing.featured_plan as FeaturedPlanId;
    return {
      product: 'listing_highlight',
      title: `Potilar - ${getHighlightLabel(planId)}`,
      amount: Number(listing.featured_payment_amount ?? getHighlightPrice(planId)),
      description: `Destaque do anúncio por ${getHighlightDurationDays(planId)} dias.`
    };
  }

  if (kind === 'renewal30') {
    return {
      product: 'listing_renewal',
      title: `Potilar - Renovação temporada ${PLANS.listing.seasonalRenewal30DurationDays} dias`,
      amount: PLANS.listing.seasonalRenewal30Price,
      description: 'Renovação de anúncio de temporada.',
      renewal_days: PLANS.listing.seasonalRenewal30DurationDays
    };
  }

  if (kind === 'renewal60') {
    return {
      product: 'listing_renewal',
      title: `Potilar - Renovação temporada ${PLANS.listing.seasonalRenewal60DurationDays} dias`,
      amount: PLANS.listing.seasonalRenewal60Price,
      description: 'Renovação de anúncio de temporada.',
      renewal_days: PLANS.listing.seasonalRenewal60DurationDays
    };
  }

  if (listing.payment_status !== 'pix_pending') return null;

  return {
    product: kind === 'seasonal' ? 'seasonal_listing' : 'listing_publication',
    title: kind === 'seasonal' ? 'Potilar - Anúncio de temporada' : 'Potilar - Publicação de anúncio',
    amount: Number(listing.payment_amount ?? 0),
    description: kind === 'seasonal' ? 'Anúncio para temporada por 60 dias.' : 'Publicação de anúncio adicional.'
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Entre na sua conta para pagar.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const listingId = String(body.listingId ?? '');
  const kind = String(body.kind ?? '') as PaymentKind;
  const couponCode = normalizeCouponCode(body.couponCode);

  if (!listingId || !['listing', 'seasonal', 'highlight', 'renewal30', 'renewal60'].includes(kind)) {
    return NextResponse.json({ error: 'Pagamento invalido.' }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id,title,owner_id,transaction,payment_status,payment_amount,featured_plan,featured_payment_status,featured_payment_amount')
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (listingError || !listing) {
    return NextResponse.json({ error: listingError?.message ?? 'Anúncio não encontrado.' }, { status: 404 });
  }

  let payment = resolvePayment(listing, kind);

  if (!payment || payment.amount <= 0) {
    return NextResponse.json({ error: 'Este pagamento não está pendente.' }, { status: 400 });
  }

  let appliedCoupon: { code: string; amountBefore: number; amountAfter: number } | null = null;
  if (couponCode) {
    if (kind !== 'listing') {
      return NextResponse.json({ error: 'Cupom valido apenas para publicacao de anuncio comum.' }, { status: 400 });
    }

    const coupon = await validateSecondListingCoupon(createAdminClient(), listing, user.id, couponCode);
    if (!coupon.ok) {
      return NextResponse.json({ error: coupon.error }, { status: 400 });
    }

    appliedCoupon = {
      code: coupon.code,
      amountBefore: coupon.amountBefore,
      amountAfter: coupon.amountAfter
    };
    payment = {
      ...payment,
      amount: coupon.amountAfter,
      description: `${payment.description} Cupom ${coupon.code} aplicado.`
    };
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Mercado Pago ainda não está configurado.' }, { status: 501 });
  }

  const baseUrl = getBaseUrl(request);
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [
        {
          id: `${payment.product}:${listing.id}`,
          title: payment.title,
          description: payment.description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: payment.amount
        }
      ],
      external_reference: `${payment.product}:${user.id}:${listing.id}`,
      metadata: {
        product: payment.product,
        user_id: user.id,
        listing_id: listing.id,
        payment_kind: kind,
        renewal_days: payment.renewal_days ?? null,
        coupon_code: appliedCoupon?.code ?? null,
        coupon_amount_before: appliedCoupon?.amountBefore ?? null,
        coupon_amount_after: appliedCoupon?.amountAfter ?? null
      },
      back_urls: {
        success: `${baseUrl}/mi-cuenta?pagamento=sucesso`,
        pending: `${baseUrl}/mi-cuenta?pagamento=pendente`,
        failure: `${baseUrl}/mi-cuenta/pagar/${listing.id}?tipo=${kind}&pagamento=erro`
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      auto_return: 'approved'
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json({ error: data.message ?? 'Não foi possível criar o pagamento.' }, { status: 502 });
  }

  return NextResponse.json({
    id: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point
  });
}
