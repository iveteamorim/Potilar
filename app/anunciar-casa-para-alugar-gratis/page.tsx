import type { Metadata } from 'next';
import SeoAdvertiseHousePage from '@/components/SeoAdvertiseHousePage';
import { BASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Anunciar casa para alugar gratis no RN',
  description:
    'Anuncie casa para alugar gratis no Rio Grande do Norte. Publique fotos, preco, cidade e receba contato direto pela Potilar.',
  alternates: { canonical: `${BASE_URL}/anunciar-casa-para-alugar-gratis` },
  openGraph: {
    title: 'Anunciar casa para alugar gratis no RN | Potilar',
    description:
      'Publique casa para aluguel no Rio Grande do Norte com contato direto na Potilar.',
    url: `${BASE_URL}/anunciar-casa-para-alugar-gratis`
  }
};

export default function Page() {
  return (
    <SeoAdvertiseHousePage
      title="Anunciar casa para alugar gratis"
      description="Publique sua casa para alugar no Rio Grande do Norte. A Potilar ajuda particulares, corretores e imobiliarias a divulgar casas com fotos, preco, cidade e contato direto."
      intentLabel="anunciar casa para alugar"
      transaction="Aluguel"
    />
  );
}
