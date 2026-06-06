import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Car, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Property } from '@/data/properties';
import { formatListingDateLabel } from '@/lib/dateLabels';
import { getCleanPropertyTitle } from '@/lib/displayTitle';
import { getListingHref } from '@/lib/listingUrls';
import FavoriteButton from './FavoriteButton';

function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

function formatPropertyPrice(property: Property) {
  const price = formatPrice(property.price);
  if (property.transaction !== 'Temporada' || !property.pricePeriod) return price;
  return `${price}/${property.pricePeriod}`;
}

function cleanPhone(value?: string) {
  return value?.replace(/\D/g, '') ?? '';
}

export default function PropertyCard({ property }: { property: Property }) {
  const isUserListing = property.id.startsWith('user-');
  const image = property.images[0] ?? '/og-home.svg';
  const displayTitle = getCleanPropertyTitle(property);
  const imageAlt = `Anuncio de ${property.propertyType.toLowerCase()} em ${property.location}: ${displayTitle}`;
  const isSuperFeatured = property.featuredPlan === 'super_30_days';
  const cardClassName = isSuperFeatured
    ? 'group relative flex h-full flex-col overflow-hidden rounded-lg border-2 border-violet-500 bg-white shadow-[0_24px_70px_rgba(124,58,237,0.26)] ring-2 ring-violet-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(124,58,237,0.34)] dark:border-violet-400 dark:bg-slate-900 dark:ring-violet-500/30'
    : property.isFeatured
      ? 'group relative flex h-full flex-col overflow-hidden rounded-lg border-2 border-sun-400 bg-white shadow-[0_18px_45px_rgba(245,158,11,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(245,158,11,0.26)] dark:border-sun-500 dark:bg-slate-900'
    : 'group flex h-full flex-col overflow-hidden rounded-lg border border-sand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900';
  const featuredBarClassName = isSuperFeatured
    ? 'relative overflow-hidden bg-violet-600 after:absolute after:inset-y-0 after:-left-1/3 after:w-1/3 after:animate-[shine_2.8s_ease-in-out_infinite] after:bg-white/40 after:skew-x-[-20deg]'
    : 'bg-sun-500';
  const featuredBadgeClassName = isSuperFeatured
    ? 'rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-violet-500/30'
    : 'rounded-full bg-sun-500 px-3 py-1 text-xs font-semibold text-white shadow-sm';
  const featuredLabel = isSuperFeatured ? 'Super destaque' : 'Destaque';
  const dateLabel = formatListingDateLabel(property.createdAt, property.updatedAt);
  const contactMethods =
    property.contactMethods && property.contactMethods.length > 0
      ? property.contactMethods
      : [
          property.contactWhatsapp ? 'whatsapp' : '',
          property.contactPhone ? 'phone' : '',
          property.contactEmail ? 'email' : ''
        ].filter(Boolean);
  const whatsappNumber = cleanPhone(property.contactWhatsapp);
  const phoneNumber = cleanPhone(property.contactPhone);
  const emailAddress = property.contactEmail?.trim();
  const contactButtons = [
    contactMethods.includes('whatsapp') && whatsappNumber
      ? {
          key: 'whatsapp',
          href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Ola, tenho interesse no anuncio: ${displayTitle}`)}`,
          label: 'WhatsApp',
          icon: MessageCircle,
          className: 'bg-green-600 text-white',
          external: true
        }
      : null,
    contactMethods.includes('phone') && phoneNumber
      ? {
          key: 'phone',
          href: `tel:+${phoneNumber}`,
          label: 'Telefone',
          icon: Phone,
          className: 'border border-ocean-200 text-ocean-700 dark:border-slate-700 dark:text-slate-200',
          external: false
        }
      : null,
    contactMethods.includes('email') && emailAddress
      ? {
          key: 'email',
          href: `mailto:${emailAddress}?subject=${encodeURIComponent(`Interesse no anuncio: ${displayTitle}`)}`,
          label: 'Email',
          icon: Mail,
          className: 'border border-ocean-200 text-ocean-700 dark:border-slate-700 dark:text-slate-200',
          external: false
        }
      : null
  ].filter(Boolean);

  const content = (
    <>
      {property.isFeatured && (
        <div className={`h-1.5 w-full ${featuredBarClassName}`} />
      )}
      <div className="relative h-48 w-full overflow-hidden">
        {image.startsWith('data:') || image.startsWith('blob:') ? (
          <img src={image} alt={imageAlt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <Image src={image} alt={imageAlt} fill className="object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span className="bg-sun-500 px-3 py-1 text-xs font-bold text-white">
            {property.transaction}
          </span>
          <span className="bg-white/95 px-3 py-1 text-xs font-bold text-slate-800">
            {property.propertyType}
          </span>
          {isUserListing && (
            <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
              Novo
            </span>
          )}
          {property.isFeatured && (
            <span className={featuredBadgeClassName}>
              {featuredLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h3 className="line-clamp-3 text-lg font-semibold leading-snug text-slate-950 dark:text-white">{displayTitle}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4" />
            {property.location}, RN
          </p>
          {dateLabel && (
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {dateLabel}
            </p>
          )}
        </div>
        <div className="mt-auto border-t border-sand-100 pt-3 dark:border-slate-800">
          <span className="block text-xl font-bold text-ocean-800 dark:text-sand-50">
            {formatPropertyPrice(property)}
          </span>
          <div className="mt-3 flex items-center gap-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              {property.bedrooms}
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="h-4 w-4" />
              {property.parking}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  if (isUserListing) {
    return (
      <article className={cardClassName}>
        <FavoriteButton propertyId={property.id} title={displayTitle} />
        {content}
      </article>
    );
  }

  return (
    <article className={cardClassName}>
      <FavoriteButton propertyId={property.id} title={displayTitle} />
      <Link href={getListingHref(property)} className="flex h-full flex-col">
        {content}
      </Link>
      {contactButtons.length > 0 && (
        <div className="border-t border-sand-100 p-4 dark:border-slate-800">
          <div className={`grid gap-2 ${contactButtons.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {contactButtons.map((button) => {
              if (!button) return null;
              const Icon = button.icon;
              return (
                <a
                  key={button.key}
                  href={button.href}
                  target={button.external ? '_blank' : undefined}
                  rel={button.external ? 'noreferrer' : undefined}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${button.className}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {button.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
