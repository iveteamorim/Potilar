import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeoCityTransactionAliasPage from '@/components/SeoCityTransactionAliasPage';
import { BASE_URL } from '@/lib/config';
import { getAllCitySlugs, isKnownCitySlug, resolveCityNameFromSlug } from '@/lib/cityPages';

export const revalidate = 300;

export function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  if (!isKnownCitySlug(params.city)) return { title: 'Cidade não encontrada' };
  const cityName = resolveCityNameFromSlug(params.city)!;
  const title = `Aluguel em ${cityName}, RN`;
  const description = `Imóveis para aluguel em ${cityName}, Rio Grande do Norte. Veja casas, apartamentos, kitnets e pontos comerciais com contato direto na Potilar.`;
  const canonical = `${BASE_URL}/aluguel-em/${params.city}`;

  return {
    title,
    description,
    keywords: [
      `aluguel em ${cityName}`,
      `imóveis para alugar em ${cityName}`,
      `casas para alugar em ${cityName}`,
      `apartamentos para alugar em ${cityName}`,
      `aluguel ${cityName} RN`
    ],
    alternates: { canonical },
    openGraph: { title: `${title} | Potilar`, description, url: canonical }
  };
}

export default function Page({ params }: { params: { city: string } }) {
  if (!isKnownCitySlug(params.city)) notFound();
  const cityName = resolveCityNameFromSlug(params.city)!;

  return (
    <SeoCityTransactionAliasPage
      cityName={cityName}
      citySlug={params.city}
      transaction="Aluguel"
      path={`/aluguel-em/${params.city}`}
      title={`Aluguel em ${cityName}, RN`}
      description={`Imóveis para aluguel em ${cityName}, Rio Grande do Norte. Veja casas, apartamentos, kitnets e pontos comerciais com fotos, mapa e contato direto na Potilar.`}
    />
  );
}
