import Link from 'next/link';
import { slugify } from '@/lib/slugify';

type CitySeoContentProps = {
  cityName: string;
  variant?: 'overview' | 'rent' | 'house-sale';
};

function getVariantCopy(cityName: string, variant: CitySeoContentProps['variant']) {
  const citySlug = slugify(cityName);

  if (variant === 'rent') {
    return {
      title: `Aluguel em ${cityName}: casas, apartamentos e imoveis no RN`,
      body: `Quem procura aluguel em ${cityName} pode comparar casas, apartamentos, kitnets e pontos comerciais em uma pagina feita para buscas locais do Rio Grande do Norte. A Potilar organiza anuncios por cidade, preco, tipo de imovel e contato direto, ajudando moradores, estudantes, familias, profissionais e empresas a encontrarem opcoes com mais clareza.`,
      links: [
        ['Casas para alugar', `/alugar-casa-em/${citySlug}`],
        ['Todos os imoveis em aluguel', `/imoveis?transaction=Aluguel&city=${encodeURIComponent(cityName)}`],
        ['Anunciar imovel gratis', `/anunciar-imovel-gratis-em/${citySlug}`]
      ]
    };
  }

  if (variant === 'house-sale') {
    return {
      title: `Casa a venda em ${cityName}: busca local no Rio Grande do Norte`,
      body: `A pagina de casa a venda em ${cityName} reune oportunidades para quem quer comprar, vender ou comparar imoveis residenciais no RN. A Potilar valoriza buscas por cidade e contato direto com anunciantes, criando uma alternativa regional para quem procura casa propria, investimento ou mudanca dentro do Rio Grande do Norte.`,
      links: [
        ['Comprar casa', `/comprar-casa-em/${citySlug}`],
        ['Casas a venda', `/imoveis?propertyType=Casa&transaction=Compra&city=${encodeURIComponent(cityName)}`],
        ['Anunciar imovel gratis', `/anunciar-imovel-gratis-em/${citySlug}`]
      ]
    };
  }

  return {
    title: `Imoveis em ${cityName}: aluguel, venda e anuncios locais`,
    body: `A Potilar cria uma porta de entrada para quem pesquisa imoveis em ${cityName} e em todo o Rio Grande do Norte. Aqui a busca local considera casas, apartamentos, terrenos, kitnets, temporada e pontos comerciais, com foco em contato direto entre quem anuncia e quem procura. A ideia e fortalecer o mercado imobiliario regional, incluindo capital, litoral, regiao metropolitana e cidades do interior.`,
    links: [
      ['Aluguel em cidade', `/aluguel-em/${citySlug}`],
      ['Casa a venda', `/casa-a-venda-em/${citySlug}`],
      ['Anunciar gratis', `/anunciar-imovel-gratis-em/${citySlug}`]
    ]
  };
}

export default function CitySeoContent({ cityName, variant = 'overview' }: CitySeoContentProps) {
  const copy = getVariantCopy(cityName, variant);

  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{copy.title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{copy.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {copy.links.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-full border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700">
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
