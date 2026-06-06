import { NextResponse } from 'next/server';

/**
 * Webhook Mercado Pago (preparado para Pix automatico).
 * Configure MERCADO_PAGO_WEBHOOK_SECRET e integre a confirmacao de pagamento aqui.
 */
export async function POST(request: Request) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Webhook nao configurado. Defina MERCADO_PAGO_WEBHOOK_SECRET no ambiente.' },
      { status: 501 }
    );
  }

  const signature = request.headers.get('x-signature') ?? request.headers.get('x-request-id');
  if (!signature) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 });
  }

  await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    message: 'Webhook recebido. Integracao de confirmacao automatica pendente.'
  });
}
