'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';
import { getNewsImageUrl, getNewsTitleFingerprint, sanitizeNewsCopy } from '@/data/news';

async function ensureAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error('Sem permissao de admin');

  return { supabase, userId: user.id };
}

export async function createNewsArticle(formData: FormData) {
  try {
    const title = String(formData.get('title') || '').trim();
    const category = String(formData.get('category') || 'Imobiliario').trim();
    const excerpt = String(formData.get('excerpt') || '').trim();
    const content = String(formData.get('content') || '').trim();
    const imageUrl = String(formData.get('image_url') || '').trim();
    const sourceName = String(formData.get('source_name') || '').trim();
    const sourceUrl = String(formData.get('source_url') || '').trim();
    const status = String(formData.get('status') || 'draft');

    if (!title || !excerpt || !content) throw new Error('Titulo, resumo e conteudo sao obrigatorios');
    if (!['draft', 'published'].includes(status)) throw new Error('Status invalido');

    const { supabase, userId } = await ensureAdmin();
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    const sanitized = sanitizeNewsCopy({ title, excerpt, content, sourceUrl });

    const { error } = await supabase.from('news_articles').insert({
      title: sanitized.title,
      slug: slugify(sanitized.title),
      category,
      excerpt: sanitized.excerpt,
      content: sanitized.content,
      image_url: imageUrl || null,
      source_name: sourceName || null,
      source_url: sanitized.sourceUrl,
      status,
      reviewed_by: status === 'published' ? userId : null,
      published_at: publishedAt,
      updated_at: new Date().toISOString()
    });

    if (error) throw new Error(error.message);

    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin/news?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin/news?success=saved');
}

export async function updateNewsStatus(formData: FormData) {
  try {
    const id = String(formData.get('id') || '');
    const status = String(formData.get('status') || '');
    if (!id || !['draft', 'published', 'archived'].includes(status)) throw new Error('Status invalido');

    const { supabase, userId } = await ensureAdmin();
    const update = {
      status,
      reviewed_by: status === 'published' ? userId : null,
      published_at: status === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('news_articles').update(update).eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin/news?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin/news?success=status');
}

export async function updateNewsArticle(formData: FormData) {
  try {
    const id = String(formData.get('id') || '').trim();
    const title = String(formData.get('title') || '').trim();
    const category = String(formData.get('category') || 'Imobiliario').trim();
    const excerpt = String(formData.get('excerpt') || '').trim();
    const content = String(formData.get('content') || '').trim();
    const imageUrl = String(formData.get('image_url') || '').trim();
    const sourceName = String(formData.get('source_name') || '').trim();
    const sourceUrl = String(formData.get('source_url') || '').trim();

    if (!id) throw new Error('Noticia invalida');
    if (!title || !excerpt || !content) throw new Error('Titulo, resumo e conteudo sao obrigatorios');

    const { supabase } = await ensureAdmin();
    const sanitized = sanitizeNewsCopy({ title, excerpt, content, sourceUrl });
    const { error } = await supabase
      .from('news_articles')
      .update({
        title: sanitized.title,
        category,
        excerpt: sanitized.excerpt,
        content: sanitized.content,
        image_url: imageUrl || null,
        source_name: sourceName || null,
        source_url: sanitized.sourceUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/');
    revalidatePath('/admin/news');
    revalidatePath('/noticias');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin/news?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin/news?success=saved');
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function extractTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function cleanGoogleNewsTitle(title: string) {
  return title.replace(/\s+-\s+[^-]+$/g, '').trim();
}

function normalizeNewsKey(value: string) {
  return getNewsTitleFingerprint(cleanGoogleNewsTitle(value));
}

function parseRssDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isRecentNewsDate(value: string, maxAgeDays = 7) {
  const date = parseRssDate(value);
  if (!date) return false;

  const ageMs = Date.now() - date.getTime();
  return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
}

function buildDraftExcerpt(title: string, category: string) {
  return `${title}. Entenda por que esse tema pode influenciar proprietários, compradores, inquilinos e profissionais do mercado imobiliário no Rio Grande do Norte.`;
}

function buildDraftContent(title: string, category: string) {
  return [
    `${title} chama a atenção para um movimento importante dentro do mercado imobiliário. Para quem acompanha compra, venda, aluguel ou investimento em imóveis, esse tipo de informação ajuda a entender melhor o momento antes de tomar uma decisão.`,
    `No Rio Grande do Norte, notícias ligadas a ${category.toLowerCase()} podem afetar a forma como proprietários definem valores, como interessados comparam oportunidades e como corretores e imobiliárias orientam seus clientes.`,
    `A recomendação da Potilar é sempre comparar anúncios semelhantes, observar a localização, revisar a documentação e confirmar as informações diretamente com as fontes oficiais ou profissionais qualificados antes de fechar qualquer negociação.`
  ].join('\n');
}

type GeneratedNews = {
  title: string;
  excerpt: string;
  content: string;
  sourceUrl?: string | null;
};

function extractResponseText(payload: any) {
  if (typeof payload?.output_text === 'string') return payload.output_text;

  const textParts = payload?.output
    ?.flatMap((item: any) => item?.content ?? [])
    ?.map((content: any) => content?.text)
    ?.filter(Boolean);

  return textParts?.join('\n') ?? '';
}

function extractJsonObject(text: string) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return cleaned;
  return cleaned.slice(start, end + 1);
}

function extractAnnotationUrls(payload: any) {
  const urls: string[] = [];
  const items = payload?.output ?? [];

  for (const item of items) {
    for (const content of item?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        if (typeof annotation?.url === 'string') urls.push(annotation.url);
      }
    }
  }

  return urls;
}

async function generateRealNewsArticle(title: string, category: string, sourceName: string, sourceUrl: string): Promise<GeneratedNews> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta configurar OPENAI_API_KEY na Vercel para gerar notícias reais com IA.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search_preview' }],
      input: [
        {
          role: 'developer',
          content:
            'Você é editor de um portal imobiliário. Escreva notícias factuais em português do Brasil. Use busca web para verificar a fonte. Não copie trechos da fonte. Não invente dados. Se algo não estiver confirmado, diga de forma cuidadosa. Responda somente JSON válido. Não inclua citações, footnotes, markdown, links, URLs nem a linha Fonte no título, no resumo ou no corpo. Não use [texto](url) nem ([site](url)). O corpo deve ser só parágrafos em prosa, separados por \\n. A fonte oficial fica fora do JSON.'
        },
        {
          role: 'user',
          content: `Crie uma notícia pronta para revisão na Potilar Notícias, sem mencionar propaganda da Potilar no corpo. Tema: ${title}. Categoria: ${category}. Fonte de verificação: ${sourceName}. Link de verificação: ${sourceUrl}. Formato JSON: {"title":"...","excerpt":"...","content":"paragrafo 1\\nparagrafo 2\\nparagrafo 3\\nparagrafo 4"}.`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI não conseguiu gerar a notícia (${response.status}).`);
  }

  const payload = await response.json();
  const text = extractJsonObject(extractResponseText(payload));

  try {
    const parsed = JSON.parse(text) as GeneratedNews;
    if (!parsed.title || !parsed.excerpt || !parsed.content) throw new Error('JSON incompleto');
    const sanitized = sanitizeNewsCopy({
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: parsed.content,
      sourceUrl,
      citationText: text,
      citationUrls: extractAnnotationUrls(payload)
    });
    return {
      title: sanitized.title,
      excerpt: sanitized.excerpt,
      content: sanitized.content,
      sourceUrl: sanitized.sourceUrl
    };
  } catch {
    throw new Error('A IA não retornou uma notícia válida. Tente novamente.');
  }
}

export async function generateNewsDrafts() {
  try {
    const { supabase } = await ensureAdmin();
    await supabase
      .from('news_articles')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('ai_generated', true)
      .eq('status', 'draft');

    const { data: existingArticles } = await supabase
      .from('news_articles')
      .select('title, source_url')
      .limit(1000);

    const usedTitleKeys = new Set(
      (existingArticles ?? []).map((article) => normalizeNewsKey(String(article.title ?? ''))).filter(Boolean)
    );
    const usedSourceUrls = new Set(
      (existingArticles ?? []).map((article) => String(article.source_url ?? '')).filter(Boolean)
    );

    const queries = [
      { category: 'Mercado imobiliario', q: 'mercado imobiliario Rio Grande do Norte OR RN imoveis' },
      { category: 'Construcao', q: 'construcao civil Rio Grande do Norte imoveis' },
      { category: 'Financiamento', q: 'financiamento imobiliario Caixa imoveis Brasil' },
      { category: 'Legislacao', q: 'lei aluguel imoveis Brasil documentacao' }
    ];

    const drafts: Array<{
      title: string;
      slug: string;
      category: string;
      excerpt: string;
      content: string;
      image_url: string;
      source_name: string | null;
      source_url: string | null;
      status: 'draft';
      ai_generated: true;
      published_at: null;
      updated_at: string;
    }> = [];
    const draftTitleKeys = new Set<string>();
    const draftSourceUrls = new Set<string>();

    for (const query of queries) {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query.q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await fetch(url, { next: { revalidate: 0 } });
      if (!response.ok) continue;

      const xml = await response.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
        .map((itemMatch) => {
          const item = itemMatch[1];
          const pubDate = extractTag(item, 'pubDate');
          return {
            item,
            date: parseRssDate(pubDate),
            pubDate
          };
        })
        .filter((entry) => entry.date && isRecentNewsDate(entry.pubDate))
        .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
        .slice(0, 12);

      for (const entry of items) {
        const item = entry.item;
        const rawTitle = extractTag(item, 'title');
        const link = extractTag(item, 'link');
        const source = extractTag(item, 'source') || 'Google News';
        const title = cleanGoogleNewsTitle(rawTitle);
        if (!title || !link) continue;

        const titleKey = normalizeNewsKey(title);
        if (!titleKey) continue;
        if (usedTitleKeys.has(titleKey) || draftTitleKeys.has(titleKey)) continue;
        if (usedSourceUrls.has(link) || draftSourceUrls.has(link)) continue;

        let generated: GeneratedNews;
        try {
          generated = await generateRealNewsArticle(title, query.category, source, link);
        } catch {
          generated = {
            title,
            excerpt: buildDraftExcerpt(title, query.category),
            content: buildDraftContent(title, query.category)
          };
        }
        const generatedTitleKey = normalizeNewsKey(generated.title);
        if (usedTitleKeys.has(generatedTitleKey) || draftTitleKeys.has(generatedTitleKey)) continue;
        const sanitized = sanitizeNewsCopy({
          title: generated.title,
          excerpt: generated.excerpt,
          content: generated.content,
          sourceUrl: generated.sourceUrl || link
        });

        drafts.push({
          title: sanitized.title,
          slug: `${slugify(title)}-${Date.now().toString(36)}`,
          category: query.category,
          excerpt: sanitized.excerpt,
          content: sanitized.content,
          image_url: getNewsImageUrl(query.category, null, title),
          source_name: source,
          source_url: sanitized.sourceUrl,
          status: 'draft',
          ai_generated: true,
          published_at: null,
          updated_at: new Date().toISOString()
        });
        draftTitleKeys.add(titleKey);
        draftTitleKeys.add(generatedTitleKey);
        draftSourceUrls.add(link);
        break;
      }
    }

    if (drafts.length === 0) {
      throw new Error('Não encontrei notícias recentes e diferentes das que já estão cadastradas. Tente novamente mais tarde.');
    }

    const uniqueDrafts = Array.from(new Map(drafts.map((draft) => [draft.title.toLowerCase(), draft])).values()).slice(0, 6);
    const { error } = await supabase.from('news_articles').insert(uniqueDrafts);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/news');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    redirect(`/admin/news?error=${encodeURIComponent(message)}`);
  }

  redirect('/admin/news?success=generated');
}
