import type { MetadataRoute } from 'next';
import { FEATURED_CITY_NAMES, getAllCitySlugs } from '@/lib/cityPages';
import { BASE_URL } from '@/lib/config';
import { getFeaturedCitySeoIntentPaths, getSeoIntentPaths } from '@/lib/seoIntentPages';
import { slugify } from '@/lib/slugify';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

type SitemapListing = {
  slug: string;
  location: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type SitemapNewsArticle = {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
};

const FEATURED_CITY_SLUGS = FEATURED_CITY_NAMES.map((cityName) => slugify(cityName));

function uniqueSlugs(slugs: string[]) {
  return Array.from(new Set(slugs.filter(Boolean)));
}

function buildCityRoutes(citySlugs = FEATURED_CITY_SLUGS) {
  return uniqueSlugs(citySlugs).map((citySlug) => ({
    url: `${BASE_URL}/imoveis/cidade/${citySlug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));
}

function buildHouseCityAliasRoutes(citySlugs = FEATURED_CITY_SLUGS) {
  return uniqueSlugs(citySlugs).flatMap((citySlug) => [
    {
      url: `${BASE_URL}/anunciar-imovel-gratis-em/${citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.86
    },
    {
      url: `${BASE_URL}/alugar-casa-em/${citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.82
    },
    {
      url: `${BASE_URL}/comprar-casa-em/${citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.82
    },
    {
      url: `${BASE_URL}/casa-a-venda-em/${citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.84
    },
    {
      url: `${BASE_URL}/aluguel-em/${citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.84
    }
  ]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/imoveis',
    '/imoveis/cidades',
    '/anunciar-casa-para-alugar-gratis',
    '/anunciar-casa-para-vender-gratis',
    '/anunciar-imovel-gratis',
    '/anunciar-apartamento-para-alugar-gratis',
    '/anunciar-ponto-comercial-gratis',
    '/quero-anunciar',
    '/casa-para-alugar-no-rio-grande-do-norte',
    '/casa-para-vender-no-rio-grande-do-norte',
    '/minha-casa-minha-vida',
    '/anunciar',
    '/imobiliarias',
    '/planos',
    '/noticias',
    '/contato',
    '/sobre',
    '/seguranca',
    '/faq',
    '/termos-de-uso',
    '/privacidade'
  ];

  const staticRoutes = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date()
  }));

  const seoIntentRoutes = getSeoIntentPaths().map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85
  }));

  const cityIntentRoutes = getFeaturedCitySeoIntentPaths().map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.82
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
    const { data, error } = await supabase
      .from('listings')
      .select('slug,location,updated_at,created_at')
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

    if (error) {
      return [...staticRoutes, ...seoIntentRoutes, ...cityIntentRoutes, ...newsRoutes, ...dynamicNewsRoutes, ...buildCityRoutes(), ...buildHouseCityAliasRoutes()];
    }

    const activeListingCitySlugs = ((data ?? []) as SitemapListing[])
      .map((listing) => slugify(listing.location ?? ''))
      .filter((citySlug) => getAllCitySlugs().includes(citySlug));
    const priorityCitySlugs = uniqueSlugs([...FEATURED_CITY_SLUGS, ...activeListingCitySlugs]);
    const cityRoutes = buildCityRoutes(priorityCitySlugs);
    const houseCityAliasRoutes = buildHouseCityAliasRoutes(priorityCitySlugs);

    const propertyRoutes = ((data ?? []) as SitemapListing[]).map((listing) => ({
      url: `${BASE_URL}/imoveis/${listing.slug}`,
      lastModified: new Date(listing.updated_at || listing.created_at || Date.now())
    }));

    return [
      ...staticRoutes,
      ...seoIntentRoutes,
      ...cityIntentRoutes,
      ...newsRoutes,
      ...dynamicNewsRoutes,
      ...cityRoutes,
      ...houseCityAliasRoutes,
      ...propertyRoutes
    ];
  } catch {
    return [...staticRoutes, ...seoIntentRoutes, ...cityIntentRoutes, ...newsRoutes, ...buildCityRoutes(), ...buildHouseCityAliasRoutes()];
  }
}
