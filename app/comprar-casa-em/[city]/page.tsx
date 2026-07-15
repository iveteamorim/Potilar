import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeoCityHouseAliasPage, { getCityHouseAliasPath } from '@/components/SeoCityHouseAliasPage';
import { BASE_URL } from '@/lib/config';
import { getAllCitySlugs, isKnownCitySlug, resolveCityNameFromSlug } from '@/lib/cityPages';

export const revalidate = 300;

export function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  if (!isKnownCitySlug(params.city)) return { title: 'Cidade não encontrada' };
  const cityName = resolveCityNameFromSlug(params.city)!;
  const title = `Comprar casa em ${cityName}, RN`;
  const description = `Casas para comprar em ${cityName}, Rio Grande do Norte. Veja casas a venda com fotos, preço, mapa e contato direto na Potilar.`;
  const canonical = `${BASE_URL}${getCityHouseAliasPath(cityName, 'comprar')}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | Potilar`, description, url: canonical }
  };
}

export default function Page({ params }: { params: { city: string } }) {
  if (!isKnownCitySlug(params.city)) notFound();
  return <SeoCityHouseAliasPage cityName={resolveCityNameFromSlug(params.city)!} citySlug={params.city} mode="comprar" />;
}
