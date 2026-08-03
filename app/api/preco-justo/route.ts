import { NextResponse } from 'next/server';
import { buildPriceInsight, type PriceInsightInput } from '@/lib/priceIntelligence';

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === 'string') return payload.output_text;

  const parts =
    payload?.output
      ?.flatMap((item: any) => item?.content ?? [])
      ?.map((content: any) => content?.text)
      ?.filter(Boolean) ?? [];

  return parts.join('\n').trim();
}

async function enhancePriceInsightWithOpenAI(insight: Awaited<ReturnType<typeof buildPriceInsight>>, input: PriceInsightInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || insight.verdict === 'insufficient_data' || insight.medianPrice <= 0) return insight;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_PRICE_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content:
              'Você explica análise de preço imobiliário no RN com cautela. Não invente dados, não prometa venda, não substitua avaliação oficial.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              objetivo: 'Reescrever summary e tip do Preço Justo RN para o anunciante.',
              regras: [
                'Português do Brasil.',
                'Não mencione dados que não estejam no JSON.',
                'summary com até 320 caracteres.',
                'tip com até 180 caracteres.',
                'Responder somente JSON: {"summary":"...","tip":"..."}'
              ],
              input,
              insight
            })
          }
        ],
        temperature: 0.3,
        max_output_tokens: 350
      })
    });

    if (!response.ok) return insight;

    const payload = await response.json();
    const text = extractOutputText(payload).replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(text) as { summary?: string; tip?: string };
    const summary = String(parsed.summary ?? '').trim();
    const tip = String(parsed.tip ?? '').trim();

    return {
      ...insight,
      summary: summary || insight.summary,
      tip: tip || insight.tip
    };
  } catch {
    return insight;
  }
}

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

    const insightInput = {
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
    };

    const insight = await enhancePriceInsightWithOpenAI(await buildPriceInsight(insightInput), insightInput);

    return NextResponse.json({ insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao calcular preço justo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
