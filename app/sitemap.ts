import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/config';
import { properties } from '@/data/properties';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/imoveis', '/sobre', '/contato', '/anunciar', '/agentes', '/seja-parceiro'];

  const staticRoutes = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date()
  }));

  const propertyRoutes = properties.map((property) => ({
    url: `${BASE_URL}/imoveis/${property.slug}`,
    lastModified: new Date()
  }));

  return [...staticRoutes, ...propertyRoutes];
}
