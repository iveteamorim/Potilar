import { NextResponse } from 'next/server';
import { getAiCreditPackage } from '@/lib/aiCredits';
import { PLANS, getHighlightDurationDays, getProfessionalAccountType, getProfessionalPlan, type ProfessionalPlanId } from '@/lib/plans';
import { buildProfessionalProfileSlug } from '@/lib/publicProfile';
import { createAdminClient } from '@/lib/supabase/admin';

function getPaymentId(url: string, body: any) {
  const searchParams = new URL(url).searchParams;
  return (
    searchParams.get('data.id') ||
    searchParams.get('id') ||
    body?.data?.id ||
    body?.id ||
    body?.resource?.split('/').pop() ||
    null
  );
}

function getEventType(url: string, body: any) {
  const searchParams = new URL(url).searchParams;
  return String(body?.type || body?.topic || searchParams.get('type') || searchParams.get('topic') || '').toLowerCase();
}

function parseExternalReference(value: string | null | undefined) {
  const [product, userId, packageId] = String(value ?? '').split(':');
  if (!product || !userId || !packageId) return null;
  return { product, userId, packageId };
}

function mapPreapprovalStatus(status: string | null | undefined) {
  if (status === 'authorized') return 'active';
  if (status === 'paused') return 'past_due';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getListingDurationDays(transaction?: string | null) {
  return transaction === 'Temporada' ? PLANS.listing.seasonalDurationDays : PLANS.listing.standardDurationDays;
}

function cleanPhone(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '');
}

function hasValidPhone(value?: string | null) {
  const raw = String(value ?? '').trim();
  const digits = cleanPhone(raw);
  return raw.startsWith('+') && digits.length >= 8 && digits.length <= 15;
}

function hasBlockedContent(value?: string | null) {
  const text = String(value ?? '').toLowerCase();
  return [
    'golpe',
    'documento falso',
    'sem contrato',
    'aposta',
    'cassino',
    'conteudo adulto',
    'conteúdo adulto'
  ].some((term) => text.includes(term));
}

async function needsManualListingReview(supabase: ReturnType<typeof createAdminClient>, listing: any) {
  const issues = [];
  const images = Array.isArray(listing.images) ? listing.images : [];
  const contactPhone = listing.contact_whatsapp || listing.contact_phone;
  const price = Number(listing.price ?? 0);

  if (!listing.title || String(listing.title).trim().length < 8) issues.push('titulo_curto');
  if (!listing.description || String(listing.description).trim().length < 30) issues.push('descricao_curta');
  if (!listing.location || String(listing.location).trim().length < 2) issues.push('cidade_ausente');
  if (images.length < 6) issues.push('poucas_fotos');
  if (!hasValidPhone(contactPhone) && !listing.contact_email) issues.push('contato_invalido');
  if (!Number.isFinite(price) || price <= 0 || price > 100000000) issues.push('preco_suspeito');
  if (hasBlockedContent(`${listing.title}\n${listing.description}\n${(listing.features ?? []).join('\n')}`)) issues.push('conteudo_bloqueado');

  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', listing.owner_id)
    .eq('title', listing.title)
    .eq('location', listing.location)
    .eq('price', listing.price)
    .neq('id', listing.id)
    .in('status', ['pending', 'approved', 'paused']);

  if ((count ?? 0) > 0) issues.push('possivel_duplicado');

  return issues;
}

async function activateProfessionalProfile({
  planId,
  userId
}: {
  planId: ProfessionalPlanId;
  userId: string;
}) {
  const selectedPlan = getProfessionalPlan(planId);
  if (!selectedPlan) {
    return { error: 'Plano profissional invalido.', status: 400 };
  }

  const supabase = createAdminClient();
  const accountType = getProfessionalAccountType(planId);
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,company_name,public_slug')
    .eq('id', userId)
    .maybeSingle();

  const publicSlug = profile?.public_slug || buildProfessionalProfileSlug(profile ?? {}, userId);
  const profileUpdate = {
    account_type: accountType,
    professional_plan: planId,
    public_slug: publicSlug,
    company_name: accountType === 'imobiliaria' ? profile?.company_name || profile?.full_name || null : profile?.company_name || null
  };

  let { error: profileError } = await supabase.from('profiles').update(profileUpdate).eq('id', userId);

  if (profileError && /professional_plan|schema cache|column/i.test(profileError.message)) {
    const fallback = await supabase
      .from('profiles')
      .update({
        account_type: accountType,
        public_slug: publicSlug,
        company_name: profileUpdate.company_name
      })
      .eq('id', userId);
    profileError = fallback.error;
  }

  if (profileError) {
    return { error: profileError.message, status: 500 };
  }

  return { ok: true, publicSlug, selectedPlan, accountType, supabase };
}

