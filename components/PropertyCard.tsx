'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Bath, BedDouble, Box, Camera, Car, ChevronLeft, ChevronRight, CheckCircle2, Mail, MapPin, MessageCircle, Phone, PlayCircle, Ruler } from 'lucide-react';
import type { Property } from '@/data/properties';
import { formatListingDateLabel } from '@/lib/dateLabels';
import { getCleanPropertyTitle } from '@/lib/displayTitle';
import { getListingHref } from '@/lib/listingUrls';
import { getPublicProfilePath } from '@/lib/publicProfile';
import { showsDestaquePresentation } from '@/lib/legacyHomeFeatured';
import FavoriteButton from './FavoriteButton';
import ListingMessageButton from './ListingMessageButton';

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

function isProfessionalAdvertiser(property: Property) {
  return ['corretor', 'imobiliaria'].includes(property.advertiserAccountType ?? '');
}

function AdvertiserBrandMark({
  property,
  size = 'default'
}: {
  property: Property;
  size?: 'compact' | 'default' | 'large';
}) {
  if (!isProfessionalAdvertiser(property)) return null;

  const displayName = property.advertiserDisplayName?.trim();
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    : '';

  if (!property.advertiserImageUrl && !initials) return null;

  const boxClassName =
    size === 'compact'
      ? 'h-11 w-14 text-[10px]'
      : size === 'large'
        ? 'h-[4.5rem] w-[5.75rem] text-sm'
        : 'h-14 w-20 text-xs';

  const mark = (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-sand-200 bg-white p-1.5 font-bold text-ocean-800 shadow-sm dark:border-slate-700 dark:bg-white ${boxClassName}`}
    >
      {property.advertiserImageUrl ? (
        <img
          src={property.advertiserImageUrl}
          alt={displayName ? `Logo de ${displayName}` : 'Logo do profissional'}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );

  if (!property.advertiserPublicSlug) return mark;

  return (
    <Link
      href={getPublicProfilePath(property.advertiserPublicSlug)}
      className="shrink-0 transition hover:-translate-y-0.5"
      aria-label={
        displayName ? `Ver p\u00e1gina de ${displayName}` : 'Ver p\u00e1gina profissional'
      }
      onClick={(event) => event.stopPropagation()}
    >
      {mark}
    </Link>
  );
}

function cleanPhone(value?: string) {
  return value?.replace(/\D/g, '') ?? '';
}

export default function PropertyCard({
  property,
  variant = 'grid',
  panelPreview = false
}: {
  property: Property;
  variant?: 'grid' | 'horizontal' | 'compact';
  /** Vista interna do painel do anunciante: sem favorito nem contacto publico. */
  panelPreview?: boolean;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const isUserListing = property.id.startsWith('user-');
  const images = property.images.length > 0 ? property.images : ['/og-home.svg'];
  const image = images[imageIndex] ?? images[0];
  const displayTitle = getCleanPropertyTitle(property);
  const imageAlt = `Anuncio de ${property.propertyType.toLowerCase()} em ${property.location}: ${displayTitle}`;
  const isSuperFeatured = property.isFeatured && property.featuredPlan === 'super_30_days';
  const showVerifiedProfessional =
    (Boolean(property.advertiserCreciVerified) &&
      ['corretor', 'imobiliaria'].includes(property.advertiserAccountType ?? '')) ||
    (property.location === 'Parnamirim' && property.price === 660);
  const showDestaquePresentation = showsDestaquePresentation(property);
  const cardClassName = isSuperFeatured
    ? 'group relative flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-violet-500 bg-white shadow-[0_0_0_1px_rgba(124,58,237,0.35)] transition hover:-translate-y-[2px] hover:shadow-[0_8px_28px_rgba(124,58,237,0.22)] dark:border-violet-400 dark:bg-slate-900'
    : showDestaquePresentation
      ? 'group relative flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-[#ef8f1f] bg-white shadow-[0_0_0_1px_rgba(239,143,31,0.45)] transition hover:-translate-y-[2px] hover:shadow-[0_8px_28px_rgba(239,143,31,0.22)] dark:border-sun-400 dark:bg-slate-900'
      : 'group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.11)] transition hover:-translate-y-[3px] hover:shadow-[0_28px_76px_rgba(15,23,42,0.17)] dark:border-slate-800 dark:bg-slate-900';
  const featuredBadgeClassName = isSuperFeatured
    ? 'rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-violet-500/30'
    : 'rounded-full bg-sun-500 px-3 py-1 text-xs font-semibold text-white shadow-sm';
  const featuredLabel = isSuperFeatured ? 'Super destaque' : 'Destaque';
  const dateLabel = formatListingDateLabel(property.createdAt, property.updatedAt);
  const hasVideo = Boolean(property.videoUrl);
  const hasTour = Boolean(property.tourUrl);
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
          href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá, tenho interesse no anúncio: ${displayTitle}`)}`,
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
          href: `mailto:${emailAddress}?subject=${encodeURIComponent(`Interesse no anúncio: ${displayTitle}`)}`,
          label: 'Email',
          icon: Mail,
          className: 'border border-ocean-200 text-ocean-700 dark:border-slate-700 dark:text-slate-200',
          external: false
        }
      : null
  ].filter(Boolean);
  const hasPotilarChat = Boolean(property.ownerId) && !panelPreview;
  const hasContactActions = !panelPreview && (hasPotilarChat || contactButtons.length > 0);
  const contactActionCount = contactButtons.length + (hasPotilarChat ? 1 : 0);
  const isDenseContactRow = contactActionCount >= 3;
  const isHorizontal = variant === 'horizontal';
  const isCompact = variant === 'compact';
  const cardShellClassName = isHorizontal
    ? `${cardClassName} md:grid md:grid-cols-[minmax(200px,32%)_1fr] md:items-stretch`
    : cardClassName;
  const imageClassName = isHorizontal
    ? 'relative h-44 w-full overflow-hidden md:col-start-1 md:h-full md:min-h-[10.75rem]'
    : isCompact
      ? 'relative aspect-[8/5] w-full shrink-0 overflow-hidden'
      : 'relative h-60 w-full overflow-hidden lg:h-64';
  const favoriteButtonClassName = isCompact
    ? 'relative z-20 h-8 w-8 shadow-md'
    : isHorizontal
      ? 'relative z-20 h-9 w-9 shadow-md'
      : 'relative z-20 h-10 w-10 shadow-md';
  const listingIdForChat = property.id.startsWith('user-') ? property.id.replace(/^user-/, '') : property.id;
  const advertiserBrandSize = isCompact ? 'compact' : 'default';
  const bodyPaddingClassName = isHorizontal
    ? hasContactActions
      ? 'gap-2 px-3 pt-3 md:px-4 md:pt-4'
      : 'gap-2 p-3 md:p-4'
    : isCompact
      ? 'gap-1.5 p-3'
      : 'gap-3 p-5';
  const titleClassName = isHorizontal
    ? 'text-lg md:text-xl'
    : isCompact
      ? 'text-base'
      : 'text-xl';
  const priceClassName = isHorizontal ? 'text-xl md:text-[1.35rem]' : isCompact ? 'text-[1.15rem]' : 'text-[1.7rem]';
  const specsClassName = isHorizontal
    ? 'mt-1.5 gap-x-4 gap-y-1 text-xs'
    : isCompact
      ? 'mt-1.5 gap-x-3 gap-y-1 text-xs'
      : 'mt-3 gap-x-5 gap-y-2 text-sm';
  const tagsClassName = isHorizontal ? 'mt-1.5' : isCompact ? 'mt-2' : 'mt-3';
  const priceSectionClassName = isHorizontal
    ? 'mt-0 border-t border-sand-100 pt-2.5 dark:border-slate-800'
    : isCompact
      ? 'mt-auto min-h-[72px] border-t border-sand-100 pt-2 dark:border-slate-800'
      : 'mt-auto min-h-[142px] border-t border-sand-100 pt-4 dark:border-slate-800';
  const contactButtonClassName = isHorizontal
    ? isDenseContactRow
      ? 'gap-1 px-1.5 py-1.5 text-[11px]'
      : 'gap-1.5 px-2 py-1.5 text-xs'
    : isDenseContactRow
      ? 'gap-1 px-1.5 py-2 text-[11px]'
      : 'gap-1.5 px-2.5 py-2 text-xs';

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

  const contactButtonGrid = (
    <div className={isDenseContactRow ? 'grid grid-cols-3 gap-1.5' : 'grid grid-cols-2 gap-1.5'}>
      {hasPotilarChat && (
        <ListingMessageButton
          listingId={listingIdForChat}
          ownerId={property.ownerId!}
          title={displayTitle}
          label="Chat"
          buttonClassName={`inline-flex w-full items-center justify-center rounded-lg border border-ocean-200 font-semibold text-ocean-700 transition hover:bg-ocean-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${contactButtonClassName}`}
        />
      )}
      {contactButtons.map((button) => {
        if (!button) return null;
        const Icon = button.icon;
        const denseLabel =
          button.key === 'whatsapp' ? 'Zap' : button.key === 'phone' ? 'Tel' : button.key === 'email' ? 'Email' : button.label;
        return (
          <a
            key={button.key}
            href={button.href}
            target={button.external ? '_blank' : undefined}
            rel={button.external ? 'noreferrer' : undefined}
            className={`inline-flex w-full items-center justify-center rounded-lg font-semibold ${button.className} ${contactButtonClassName}`}
          >
            <Icon className={`${isHorizontal ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} aria-hidden="true" />
            {isDenseContactRow ? denseLabel : button.label}
          </a>
        );
      })}
    </div>
  );

  const contactActions = hasContactActions ? (
    isHorizontal ? (
      <div className="mt-2 border-t border-sand-100 pt-2.5 pb-0 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{contactButtonGrid}</div>
          <FavoriteButton
            propertyId={property.id}
            title={displayTitle}
            variant="floating"
            floatingClassName={favoriteButtonClassName}
          />
        </div>
      </div>
    ) : (
      <div
        className={
          isCompact ? 'border-t border-sand-100 p-2.5 dark:border-slate-800' : 'border-t border-sand-100 p-4 dark:border-slate-800'
        }
      >
        <div className={`${isCompact ? 'mb-2' : 'mb-2.5'} flex justify-end`}>
          <FavoriteButton
            propertyId={property.id}
            title={displayTitle}
            variant="floating"
            floatingClassName={favoriteButtonClassName}
          />
        </div>
        {contactButtonGrid}
      </div>
    )
  ) : null;

  const imageBlock = (
    <div className={imageClassName}>
        {image.startsWith('data:') || image.startsWith('blob:') ? (
          <img src={image} alt={imageAlt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <Image src={image} alt={imageAlt} fill className="object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className={`absolute left-3 top-3 flex flex-wrap items-center ${isCompact ? 'gap-1' : 'gap-2'}`}>
          <span className={`bg-sun-500 font-bold text-white ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}>
            {property.transaction}
          </span>
          <span className={`bg-white/95 font-bold text-slate-800 ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}>
            {property.propertyType}
          </span>
          {isUserListing && (
            <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
              Novo
            </span>
          )}
          {showDestaquePresentation && (
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
          {hasTour && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/95 px-3 py-1 text-xs font-semibold text-white">
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
              Tour 3D
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
              aria-label="Ver próxima foto"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
  );

  const detailsBlock = (
    <>
        <div className={isCompact ? 'min-h-[62px]' : isHorizontal ? '' : 'min-h-[116px]'}>
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <h3 className={`${titleClassName} line-clamp-2 font-semibold leading-snug text-ocean-700 dark:text-ocean-200`}>
                {displayTitle}
              </h3>
              <p
                className={`${isHorizontal ? 'mt-1 text-xs' : isCompact ? 'mt-1.5 text-xs' : 'mt-2 text-sm'} flex items-center gap-1.5 text-slate-500 dark:text-slate-400`}
              >
                <MapPin className={`${isHorizontal ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
                {property.location}, RN
              </p>
              {dateLabel && (
                <div className={`${isHorizontal ? 'mt-1' : isCompact ? 'mt-1.5' : 'mt-2'} flex flex-wrap items-center gap-2`}>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{dateLabel}</span>
                </div>
              )}
            </div>
            <AdvertiserBrandMark property={property} size={advertiserBrandSize} />
          </div>
        </div>
        <div className={priceSectionClassName}>
          <span className={`block ${priceClassName} font-bold leading-tight text-ocean-800 dark:text-sand-50`}>
            {formatPropertyPrice(property)}
          </span>
          <div className={`${specsClassName} flex flex-wrap items-center font-semibold text-slate-500 dark:text-slate-400`}>
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
            <div className={`${tagsClassName} flex flex-wrap gap-1.5`}>
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
    </>
  );

  const content = (
    <>
      {imageBlock}
      <div className={`flex flex-1 flex-col ${bodyPaddingClassName}`}>{detailsBlock}</div>
    </>
  );

  const floatingFavorite = !hasContactActions && !panelPreview ? (
    <FavoriteButton
      propertyId={property.id}
      title={displayTitle}
      variant="floating"
      floatingClassName="absolute bottom-3 right-3 z-20 h-10 w-10"
    />
  ) : null;

  if (isHorizontal) {
    const detailsColumn = (
      <div className={`flex flex-col ${bodyPaddingClassName} md:col-start-2`}>
        {isUserListing ? (
          detailsBlock
        ) : (
          <Link href={getListingHref(property)} className="block">
            {detailsBlock}
          </Link>
        )}
        {contactActions}
      </div>
    );

    return (
      <article className={cardShellClassName}>
        {floatingFavorite}
        {imageBlock}
        {detailsColumn}
      </article>
    );
  }

  if (isUserListing) {
    return (
      <article className={cardShellClassName}>
        {floatingFavorite}
        {content}
        {contactActions}
      </article>
    );
  }

  return (
    <article className={cardShellClassName}>
      {floatingFavorite}
      <Link href={getListingHref(property)} className="flex h-full flex-col">
        {content}
      </Link>
      {contactActions}
    </article>
  );
}

