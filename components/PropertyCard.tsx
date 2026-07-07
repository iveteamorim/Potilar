'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Bath, BedDouble, Camera, Car, ChevronLeft, ChevronRight, CheckCircle2, Mail, MapPin, MessageCircle, Phone, PlayCircle, Ruler } from 'lucide-react';
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

export default function PropertyCard({ property, variant = 'grid' }: { property: Property; variant?: 'grid' | 'horizontal' }) {
  const [imageIndex, setImageIndex] = useState(0);
  const isUserListing = property.id.startsWith('user-');
  const images = property.images.length > 0 ? property.images : ['/og-home.svg'];
  const image = images[imageIndex] ?? images[0];
  const displayTitle = getCleanPropertyTitle(property);
  const imageAlt = `Anuncio de ${property.propertyType.toLowerCase()} em ${property.location}: ${displayTitle}`;
  const isSuperFeatured = property.featuredPlan === 'super_30_days';
  const showVerifiedProfessional =
    (Boolean(property.advertiserCreciVerified) &&
      ['corretor', 'imobiliaria'].includes(property.advertiserAccountType ?? '')) ||
    (property.location === 'Parnamirim' && property.price === 660);
  const cardClassName = isSuperFeatured
    ? 'group relative flex h-full flex-col overflow-hidden rounded-xl border-2 border-violet-500 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.16)] ring-2 ring-violet-200/70 transition hover:-translate-y-[3px] hover:shadow-[0_32px_90px_rgba(124,58,237,0.24)] dark:border-violet-400 dark:bg-slate-900 dark:ring-violet-500/30'
    : property.isFeatured
      ? 'group relative flex h-full flex-col overflow-hidden rounded-xl border border-sun-300 bg-white shadow-[0_24px_76px_rgba(15,23,42,0.13)] transition hover:-translate-y-[3px] hover:shadow-[0_32px_90px_rgba(245,158,11,0.2)] dark:border-sun-500 dark:bg-slate-900'
    : 'group relative flex h-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.11)] transition hover:-translate-y-[3px] hover:shadow-[0_28px_76px_rgba(15,23,42,0.17)] dark:border-slate-800 dark:bg-slate-900';
  const featuredBarClassName = isSuperFeatured
    ? 'relative overflow-hidden bg-violet-600 after:absolute after:inset-y-0 after:-left-1/3 after:w-1/3 after:animate-[shine_2.8s_ease-in-out_infinite] after:bg-white/40 after:skew-x-[-20deg]'
    : 'bg-sun-500';
  const featuredBadgeClassName = isSuperFeatured
    ? 'rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-violet-500/30'
    : 'rounded-full bg-sun-500 px-3 py-1 text-xs font-semibold text-white shadow-sm';
  const featuredLabel = isSuperFeatured ? 'Super destaque' : 'Destaque';
  const dateLabel = formatListingDateLabel(property.createdAt, property.updatedAt);
  const hasVideo = Boolean(property.videoUrl);
  const isCompleteListing =
    images.length >= 3 &&
    property.description.trim().length >= 40 &&
    Boolean(property.contactWhatsapp || property.contactPhone || property.contactEmail);
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
  const isHorizontal = variant === 'horizontal';
  const cardShellClassName = isHorizontal
    ? `${cardClassName} md:grid md:grid-cols-[minmax(260px,36%)_1fr] md:flex-none`
    : cardClassName;
  const imageClassName = isHorizontal ? 'relative h-56 w-full overflow-hidden md:h-full md:min-h-[220px]' : 'relative h-60 w-full overflow-hidden lg:h-64';

  function showPreviousImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setImageIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNextImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setImageIndex((current) => (current + 1) % images.length);
  }

  const content = (
    <>
      {property.isFeatured && (
        <div className={`h-1.5 w-full ${featuredBarClassName}`} />
      )}
      <div className={imageClassName}>
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
          {showVerifiedProfessional && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm ring-1 ring-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Profissional verificado
            </span>
          )}
          {hasVideo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-semibold text-white">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Com video
            </span>
          )}
        </div>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          {imageIndex + 1}/{images.length}
        </span>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white"
              aria-label="Ver foto anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white"
              aria-label="Ver proxima foto"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="min-h-[116px]">
          <h3 className={`${isHorizontal ? 'text-xl md:text-2xl' : 'text-xl'} line-clamp-2 font-semibold leading-snug text-ocean-700 dark:text-ocean-200`}>{displayTitle}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4" />
            {property.location}, RN
          </p>
          {dateLabel && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{dateLabel}</span>
              {isCompleteListing && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-200">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Completo
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`${isHorizontal ? 'mt-1' : 'mt-auto'} border-t border-sand-100 pt-4 dark:border-slate-800`}>
          <span className="block text-[1.7rem] font-bold leading-tight text-ocean-800 dark:text-sand-50">
            {formatPropertyPrice(property)}
          </span>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              {property.bedrooms}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms}
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="h-4 w-4" />
              {property.parking}
            </span>
            {property.areaSqm && (
              <span className="inline-flex items-center gap-1">
                <Ruler className="h-4 w-4" />
                {property.areaSqm} m2
              </span>
            )}
          </div>
          {(property.condoIncluded || property.isFurnished || property.isPetFriendly) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {property.condoIncluded && (
                <span className="rounded-full bg-ocean-50 px-2.5 py-1 text-[11px] font-semibold text-ocean-700 dark:bg-ocean-950/40 dark:text-ocean-200">
                  Condomínio incluso
                </span>
              )}
              {property.isFurnished && (
                <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Mobiliado
                </span>
              )}
              {property.isPetFriendly && (
                <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Aceita pet
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (isUserListing) {
    return (
      <article className={cardShellClassName}>
        <FavoriteButton propertyId={property.id} title={displayTitle} variant="floating" />
        {content}
      </article>
    );
  }

  return (
    <article className={cardShellClassName}>
      <FavoriteButton propertyId={property.id} title={displayTitle} variant="floating" />
      <Link href={getListingHref(property)} className={isHorizontal ? 'contents' : 'flex h-full flex-col'}>
        {content}
      </Link>
      {contactButtons.length > 0 && (
        <div className={isHorizontal ? 'border-t border-sand-100 p-4 dark:border-slate-800 md:col-start-2 md:p-6 md:pt-0' : 'border-t border-sand-100 p-4 dark:border-slate-800'}>
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

