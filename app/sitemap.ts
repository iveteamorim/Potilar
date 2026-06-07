import type { MetadataRoute } from 'next';
import { getAllCitySlugs } from '@/lib/cityPages';
import { BASE_URL } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

type SitemapListing = {
  slug: string;
  updated_at: string | null;
  created_at: string | null;
};

type SitemapNewsArticle = {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
};

function buildCityRoutes() {
  return getAllCitySlugs().map((citySlug) => ({
    url: `${BASE_URL}/imoveis/cidade/${citySlug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/imoveis',
    '/imoveis/cidades',
    '/anunciar',
    '/imobiliarias',
    '/planos',
    '/noticias',
    '/contato',
    '/seguranca',
    '/faq',
    '/termos-de-uso',
    '/privacidade'
  ];

  const staticRoutes = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date()
  }));

  const newsRoutes = [
    '/noticias/precos-imoveis-rn',
    '/noticias/cuidados-negociar-imovel-online',
    '/noticias/documentos-vender-alugar-imovel'
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date()
  }));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const cityRoutes = buildCityRoutes();
    const { data, error } = await supabase
      .from('listings')
      .select('slug,updated_at,created_at')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    const { data: newsData } = await supabase
      .from('news_articles')
      .select('slug,updated_at,published_at,created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const dynamicNewsRoutes = ((newsData ?? []) as SitemapNewsArticle[]).map((article) => ({
      url: `${BASE_URL}/noticias/${article.slug}`,
      lastModified: new Date(article.updated_at || article.published_at || article.created_at || Date.now())
    }));

    if (error) return [...staticRoutes, ...newsRoutes, ...dynamicNewsRoutes, ...cityRoutes];

    const propertyRoutes = ((data ?? []) as SitemapListing[]).map((listing) => ({
      url: `${BASE_URL}/imoveis/${listing.slug}`,
      lastModified: new Date(listing.updated_at || listing.created_at || Date.now())
    }));

    return [...staticRoutes, ...newsRoutes, ...dynamicNewsRoutes, ...cityRoutes, ...propertyRoutes];
  } catch {
    return [...staticRoutes, ...newsRoutes, ...buildCityRoutes()];
  }
}
