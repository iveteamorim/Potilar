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
  const title = `Casa a venda em ${cityName}, RN`;
  const description = `Casas a venda em ${cityName}, Rio Grande do Norte. Veja anúncios com fotos, preço, mapa e contato direto na Potilar.`;
  const canonical = `${BASE_URL}/casa-a-venda-em/${params.city}`;

  return {
    title,
    description,
    keywords: [
      `casa a venda em ${cityName}`,
      `casas a venda em ${cityName}`,
      `comprar casa em ${cityName}`,
      `casa para comprar em ${cityName}`,
      `casas ${cityName} RN`
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
      transaction="Compra"
      propertyType="Casa"
      path={`/casa-a-venda-em/${params.city}`}
      title={`Casa a venda em ${cityName}, RN`}
      description={`Casas a venda em ${cityName}, Rio Grande do Norte. Compare anúncios com fotos, preço, mapa e contato direto com anunciantes na Potilar.`}
    />
  );
}
