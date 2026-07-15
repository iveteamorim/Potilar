import type { Metadata } from 'next';
import SeoIntentListingPage from '@/components/SeoIntentListingPage';
import { BASE_URL } from '@/lib/config';
import { getSeoIntentPage } from '@/lib/seoIntentPages';

const basePage = getSeoIntentPage('casas-a-venda')!;
const path = '/casa-para-vender-no-rio-grande-do-norte';
const page = {
  ...basePage,
  title: 'Casa para vender no Rio Grande do Norte',
  h1: 'Casa para vender no Rio Grande do Norte',
  description:
    'Encontre casa para vender no Rio Grande do Norte. Veja casas a venda com fotos, preço, cidade, mapa e contato direto na Potilar.',
  intro:
    'Busque casas a venda no RN por cidade, bairro, preço e características do imóvel. Compare oportunidades e fale direto com o anunciante.'
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
