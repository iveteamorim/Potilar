import type { Metadata } from 'next';
import SeoAdvertiseHousePage from '@/components/SeoAdvertiseHousePage';
import { BASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Anunciar casa para vender grátis no RN',
  description:
    'Anuncie casa para vender grátis no Rio Grande do Norte. Cadastre seu imóvel com fotos, preço, cidade e contato direto na Potilar.',
  alternates: { canonical: `${BASE_URL}/anunciar-casa-para-vender-gratis` },
  openGraph: {
    title: 'Anunciar casa para vender grátis no RN | Potilar',
    description:
      'Publique casa a venda no Rio Grande do Norte com contato direto na Potilar.',
    url: `${BASE_URL}/anunciar-casa-para-vender-gratis`
  }
};

export default function Page() {
  return (
    <SeoAdvertiseHousePage
      title="Anunciar casa para vender grátis"
      description="Publique sua casa para vender no Rio Grande do Norte. A Potilar ajuda a divulgar casas a venda com fotos, preço, localização e contato direto com interessados."
      intentLabel="anunciar casa para vender"
      transaction="Compra"
    />
  );
}
