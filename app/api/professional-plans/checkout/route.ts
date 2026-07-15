import { NextResponse } from 'next/server';
import { getProfessionalPlan } from '@/lib/plans';
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
    return NextResponse.json({ error: 'Entre na sua conta para assinar um plano.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const selectedPlan = getProfessionalPlan(String(body.planId ?? ''));
  const billingMode = body.billingMode === 'manual' ? 'manual' : 'automatic';

  if (!selectedPlan) {
    return NextResponse.json({ error: 'Plano profissional invalido.' }, { status: 400 });
  }

  if (!user.email) {
    return NextResponse.json({ error: 'Sua conta precisa ter um email para assinar um plano.' }, { status: 400 });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Mercado Pago ainda não está configurado.' }, { status: 501 });
  }

  const baseUrl = getBaseUrl(request);

  if (billingMode === 'manual') {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            id: selectedPlan.id,
            title: `Potilar - ${selectedPlan.label}`,
            description: `${selectedPlan.listingLimit} imóveis ativos e ${selectedPlan.aiCredits} melhorias com IA por 30 dias.`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: selectedPlan.price
          }
        ],
        external_reference: `professional_plan:${user.id}:${selectedPlan.id}`,
        metadata: {
          user_id: user.id,
          plan_id: selectedPlan.id,
          product: 'professional_plan',
          billing_mode: 'manual'
        },
        back_urls: {
          success: `${baseUrl}/mi-cuenta?plano=sucesso`,
          pending: `${baseUrl}/mi-cuenta?plano=pendente`,
          failure: `${baseUrl}/planos?plano=erro#planos`
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
      billingMode,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    });
  }

  const response = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: `Potilar - ${selectedPlan.label}`,
      external_reference: `professional_plan:${user.id}:${selectedPlan.id}`,
      payer_email: user.email,
      back_url: `${baseUrl}/mi-cuenta?plano=sucesso`,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: selectedPlan.price,
        currency_id: 'BRL'
      },
      status: 'pending'
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json({ error: data.message ?? 'Não foi possível criar a assinatura.' }, { status: 502 });
  }

  try {
    const adminSupabase = createAdminClient();
    await adminSupabase.from('professional_plan_subscriptions').upsert(
      {
        user_id: user.id,
        plan_id: selectedPlan.id,
        status: 'pending',
        provider: 'mercadopago',
        provider_subscription_id: String(data.id),
        price: selectedPlan.price,
        metadata: {
          product: 'professional_plan',
          checkout_status: data.status,
          init_point_created: true
        },
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // O webhook ainda consegue ativar o plano; este registro inicial e apenas conveniencia.
  }

  return NextResponse.json({
    id: data.id,
    billingMode,
    initPoint: data.init_point ?? data.sandbox_init_point,
    sandboxInitPoint: data.sandbox_init_point
  });
}
