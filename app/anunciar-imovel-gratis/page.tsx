import type { Metadata } from 'next';
import SeoAdvertiseHousePage from '@/components/SeoAdvertiseHousePage';
import { BASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Anunciar imóvel grátis no RN',
  description:
    'Anuncie imóvel grátis no Rio Grande do Norte. Publique casa, apartamento, terreno, kitnet ou ponto comercial com fotos, preço, cidade e contato direto.',
  keywords: [
    'anunciar imóvel grátis RN',
    'anunciar imóveis Rio Grande do Norte',
    'divulgar imóvel grátis RN',
    'site para anunciar imóvel RN',
    'portal imobiliário RN'
  ],
  alternates: { canonical: `${BASE_URL}/anunciar-imovel-gratis` },
  openGraph: {
    title: 'Anunciar imóvel grátis no RN | Potilar',
    description: 'Publique seu imóvel no Rio Grande do Norte com contato direto na Potilar.',
    url: `${BASE_URL}/anunciar-imovel-gratis`
  }
};

export default function Page() {
  return (
    <SeoAdvertiseHousePage
      title="Anunciar imóvel grátis no RN"
      description="Publique seu imóvel no Rio Grande do Norte em uma plataforma regional feita para quem quer alugar, vender ou receber contatos diretos de interessados no RN."
      intentLabel="anunciar imóvel grátis"
      transaction="Aluguel"
      propertyType="Casa"
      ctaLabel="Anunciar imóvel grátis"
      highlights={[
        'Cadastre casa, apartamento, terreno, kitnet ou ponto comercial.',
        'A Potilar trabalha o foco regional: cidades, bairros e buscas do Rio Grande do Norte.',
        'Página indicada para proprietários, corretores e imobiliárias que querem anunciar no RN.'
      ]}
    />
  );
}
