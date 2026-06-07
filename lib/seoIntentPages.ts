import type { Property } from '@/data/properties';

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
      'Encontre casas para alugar no Rio Grande do Norte. Busque por cidade, bairro, preco e contato direto com anunciantes na Potilar.',
    intro:
      'Veja casas para aluguel em cidades do RN, com fotos, mapa, preco e contato direto com proprietarios, corretores e imobiliarias.',
    propertyType: 'Casa',
    transaction: 'Aluguel',
    searchHref: '/imoveis?propertyType=Casa&transaction=Aluguel'
  },
  {
    slug: 'casas-a-venda',
    title: 'Casas a venda no RN',
    h1: 'Casas a venda no Rio Grande do Norte',
    description:
      'Busque casas a venda no RN. Anuncios de imoveis em Natal, Parnamirim, Mossoro e outras cidades do Rio Grande do Norte.',
    intro:
      'Compare casas a venda no RN e encontre oportunidades por cidade, bairro, preco e caracteristicas do imovel.',
    propertyType: 'Casa',
    transaction: 'Compra',
    searchHref: '/imoveis?propertyType=Casa&transaction=Compra'
  },
  {
    slug: 'apartamentos-para-alugar',
    title: 'Apartamentos para alugar no RN',
    h1: 'Apartamentos para alugar no Rio Grande do Norte',
    description:
      'Apartamentos para alugar no RN com contato direto. Encontre opcoes em Natal, Parnamirim, Mossoro e demais cidades.',
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
      'Veja apartamentos a venda no Rio Grande do Norte. Compare anuncios por cidade, preco, bairro e caracteristicas.',
    intro:
      'Acompanhe apartamentos a venda em cidades do RN e fale direto com proprietarios, corretores ou imobiliarias.',
    propertyType: 'Apartamento',
    transaction: 'Compra',
    searchHref: '/imoveis?propertyType=Apartamento&transaction=Compra'
  },
  {
    slug: 'terrenos-a-venda',
    title: 'Terrenos a venda no RN',
    h1: 'Terrenos a venda no Rio Grande do Norte',
    description:
      'Terrenos a venda no RN para moradia, investimento ou construcao. Busque lotes por cidade e fale direto com anunciantes.',
    intro:
      'Veja terrenos e lotes a venda no Rio Grande do Norte, com paginas por cidade e contato direto com quem anuncia.',
    propertyType: 'Terreno',
    transaction: 'Compra',
    searchHref: '/imoveis?propertyType=Terreno&transaction=Compra'
  },
  {
    slug: 'kitnets-para-alugar',
    title: 'Kitnets e conjugados para alugar no RN',
    h1: 'Kitnets e conjugados para alugar no Rio Grande do Norte',
    description:
      'Busque kitnets e conjugados para alugar no RN. Opcoes compactas para aluguel em cidades do Rio Grande do Norte.',
    intro:
      'Encontre kitnets e conjugados para aluguel no RN, especialmente para quem busca praticidade, preco menor e boa localizacao.',
    propertyType: 'Kitnet/Conjugado',
    transaction: 'Aluguel',
    searchHref: '/imoveis?propertyType=Kitnet%2FConjugado&transaction=Aluguel'
  },
  {
    slug: 'imoveis-para-temporada',
    title: 'Imoveis para temporada no RN',
    h1: 'Imoveis para temporada no Rio Grande do Norte',
    description:
      'Imoveis para temporada no RN. Casas, apartamentos e opcoes para aluguel de temporada em cidades e praias do Rio Grande do Norte.',
    intro:
      'Busque imoveis de temporada no RN, com opcoes em cidades litoraneas, interiores turisticos e contato direto com anunciantes.',
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
