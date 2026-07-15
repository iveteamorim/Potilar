import { NextResponse } from 'next/server';
import { buildPriceInsight } from '@/lib/priceIntelligence';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      price?: number;
      transaction?: string;
      propertyType?: string;
      location?: string;
      neighborhood?: string | null;
      bedrooms?: number;
      areaSqm?: number;
    };

    const price = Number(body.price ?? 0);
    const transaction = String(body.transaction ?? '').trim();
    const propertyType = String(body.propertyType ?? '').trim();
    const location = String(body.location ?? '').trim();

    if (!price || !transaction || !propertyType || !location) {
      return NextResponse.json({ error: 'Dados incompletos para análise de preço.' }, { status: 400 });
    }

    const insight = await buildPriceInsight({
      price,
      transaction,
      propertyType,
      location,
      neighborhood: body.neighborhood ?? null,
      bedrooms: Number(body.bedrooms ?? 0) || undefined,
      areaSqm: Number(body.areaSqm ?? 0) || undefined
    });

    return NextResponse.json({ insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao calcular preço justo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
