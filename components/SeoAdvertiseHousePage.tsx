import Link from 'next/link';

type SeoAdvertiseHousePageProps = {
  title: string;
  description: string;
  intentLabel: string;
  transaction: 'Aluguel' | 'Compra';
};

export default function SeoAdvertiseHousePage({
  title,
  description,
  intentLabel,
  transaction
}: SeoAdvertiseHousePageProps) {
  const formHref = `/anunciar?imovel=Casa&transaction=${encodeURIComponent(transaction)}`;

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Anunciar grátis</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={formHref} className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
              Anunciar casa grátis
            </Link>
            <Link href="/imoveis/cidades" className="rounded-2xl border border-ocean-200 px-5 py-3 text-sm font-semibold text-ocean-700">
              Ver cidades do RN
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            'Publique fotos, preço, cidade e detalhes do imóvel.',
            'Receba interessados direto pelo contato escolhido.',
            `Página indicada para quem quer ${intentLabel} no Rio Grande do Norte.`
          ].map((item) => (
            <div key={item} className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{item}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
