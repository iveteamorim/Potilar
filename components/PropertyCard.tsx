import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Car, MapPin } from 'lucide-react';
import type { Property } from '@/data/properties';

function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/imoveis/${property.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative h-48 w-full">
        <Image
          src={property.images[0]}
          alt={`Anúncio de ${property.propertyType.toLowerCase()} em ${property.location}: ${property.title}`}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-sun-500 px-3 py-1 text-xs font-semibold text-white">
            {property.transaction}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
            {property.propertyType}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{property.title}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4" />
            {property.location}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              {property.bedrooms}
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="h-4 w-4" />
              {property.parking}
            </span>
          </div>
          <span className="text-base font-semibold text-ocean-700 dark:text-sand-50">
            {formatPrice(property.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
