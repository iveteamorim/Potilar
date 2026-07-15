import type { Property } from '@/data/properties';
import PropertyCard from './PropertyCard';

type Props = {
  items: Property[];
};

export default function PropertyList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum anúncio encontrado</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Ajuste os filtros ou tente outra cidade para ver novas opcoes.
        </p>
        <a
          href="/imoveis"
          className="mt-4 inline-flex rounded-full border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          Limpar filtros
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
