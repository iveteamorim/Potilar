import { NextResponse } from 'next/server';
import { AI_CREDIT_ACTIONS } from '@/lib/aiCredits';
import { createClient } from '@/lib/supabase/server';

type ListingAiInput = {
  title?: string;
  location?: string;
  neighborhood?: string;
  community?: string;
  addressExtra?: string;
  propertyType?: string;
  transaction?: string;
  price?: string;
  pricePeriod?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking?: string;
  areaSqm?: string;
  condoIncluded?: boolean;
  isPetFriendly?: boolean;
  isFurnished?: boolean;
  details?: string;
  features?: string;
};

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === 'string') return payload.output_text;

  const parts =
    payload?.output
      ?.flatMap((item: any) => item?.content ?? [])
      ?.map((content: any) => content?.text)
      ?.filter(Boolean) ?? [];

  return parts.join('\n').trim();
}

function parseGeneratedListing(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as {
    title?: string;
    description?: string;
    features?: string[] | string;
  };

  const title = String(parsed.title ?? '').trim();
  const description = String(parsed.description ?? '').trim();
  const features = Array.isArray(parsed.features)
    ? parsed.features.map((item) => String(item).trim()).filter(Boolean)
    : String(parsed.features ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  if (!title || !description) {
    throw new Error('OpenAI retornou um anúncio incompleto.');
  }

  return {
    title: title.slice(0, 90),
    description,
    features: features.slice(0, 8)
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não está configurada na Vercel.' }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Entre na sua conta para usar IA.' }, { status: 401 });
  }

  const body = (await request.json()) as ListingAiInput;
  if (!body.location || !body.propertyType || !body.transaction) {
    return NextResponse.json({ error: 'Informe cidade, tipo de imóvel e negociação para gerar com IA.' }, { status: 400 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    const { data: balance, error: balanceError } = await supabase.rpc('get_ai_credit_balance');
    if (balanceError) {
      return NextResponse.json({ error: 'Não foi possível verificar seus créditos de IA.' }, { status: 500 });
    }
    if (Number(balance ?? 0) < AI_CREDIT_ACTIONS.professionalListing.credits) {
      return NextResponse.json({ error: 'Você não tem créditos de IA suficientes. Compre créditos em Minha conta.' }, { status: 402 });
    }
  }

  const prompt = {
    objetivo: 'Gerar título, descrição e destaques para anúncio imobiliário da Potilar.',
    regras: [
      'Escreva em português do Brasil.',
      'Não mencione Potilar no corpo da descrição.',
      'Não use frases genéricas como "entre em contato", "compare oportunidades", "boa oportunidade" ou "espaço bem distribuído".',
      'Use apenas informações fornecidas. Se faltar dado, não invente.',
      'Descrição curta, comercial e natural, entre 2 e 4 parágrafos.',
      'Título com até 90 caracteres.',
      'Responda somente JSON: {"title":"...","description":"...","features":["..."]}'
    ],
    dados: body
  };

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_LISTING_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content:
              'Você é redator imobiliário local no Rio Grande do Norte. Crie anúncios claros, concretos e sem exagero.'
          },
          {
            role: 'user',
            content: JSON.stringify(prompt)
          }
        ],
        temperature: 0.4,
        max_output_tokens: 700
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: `OpenAI não conseguiu gerar o anúncio (${response.status}).` }, { status: 502 });
    }

    const payload = await response.json();
    const generated = parseGeneratedListing(extractOutputText(payload));

    if (isAdmin) {
      return NextResponse.json({ generated, balance: null, free: true });
    }

    const action = AI_CREDIT_ACTIONS.professionalListing;
    const { data: nextBalance, error: consumeError } = await supabase.rpc('consume_ai_credits', {
      p_amount: action.credits,
      p_description: action.label,
      p_metadata: { action: action.key, kind: 'listing_generation' }
    });

    if (consumeError) {
      return NextResponse.json({ error: 'Não foi possível consumir créditos de IA.' }, { status: 402 });
    }

    return NextResponse.json({ generated, balance: nextBalance ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível gerar o anúncio com IA.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
