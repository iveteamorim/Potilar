import type { Metadata } from 'next';
import SeoIntentListingPage from '@/components/SeoIntentListingPage';
import { BASE_URL } from '@/lib/config';
import { getSeoIntentPage } from '@/lib/seoIntentPages';

const page = getSeoIntentPage('pontos-comerciais-para-alugar')!;

export const revalidate = 300;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  keywords: [
    'ponto comercial para alugar RN',
    'ponto comercial para alugar Natal',
    'loja para alugar RN',
    'sala comercial para alugar RN',
    'imóvel comercial para alugar Rio Grande do Norte'
  ],
  alternates: { canonical: `${BASE_URL}/imoveis/${page.slug}` },
  openGraph: { title: `${page.title} | Potilar`, description: page.description, url: `${BASE_URL}/imoveis/${page.slug}` }
};

export default function Page() {
  return <SeoIntentListingPage page={page} />;
}
