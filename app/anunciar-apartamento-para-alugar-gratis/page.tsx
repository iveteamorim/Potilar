import type { Metadata } from 'next';
import SeoAdvertiseHousePage from '@/components/SeoAdvertiseHousePage';
import { BASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Anunciar apartamento para alugar grátis no RN',
  description:
    'Anuncie apartamento para alugar grátis no Rio Grande do Norte. Publique fotos, preço, cidade, bairro e receba contato direto pela Potilar.',
  keywords: [
    'anunciar apartamento para alugar grátis RN',
    'divulgar apartamento para aluguel RN',
    'anunciar aluguel apartamento Natal',
    'anunciar imóvel para alugar RN'
  ],
  alternates: { canonical: `${BASE_URL}/anunciar-apartamento-para-alugar-gratis` },
  openGraph: {
    title: 'Anunciar apartamento para alugar grátis no RN | Potilar',
    description: 'Publique apartamento para aluguel no Rio Grande do Norte com contato direto.',
    url: `${BASE_URL}/anunciar-apartamento-para-alugar-gratis`
  }
};

export default function Page() {
  return (
    <SeoAdvertiseHousePage
      title="Anunciar apartamento para alugar grátis"
      description="Cadastre seu apartamento para aluguel no Rio Grande do Norte com fotos, preço, localização e contato direto com interessados pela Potilar."
      intentLabel="anunciar apartamento para alugar"
      transaction="Aluguel"
      propertyType="Apartamento"
      ctaLabel="Anunciar apartamento grátis"
    />
  );
}