async function syncProfessionalSubscription({
  preapproval,
  planId,
  userId
}: {
  preapproval: any;
  planId: ProfessionalPlanId;
  userId: string;
}) {
  const activeResult = await activateProfessionalProfile({ planId, userId });

  if ('error' in activeResult) {
    return activeResult;
  }

  const now = new Date().toISOString();
  const status = mapPreapprovalStatus(preapproval.status);
  await activeResult.supabase.from('professional_plan_subscriptions').upsert(
    {
      user_id: userId,
      plan_id: planId,
      status,
      provider: 'mercadopago',
      provider_subscription_id: String(preapproval.id),
      price: activeResult.selectedPlan.price,
      metadata: {
        preapproval_status: preapproval.status,
        reason: preapproval.reason,
        payer_email: preapproval.payer_email
      },
      updated_at: now,
      ...(status === 'cancelled' ? { cancelled_at: now } : {})
    },
    { onConflict: 'user_id' }
  );

  if (status === 'cancelled') {
    await activeResult.supabase
      .from('profiles')
      .update({ account_type: 'particular', professional_plan: null })
      .eq('id', userId);
  }

  return { ok: true, publicSlug: activeResult.publicSlug };
}

async function activateProfessionalPlan({
  payment,
  planId,
  subscriptionId,
  userId
}: {
  payment: any;
  planId: ProfessionalPlanId;
  subscriptionId?: string | null;
  userId: string;
}) {
  const activeResult = await activateProfessionalProfile({ planId, userId });

  if ('error' in activeResult) {
    return activeResult;
  }

  const selectedPlan = activeResult.selectedPlan;
  const supabase = activeResult.supabase;

  await supabase.from('professional_plan_subscriptions').upsert(
    {
      user_id: userId,
      plan_id: planId,
      status: 'active',
      provider: 'mercadopago',
      provider_payment_id: String(payment.id),
      provider_subscription_id: subscriptionId ? String(subscriptionId) : undefined,
      price: selectedPlan.price,
      current_period_started_at: new Date().toISOString(),
      current_period_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        payment_method: payment.payment_method_id,
        status: payment.status,
        subscription_id: subscriptionId ?? null
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );

  const { error: creditsError } = await supabase.rpc('grant_ai_credits', {
    p_user_id: userId,
    p_amount: selectedPlan.aiCredits,
    p_description: `${selectedPlan.label} - melhorias com IA do mes`,
    p_payment_provider: 'mercadopago',
    p_payment_id: String(payment.id),
    p_metadata: {
      plan_id: planId,
      product: 'professional_plan',
      included_credits: selectedPlan.aiCredits,
      price: selectedPlan.price
    }
  });

  if (creditsError) {
    return { error: creditsError.message, status: 500 };
  }

  return { ok: true, publicSlug: activeResult.publicSlug };
}

async function confirmListingPayment({
  listingId,
  payment,
  product,
  renewalDays,
  userId
}: {
  listingId: string;
  payment: any;
  product: string;
  renewalDays?: number | null;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id,owner_id,title,description,features,location,price,images,contact_phone,contact_whatsapp,contact_email,transaction,status,featured_plan,listing_expires_at')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return { error: listingError?.message ?? 'Anúncio não encontrado.', status: 404 };
  }

  if (listing.owner_id !== userId) {
    return { error: 'Pagamento sem permissão para este anúncio.', status: 403 };
  }

  const now = new Date();

  if (product === 'listing_highlight') {
    const days = getHighlightDurationDays(listing.featured_plan);
    const { error } = await supabase
      .from('listings')
      .update({
        featured_payment_status: 'confirmed',
        featured_starts_at: now.toISOString(),
        featured_expires_at: addDays(now, days).toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', listingId);

    if (error) {
      return { error: error.message, status: 500 };
    }

    return { ok: true };
  }

  const baseDate =
    product === 'listing_renewal' && listing.listing_expires_at && new Date(listing.listing_expires_at) > now
      ? new Date(listing.listing_expires_at)
      : now;
  const days = product === 'listing_renewal' ? Number(renewalDays ?? PLANS.listing.seasonalRenewal60DurationDays) : getListingDurationDays(listing.transaction);
  const reviewIssues = product === 'listing_renewal' ? [] : await needsManualListingReview(supabase, listing);
  const nextStatus = product === 'listing_renewal'
    ? listing.status
    : reviewIssues.length > 0
      ? 'pending'
      : 'approved';

  const { error } = await supabase
    .from('listings')
    .update({
      payment_status: 'confirmed',
      payment_confirmed_at: now.toISOString(),
      payment_proof_sent_at: null,
      listing_expires_at: addDays(baseDate, days).toISOString(),
      status: listing.status === 'rejected' ? 'pending' : nextStatus,
      updated_at: now.toISOString()
    })
    .eq('id', listingId);

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Webhook não configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no ambiente.' },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const eventType = getEventType(request.url, body);
  const resourceId = getPaymentId(request.url, body);

  if (!resourceId) {
    return NextResponse.json({ error: 'Recurso ausente' }, { status: 400 });
  }

  if (eventType === 'preapproval' || eventType === 'subscription_preapproval') {
    const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const preapproval = await preapprovalResponse.json().catch(() => ({}));

    if (!preapprovalResponse.ok) {
      return NextResponse.json({ error: preapproval.message ?? 'Não foi possível consultar assinatura.' }, { status: 502 });
    }

    const reference = parseExternalReference(preapproval.external_reference);

    const selectedPlan = getProfessionalPlan(reference?.packageId);

    if (reference?.product !== 'professional_plan' || !reference.userId || !selectedPlan) {
      return NextResponse.json({ ok: true, ignored: true, type: eventType });
    }

    const result = await syncProfessionalSubscription({
      preapproval,
      userId: reference.userId,
      planId: selectedPlan.id as ProfessionalPlanId
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, publicSlug: result.publicSlug, type: eventType });
  }

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payment = await paymentResponse.json().catch(() => ({}));

  if (!paymentResponse.ok) {
    return NextResponse.json({ error: payment.message ?? 'Não foi possível consultar pagamento.' }, { status: 502 });
  }

  if (payment.status !== 'approved') {
    return NextResponse.json({ ok: true, ignored: true, status: payment.status });
  }

  const reference = parseExternalReference(payment.external_reference);
  let product = payment.metadata?.product ?? reference?.product;
  const packageId = payment.metadata?.package_id ?? reference?.packageId;
  let planId = payment.metadata?.plan_id ?? reference?.packageId;
  let userId = payment.metadata?.user_id ?? reference?.userId;
  const subscriptionId =
    payment.metadata?.preapproval_id ||
    payment.metadata?.subscription_id ||
    payment.preapproval_id ||
    payment.subscription_id ||
    payment.point_of_interaction?.transaction_data?.subscription_id ||
    null;

  if ((!userId || !planId) && subscriptionId) {
    const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const preapproval = await preapprovalResponse.json().catch(() => ({}));
    const preapprovalReference = parseExternalReference(preapproval.external_reference);
    product = product ?? preapprovalReference?.product;
    userId = userId ?? preapprovalReference?.userId;
    planId = planId ?? preapprovalReference?.packageId;
  }

  if (product === 'professional_plan') {
    const selectedPlan = getProfessionalPlan(planId);

    if (!userId || !selectedPlan) {
      return NextResponse.json({ error: 'Pagamento sem usuario ou plano valido.' }, { status: 400 });
    }

    const result = await activateProfessionalPlan({
      payment,
      userId,
      planId: selectedPlan.id as ProfessionalPlanId,
      subscriptionId
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, publicSlug: result.publicSlug });
  }

  if (['listing_publication', 'seasonal_listing', 'listing_renewal', 'listing_highlight'].includes(String(product))) {
    const listingId = payment.metadata?.listing_id ?? reference?.packageId;
    const renewalDays = payment.metadata?.renewal_days ? Number(payment.metadata.renewal_days) : null;

    if (!userId || !listingId) {
      return NextResponse.json({ error: 'Pagamento sem usuário ou anúncio válido.' }, { status: 400 });
    }

    const result = await confirmListingPayment({
      payment,
      userId,
      listingId,
      product: String(product),
      renewalDays
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, listingId, product });
  }

  const selectedPackage = getAiCreditPackage(packageId);

  if (!userId || !selectedPackage) {
    return NextResponse.json({ error: 'Pagamento sem usuario ou pacote valido.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: balance, error } = await supabase.rpc('grant_ai_credits', {
    p_user_id: userId,
    p_amount: selectedPackage.credits,
    p_description: `Compra ${selectedPackage.label}`,
    p_payment_provider: 'mercadopago',
    p_payment_id: String(payment.id),
    p_metadata: {
      package_id: selectedPackage.id,
      price: selectedPackage.price,
      payment_method: payment.payment_method_id,
      status: payment.status
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, balance });
}
