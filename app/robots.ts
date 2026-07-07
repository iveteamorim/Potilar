import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/config';

const AI_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'Google-Extended',
  'anthropic-ai',
  'ClaudeBot',
  'PerplexityBot',
  'Applebot-Extended'
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/auth',
          '/completar-conta',
          '/login',
          '/mi-cuenta',
          '/ver-anuncio',
          '/*?*'
        ]
      },
      ...AI_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/'
      }))
    ],
    sitemap: `${BASE_URL}/sitemap.xml`
  };
}
