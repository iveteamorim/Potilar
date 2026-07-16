import { NextResponse } from 'next/server';
import { buildPriceInsight, type PriceInsightInput } from '@/lib/priceIntelligence';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PriceInsightInput & {
      price?: number;
      transaction?: string;
      propertyType?: string;
      location?: string;
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
      bathrooms: Number(body.bathrooms ?? 0) || undefined,
      parking: Number(body.parking ?? 0) || undefined,
      areaSqm: Number(body.areaSqm ?? 0) || undefined,
      lat: Number(body.lat ?? 0) || undefined,
      lng: Number(body.lng ?? 0) || undefined,
      isFurnished: Boolean(body.isFurnished),
      isPetFriendly: Boolean(body.isPetFriendly),
      imageCount: Number(body.imageCount ?? 0) || undefined,
      videoUrl: body.videoUrl ?? null,
      tourUrl: body.tourUrl ?? null,
      featureCount: Number(body.featureCount ?? 0) || undefined,
      descriptionLength: Number(body.descriptionLength ?? 0) || undefined
    });

    return NextResponse.json({ insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao calcular preço justo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
