import { NextResponse } from 'next/server';
import { AI_CREDIT_PACKAGES, getAiCreditPackage } from '@/lib/aiCredits';
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
    return NextResponse.json({ error: 'Entre na sua conta para comprar creditos.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const selectedPackage = getAiCreditPackage(String(body.packageId ?? ''));

  if (!selectedPackage) {
    return NextResponse.json({ error: 'Pacote de creditos invalido.' }, { status: 400 });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({
      error: 'Mercado Pago ainda nao esta configurado.',
      setupRequired: true,
      package: selectedPackage,
      packages: Object.values(AI_CREDIT_PACKAGES)
    }, { status: 501 });
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
          id: selectedPackage.id,
          title: `Potilar - ${selectedPackage.label} de IA`,
          description: selectedPackage.description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: selectedPackage.price
        }
      ],
      external_reference: `ai_credits:${user.id}:${selectedPackage.id}`,
      metadata: {
        user_id: user.id,
        package_id: selectedPackage.id,
        credits: selectedPackage.credits,
        product: 'ai_credits'
      },
      back_urls: {
        success: `${baseUrl}/mi-cuenta/creditos?pagamento=sucesso`,
        pending: `${baseUrl}/mi-cuenta/creditos?pagamento=pendente`,
        failure: `${baseUrl}/mi-cuenta/creditos?pagamento=erro`
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      auto_return: 'approved'
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json({ error: data.message ?? 'Nao foi possivel criar o pagamento.' }, { status: 502 });
  }

  return NextResponse.json({
    id: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point
  });
}
