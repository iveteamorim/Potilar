import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeoAdvertiseHousePage from '@/components/SeoAdvertiseHousePage';
import { BASE_URL } from '@/lib/config';
import { getAllCitySlugs, isKnownCitySlug, resolveCityNameFromSlug } from '@/lib/cityPages';

type PageProps = {
  params: { city: string };
};

export function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!isKnownCitySlug(params.city)) {
    return {};
  }

  const cityName = resolveCityNameFromSlug(params.city);
  if (!cityName) {
    return {};
  }

  const title = `Anunciar imóvel grátis em ${cityName}, RN`;
  const description = `Anuncie imóvel grátis em ${cityName}, Rio Grande do Norte. Publique casa, apartamento, terreno, kitnet ou ponto comercial na Potilar com contato direto.`;

  return {
    title,
    description,
    keywords: [
      `anunciar imóvel grátis em ${cityName}`,
      `anunciar imóvel em ${cityName}`,
      `anunciar casa em ${cityName}`,
      `divulgar imóvel grátis ${cityName} RN`,
      `portal imobiliário ${cityName} RN`
    ],
    alternates: { canonical: `${BASE_URL}/anunciar-imovel-gratis-em/${params.city}` },
    openGraph: {
      title: `${title} | Potilar`,
      description,
      url: `${BASE_URL}/anunciar-imovel-gratis-em/${params.city}`
    }
  };
}

export default function Page({ params }: PageProps) {
  if (!isKnownCitySlug(params.city)) {
    notFound();
  }

  const cityName = resolveCityNameFromSlug(params.city);
  if (!cityName) {
    notFound();
  }

  return (
    <SeoAdvertiseHousePage
      title={`Anunciar imóvel grátis em ${cityName}`}
      description={`Publique seu imóvel em ${cityName}, RN, em uma plataforma regional feita para proprietários, corretores e imobiliárias que querem contato direto com interessados locais.`}
      intentLabel={`anunciar imóvel grátis em ${cityName}`}
      transaction="Aluguel"
      propertyType="Casa"
      cityName={cityName}
      ctaLabel={`Anunciar em ${cityName}`}
      highlights={[
        `Página local para anunciar casas, apartamentos, terrenos, kitnets e pontos comerciais em ${cityName}.`,
        'A Potilar trabalha cidade por cidade no Rio Grande do Norte, incluindo interior, litoral e Grande Natal.',
        `Ideal para quem busca aparecer em pesquisas como anunciar imóvel grátis em ${cityName} ou divulgar imóvel em ${cityName}.`
      ]}
    />
  );
}
