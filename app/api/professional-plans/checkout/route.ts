import { NextResponse } from 'next/server';
import { PLANS, getProfessionalPlan, resolveProfessionalBillingMode, type ProfessionalPlanId } from '@/lib/plans';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) return configured.startsWith('http') ? configured : `https://${configured}`;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Entre na sua conta para ativar uma carteira profissional.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const selectedPlan = getProfessionalPlan(String(body.planId ?? ''));

  if (!selectedPlan) {
    return NextResponse.json({ error: 'Plano profissional invalido.' }, { status: 400 });
  }

  if (!user.email) {
    return NextResponse.json({ error: 'Sua conta precisa ter um email para ativar um plano.' }, { status: 400 });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Mercado Pago ainda nao esta configurado.' }, { status: 501 });
  }

  const baseUrl = getBaseUrl(request);
  const portfolioTrial = PLANS.professional.portfolioTrial;
  const planId = selectedPlan.id as ProfessionalPlanId;
  const activationFee = portfolioTrial.activationFees[planId];
  const billingMode = resolveProfessionalBillingMode(process.env.PROFESSIONAL_BILLING_MODE);

  if (billingMode === 'standard_subscription') {
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: `Potilar - ${selectedPlan.label}`,
        payer_email: user.email,
        external_reference: `professional_plan:${user.id}:${planId}`,
        back_url: `${baseUrl}/mi-cuenta?plano=sucesso`,
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        metadata: {
          user_id: user.id,
          plan_id: planId,
          product: 'professional_plan',
          billing_mode: billingMode,
          monthly_price: selectedPlan.price
        },
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: selectedPlan.price,
          currency_id: 'BRL'
        }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({ error: data.message ?? 'Nao foi possivel criar a assinatura.' }, { status: 502 });
    }

    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.from('professional_plan_subscriptions').upsert(
        {
          user_id: user.id,
          plan_id: planId,
          status: 'pending',
          provider: 'mercadopago',
          provider_subscription_id: String(data.id),
          price: selectedPlan.price,
          billing_mode: billingMode,
          subscription_status: 'pending',
          subscription_started_at: null,
          metadata: {
            product: 'professional_plan',
            billing_mode: billingMode,
            preapproval_status: data.status,
            monthly_price: selectedPlan.price,
            init_point_created: true
          },
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );
    } catch {
      // O webhook confirma a assinatura; este registro inicial e apenas conveniencia.
    }

    return NextResponse.json({
      id: data.id,
      billingMode,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    });
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [
        {
          id: `activation-${planId}`,
          title: `Potilar - ${portfolioTrial.activationName}`,
          description: `${selectedPlan.label}: ativacao da carteira hoje e primeira mensalidade somente em ${portfolioTrial.freeDays} dias.`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: activationFee
        }
      ],
      payer: {
        email: user.email
      },
      external_reference: `professional_activation:${user.id}:${planId}`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        product: 'professional_activation',
        billing_mode: billingMode,
        activation_fee: activationFee,
        monthly_price: selectedPlan.price,
        trial_days: portfolioTrial.freeDays,
        launch_offer_started_at: null,
        launch_offer_ends_at: null,
        subscription_started_at: null
      },
      back_urls: {
        success: `${baseUrl}/mi-cuenta?plano=ativacao_sucesso`,
        pending: `${baseUrl}/mi-cuenta?plano=ativacao_pendente`,
        failure: `${baseUrl}/planos?plano=erro#planos`
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      auto_return: 'approved'
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json({ error: data.message ?? 'Nao foi possivel criar a ativacao.' }, { status: 502 });
  }

  try {
    const adminSupabase = createAdminClient();
    await adminSupabase.from('professional_plan_subscriptions').upsert(
      {
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        provider: 'mercadopago',
        provider_payment_id: String(data.id),
        price: activationFee,
        billing_mode: billingMode,
        activation_fee: activationFee,
        monthly_price: selectedPlan.price,
        subscription_status: 'not_started',
        launch_offer_started_at: null,
        launch_offer_ends_at: null,
        subscription_started_at: null,
        metadata: {
          product: 'professional_activation',
          billing_mode: billingMode,
          checkout_status: data.status,
          activation_fee: activationFee,
          monthly_price: selectedPlan.price,
          trial_days: portfolioTrial.freeDays,
          init_point_created: true
        },
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // O webhook confirma a ativacao; este registro inicial e apenas conveniencia.
  }

  return NextResponse.json({
    id: data.id,
    billingMode,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point
  });
}
