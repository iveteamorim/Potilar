import type { Metadata } from 'next';
import SeoIntentListingPage from '@/components/SeoIntentListingPage';
import { BASE_URL } from '@/lib/config';
import { getSeoIntentPage } from '@/lib/seoIntentPages';

const basePage = getSeoIntentPage('casas-para-alugar')!;
const path = '/casa-para-alugar-no-rio-grande-do-norte';
const page = {
  ...basePage,
  title: 'Casa para alugar no Rio Grande do Norte',
  h1: 'Casa para alugar no Rio Grande do Norte',
  description:
    'Encontre casa para alugar no Rio Grande do Norte. Veja anuncios com fotos, preco, cidade, mapa e contato direto na Potilar.',
  intro:
    'Busque casas para aluguel no RN por cidade, bairro, preco e caracteristicas do imovel. Fale direto com proprietarios, corretores ou imobiliarias.'
};

export const revalidate = 300;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: `${BASE_URL}${path}` },
  openGraph: { title: `${page.title} | Potilar`, description: page.description, url: `${BASE_URL}${path}` }
};

export default function Page() {
  return <SeoIntentListingPage page={page} pagePath={path} />;
}
