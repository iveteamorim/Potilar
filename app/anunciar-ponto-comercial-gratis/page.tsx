import type { Metadata } from 'next';
import SeoAdvertiseHousePage from '@/components/SeoAdvertiseHousePage';
import { BASE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Anunciar ponto comercial grátis no RN',
  description:
    'Anuncie ponto comercial grátis no Rio Grande do Norte. Publique loja, sala comercial, galpão ou ponto de rua com contato direto na Potilar.',
  keywords: [
    'anunciar ponto comercial grátis RN',
    'anunciar loja para alugar RN',
    'anunciar sala comercial RN',
    'divulgar imóvel comercial RN',
    'ponto comercial Rio Grande do Norte'
  ],
  alternates: { canonical: `${BASE_URL}/anunciar-ponto-comercial-gratis` },
  openGraph: {
    title: 'Anunciar ponto comercial grátis no RN | Potilar',
    description: 'Publique loja, sala comercial, galpão ou ponto de rua no Rio Grande do Norte.',
    url: `${BASE_URL}/anunciar-ponto-comercial-gratis`
  }
};

export default function Page() {
  return (
    <SeoAdvertiseHousePage
      title="Anunciar ponto comercial grátis"
      description="Publique seu ponto comercial no Rio Grande do Norte com tipo de comércio, área, vagas, diferenciais do ponto e contato direto com interessados."
      intentLabel="anunciar ponto comercial"
      transaction="Aluguel"
      propertyType="Ponto comercial"
      ctaLabel="Anunciar ponto comercial"
      highlights={[
        'Ideal para loja, sala comercial, galpão, ponto de rua e serviços.',
        'Destaque informações comerciais como vão livre, fachada para rua, vagas e carga e descarga.',
        'Busca regional para quem procura imóveis comerciais no Rio Grande do Norte.'
      ]}
    />
  );
}
