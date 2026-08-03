import type { Property } from '@/data/properties';
import { FEATURED_CITY_NAMES, getCityPagePath } from '@/lib/cityPages';

export type SeoIntentPage = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  propertyType?: Property['propertyType'];
  transaction?: Property['transaction'];
  searchHref: string;
};

export const SEO_INTENT_PAGES: SeoIntentPage[] = [
  {
    slug: 'casas-para-alugar',
    title: 'Casas para alugar no RN',
    h1: 'Casas para alugar no Rio Grande do Norte',
    description:
      'Encontre casas para alugar no Rio Grande do Norte. Busque por cidade, bairro, preço e contato direto com anunciantes na Potilar.',
    intro:
      'Veja casas para aluguel em cidades do RN, com fotos, mapa, preço e contato direto com proprietários, corretores e imobiliárias.',
    propertyType: 'Casa',
    transaction: 'Aluguel',
    searchHref: '/imoveis?propertyType=Casa&transaction=Aluguel'
  },
  {
    slug: 'casas-a-venda',
    title: 'Casas a venda no RN',
    h1: 'Casas a venda no Rio Grande do Norte',
    description:
      'Busque casas a venda no RN. Anúncios de imóveis em Natal, Parnamirim, Mossoró e outras cidades do Rio Grande do Norte.',
    intro:
      'Compare casas a venda no RN e encontre oportunidades por cidade, bairro, preço e características do imóvel.',
    propertyType: 'Casa',
    transaction: 'Compra',
    searchHref: '/imoveis?propertyType=Casa&transaction=Compra'
  },
  {
    slug: 'apartamentos-para-alugar',
    title: 'Apartamentos para alugar no RN',
    h1: 'Apartamentos para alugar no Rio Grande do Norte',
    description:
      'Apartamentos para alugar no RN com contato direto. Encontre opções em Natal, Parnamirim, Mossoró e demais cidades.',
    intro:
      'Encontre apartamentos para aluguel no RN, com busca por cidade, mapa, fotos e contato direto pelo canal escolhido pelo anunciante.',
    propertyType: 'Apartamento',
    transaction: 'Aluguel',
    searchHref: '/imoveis?propertyType=Apartamento&transaction=Aluguel'
  },
  {
    slug: 'apartamentos-a-venda',
    title: 'Apartamentos a venda no RN',
    h1: 'Apartamentos a venda no Rio Grande do Norte',
    description:
      'Veja apartamentos a venda no Rio Grande do Norte. Compare anúncios por cidade, preço, bairro e características.',
    intro:
      'Acompanhe apartamentos a venda em cidades do RN e fale direto com proprietários, corretores ou imobiliárias.',
    propertyType: 'Apartamento',
    transaction: 'Compra',
    searchHref: '/imoveis?propertyType=Apartamento&transaction=Compra'
  },
  {
    slug: 'terrenos-a-venda',
    title: 'Terrenos a venda no RN',
    h1: 'Terrenos a venda no Rio Grande do Norte',
    description:
      'Terrenos a venda no RN para moradia, investimento ou construção. Busque lotes por cidade e fale direto com anunciantes.',
    intro:
      'Veja terrenos e lotes a venda no Rio Grande do Norte, com páginas por cidade e contato direto com quem anuncia.',
    propertyType: 'Terreno',
    transaction: 'Compra',
    searchHref: '/imoveis?propertyType=Terreno&transaction=Compra'
  },
  {
    slug: 'kitnets-para-alugar',
    title: 'Kitnets e conjugados para alugar no RN',
    h1: 'Kitnets e conjugados para alugar no Rio Grande do Norte',
    description:
      'Busque kitnets e conjugados para alugar no RN. Opções compactas para aluguel em cidades do Rio Grande do Norte.',
    intro:
      'Encontre kitnets e conjugados para aluguel no RN, especialmente para quem busca praticidade, preço menor e boa localização.',
    propertyType: 'Kitnet/Conjugado',
    transaction: 'Aluguel',
    searchHref: '/imoveis?propertyType=Kitnet%2FConjugado&transaction=Aluguel'
  },
  {
    slug: 'pontos-comerciais-para-alugar',
    title: 'Pontos comerciais para alugar no RN',
    h1: 'Pontos comerciais para alugar no Rio Grande do Norte',
    description:
      'Pontos comerciais para alugar no RN. Encontre lojas, salas comerciais, galpões e pontos de rua com contato direto na Potilar.',
    intro:
      'Busque ponto comercial para aluguel no Rio Grande do Norte, com opções para loja, sala, serviços, comércio de rua e empresas locais.',
    propertyType: 'Ponto comercial',
    transaction: 'Aluguel',
    searchHref: '/imoveis?propertyType=Ponto%20comercial&transaction=Aluguel'
  },
  {
    slug: 'pontos-comerciais-a-venda',
    title: 'Pontos comerciais a venda no RN',
    h1: 'Pontos comerciais a venda no Rio Grande do Norte',
    description:
      'Pontos comerciais a venda no RN. Veja imóveis comerciais, lojas, salas, galpões e oportunidades para negócio no Rio Grande do Norte.',
    intro:
      'Compare pontos comerciais a venda no RN e encontre imóveis para comércio, serviços, investimento ou expansão de empresa.',
    propertyType: 'Ponto comercial',
    transaction: 'Compra',
    searchHref: '/imoveis?propertyType=Ponto%20comercial&transaction=Compra'
  },
  {
    slug: 'imoveis-para-temporada',
    title: 'Imóveis para temporada no RN',
    h1: 'Imóveis para temporada no Rio Grande do Norte',
    description:
      'Imóveis para temporada no RN. Casas, apartamentos e opções para aluguel de temporada em cidades e praias do Rio Grande do Norte.',
    intro:
      'Busque imóveis de temporada no RN, com opções em cidades litorâneas, interiores turísticos e contato direto com anunciantes.',
    transaction: 'Temporada',
    searchHref: '/imoveis?transaction=Temporada'
  }
];

export function getSeoIntentPage(slug: string) {
  return SEO_INTENT_PAGES.find((page) => page.slug === slug) ?? null;
}

export function getSeoIntentPaths() {
  return SEO_INTENT_PAGES.map((page) => `/imoveis/${page.slug}`);
}

export function getCitySeoIntentPath(cityName: string, intentSlug: string) {
  return `${getCityPagePath(cityName)}/${intentSlug}`;
}

export function getFeaturedCitySeoIntentPaths() {
  return FEATURED_CITY_NAMES.flatMap((cityName) =>
    SEO_INTENT_PAGES.map((page) => getCitySeoIntentPath(cityName, page.slug))
  );
}

export function getCityIntentSeoTitle(cityName: string, page: SeoIntentPage) {
  const base = page.title.replace(' no RN', '').replace(' no Rio Grande do Norte', '');
  return `${base} em ${cityName}, RN`;
}

export function getCityIntentSeoDescription(cityName: string, page: SeoIntentPage, listingCount: number) {
  const countText =
    listingCount > 0
      ? `${listingCount} anúncio${listingCount === 1 ? '' : 's'} publicado${listingCount === 1 ? '' : 's'}`
      : 'busca local para anúncios';

  return `${countText} de ${page.title.toLowerCase()} em ${cityName}, Rio Grande do Norte. Veja imóveis por cidade, bairro, mapa e contato direto na Potilar.`;
}
