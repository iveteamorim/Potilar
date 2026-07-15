import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Flag, Mail, MessageCircle, Phone, PlayCircle, ShieldCheck } from 'lucide-react';
import { BASE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';
import PropertyMap from '@/components/PropertyMapLoader';
import PropertyGallery from '@/components/PropertyGallery';
import PropertyCard from '@/components/PropertyCard';
import ShareButtons from '@/components/ShareButtons';
import FavoriteButton from '@/components/FavoriteButton';
import ListingViewTracker from '@/components/ListingViewTracker';
import WhatsAppStatLink from '@/components/WhatsAppStatLink';
import ListingMessageButton from '@/components/ListingMessageButton';
import { getPublicProfilePath } from '@/lib/publicProfile';
import { properties, type Property } from '@/data/properties';
import { createClient } from '@/lib/supabase/server';
import { fetchPublicListingDetail } from '@/lib/fetchApprovedListings';
import { listingRowToProperty, PUBLIC_LISTING_SELECT_WITH_CONTACT } from '@/lib/listings';
import { formatListingDateLabel } from '@/lib/dateLabels';
import { getCleanPropertyTitle } from '@/lib/displayTitle';

const LISTING_SELECT = `owner_id,${PUBLIC_LISTING_SELECT_WITH_CONTACT}`;

function cleanPhone(value?: string) {
  return value?.replace(/\D/g, '') ?? '';
}

function getListingCode(listingId: string) {
  return `POT-${listingId.slice(0, 8).toUpperCase()}`;
}

function getPublicFirstName(value?: string) {
  return value?.trim().split(/\s+/)[0] || '';
}

async function getProperty(slug: string): Promise<Property | null> {
  const normalizedSlug = decodeURIComponent(slug).toLowerCase();
  const staticProperty = properties.find((item) => item.slug === normalizedSlug || item.id === normalizedSlug);
  if (staticProperty) return staticProperty;

  try {
    const supabase = createClient();
    const data = await fetchPublicListingDetail(supabase, slug, { withContact: true });

    if (!data) return null;
    let videoUrl = data.video_url ?? null;

    if (!videoUrl && data.id) {
      const videoResult = await supabase.from('listings').select('video_url').eq('id', data.id).maybeSingle();
      if (!videoResult.error) {
        videoUrl = videoResult.data?.video_url ?? null;
      }
    }

    return listingRowToProperty({
      ...data,
      video_url: videoUrl,
      owner_id: data.owner_id ?? null,
      area_sqm: data.area_sqm ?? null,
      condo_fee: data.condo_fee ?? null,
      condo_included: data.condo_included ?? false,
      is_pet_friendly: data.is_pet_friendly ?? false,
      is_furnished: data.is_furnished ?? false,
      price_period: data.price_period ?? null,
      featured_starts_at: data.featured_starts_at ?? null,
      featured_expires_at: data.featured_expires_at ?? null,
      created_at: data.created_at ?? null,
      updated_at: data.updated_at ?? null
    } as Parameters<typeof listingRowToProperty>[0]);
  } catch {
    return null;
  }
}

async function getAdvertiserProfile(ownerId?: string) {
  if (!ownerId) return null;

  try {
    const supabase = createClient();
    let { data, error } = await supabase
      .from('profiles')
      .select('public_slug,company_name,full_name,account_type,creci,creci_verified,profile_image_url')
      .eq('id', ownerId)
      .in('account_type', ['corretor', 'imobiliaria'])
      .maybeSingle();

    if (error) {
      const fallback = await supabase
        .from('profiles')
        .select('public_slug,company_name,full_name,account_type,creci,profile_image_url')
        .eq('id', ownerId)
        .in('account_type', ['corretor', 'imobiliaria'])
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, creci_verified: false } : null;
    }

    if (!data?.public_slug) {
      const minimal = await supabase
        .from('profiles')
        .select('public_slug,full_name,account_type,creci,profile_image_url')
        .eq('id', ownerId)
        .in('account_type', ['corretor', 'imobiliaria'])
        .maybeSingle();
      data = minimal.data ? { ...minimal.data, company_name: null, creci_verified: false } : null;
    }

    if (!data?.public_slug) return null;
    return data;
  } catch {
    return null;
  }
}

async function getAdvertiserListings(property: Property): Promise<Property[]> {
  if (!property.ownerId) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('owner_id', property.ownerId)
      .eq('status', 'approved')
      .neq('id', property.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) return [];
    return ((data ?? []) as any[]).map((listing) => listingRowToProperty(listing));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const property = await getProperty(params.slug);

  if (!property) return { title: 'Imóvel não encontrado' };
  const displayTitle = getCleanPropertyTitle(property);

  return {
    title: displayTitle,
    description: property.description,
    alternates: {
      canonical: `${BASE_URL}/imoveis/${property.slug}`
    },
    openGraph: {
      title: `${displayTitle} | Potilar`,
      description: property.description,
      type: 'article',
      url: `${BASE_URL}/imoveis/${property.slug}`,
      images: [
        {
          url: property.images[0],
          alt: displayTitle
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayTitle} | Potilar`,
      description: property.description
    }
  };
}

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await getProperty(params.slug);

  if (!property) return notFound();

  const advertiserListings = await getAdvertiserListings(property);
  const advertiserProfile = await getAdvertiserProfile(property.ownerId);
  const displayTitle = getCleanPropertyTitle(property);
  const similar = advertiserListings.length > 0 ? advertiserListings : properties.filter((item) => item.id !== property.id).slice(0, 3);
  const contactPhone = property.contactPhone || property.contactWhatsapp;
  const whatsappNumber = cleanPhone(property.contactWhatsapp);
  const phoneNumber = cleanPhone(contactPhone);
  const contactName = getPublicFirstName(property.contactName) || 'Anunciante';
  const advertiserDisplayName = advertiserProfile?.company_name || advertiserProfile?.full_name || contactName;
  const advertiserInitials = String(advertiserDisplayName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const hasAdvertiserContact = Boolean(property.contactPhone || property.contactWhatsapp || property.contactEmail);
  const isSuperFeatured = property.isFeatured && property.featuredPlan === 'super_30_days';
  const dateLabel = formatListingDateLabel(property.createdAt, property.updatedAt);
  const detailUrl = `${BASE_URL}/imoveis/${property.slug}`;
  const whatsappHref =
    property.contactWhatsapp && whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá, tenho interesse no anúncio ${getListingCode(property.id)}: ${displayTitle}`)}`
      : `https://wa.me/5521969724141?text=${encodeURIComponent(`Olá, vim pelo site Potilar e tenho interesse no anúncio ${getListingCode(property.id)}: ${displayTitle}`)}`;
  const reportHref = `https://wa.me/5521969724141?text=${encodeURIComponent(`Olá, quero denunciar ou revisar o anúncio ${getListingCode(property.id)}: ${detailUrl}`)}`;
  const locationDetails = [property.neighborhood, property.community].filter(Boolean).join(' · ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: displayTitle,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location,
      addressRegion: 'RN'
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock'
    }
  };

  const specItems = [
    property.bedrooms > 0 && `${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`,
    property.bathrooms > 0 && `${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`,
    property.parking > 0 && `${property.parking} vaga${property.parking > 1 ? 's' : ''}`,
    property.areaSqm && `${property.areaSqm} m2`,
    property.condoFee &&
      `Condomínio ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(property.condoFee)}`,
    property.condoIncluded && 'Condomínio incluso',
    property.isPetFriendly && 'Aceita pet',
    property.isFurnished && 'Mobiliado'
  ].filter(Boolean) as string[];
  const contactCard = (
    <div className="glass-card space-y-4 p-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {hasAdvertiserContact ? 'Contato do anunciante' : 'Contato Potilar'}
        </h3>
        {advertiserProfile?.public_slug && (
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={getPublicProfilePath(advertiserProfile.public_slug)}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-sm font-semibold text-white"
              aria-label={`Ver página de ${advertiserDisplayName}`}
            >
              {advertiserProfile.profile_image_url ? (
                <img
                  src={advertiserProfile.profile_image_url}
                  alt={advertiserDisplayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                advertiserInitials || 'P'
              )}
            </Link>
            <div className="min-w-0 text-sm text-slate-600 dark:text-slate-300">
              <span>Anunciante:</span>{' '}
              <Link
                href={getPublicProfilePath(advertiserProfile.public_slug)}
                className="font-semibold text-ocean-700 underline"
              >
                {advertiserDisplayName}
              </Link>
              {advertiserProfile.creci && advertiserProfile.creci_verified && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ocean-50 px-2.5 py-1 text-[11px] font-semibold text-ocean-700">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  CRECI verificado
                </span>
              )}
            </div>
          </div>
        )}
        {!advertiserProfile?.public_slug && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{contactName}</p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {property.contactWhatsapp && whatsappNumber && (
          <WhatsAppStatLink
            listingId={property.id}
            href={whatsappHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-600/20"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </WhatsAppStatLink>
        )}
        {property.contactPhone && phoneNumber && (
          <a
            href={`tel:+${phoneNumber}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ocean-200 px-4 py-3 text-sm font-semibold text-ocean-700 dark:border-slate-700 dark:text-slate-200"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Telefone
          </a>
        )}
        {property.contactEmail && (
          <a
            href={`mailto:${property.contactEmail}?subject=${encodeURIComponent(`Interesse no anúncio ${property.title}`)}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ocean-200 px-4 py-3 text-sm font-semibold text-ocean-700 dark:border-slate-700 dark:text-slate-200"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email
          </a>
        )}
        {property.ownerId && (
          <ListingMessageButton listingId={property.id} ownerId={property.ownerId} title={displayTitle} />
        )}
        {!hasAdvertiserContact && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp Potilar
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-sand-100 pt-4 text-xs dark:border-slate-800">
        <ShareButtons title={displayTitle} url={detailUrl} compact />
        <a
          href={reportHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-2 text-center font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          Denunciar anúncio
        </a>
        <a
          href="/seguranca"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ocean-200 px-3 py-2 text-center font-semibold text-ocean-700 transition hover:bg-ocean-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Dicas de seguranca
        </a>
      </div>
    </div>
  );

  return (
    <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <ListingViewTracker listingId={property.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-7">
            <PropertyGallery images={property.images} />
        <div className="space-y-3">
          <FavoriteButton propertyId={property.id} title={displayTitle} variant="inline" />
          <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Anuncio revisado pela Potilar
              </span>
              <span className="rounded-full bg-sun-500 px-3 py-1 text-xs font-semibold text-white">
                {property.transaction}
              </span>
              <span className="rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                {property.propertyType}
              </span>
              {property.isFeatured && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${isSuperFeatured ? 'bg-violet-600 shadow-md shadow-violet-500/30' : 'bg-sun-500'}`}>
                  {isSuperFeatured ? 'Super destaque' : 'Destaque'}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-3xl">{displayTitle}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {property.location} - {property.transaction} - {property.propertyType}
            </p>
            {locationDetails && (
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {locationDetails}
              </p>
            )}
            {dateLabel && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {dateLabel}
              </p>
            )}
            {property.addressExtra && (
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Referencia: {property.addressExtra}
              </p>
            )}
            <p className="text-3xl font-semibold text-ocean-700">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
              }).format(property.price)}
              {property.transaction === 'Temporada' && property.pricePeriod ? `/${property.pricePeriod}` : ''}
            </p>
            {specItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        <section className="space-y-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{property.description}</p>
          {property.features.length > 0 && (
            <ul className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              {property.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ocean-500" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Código do anúncio: {getListingCode(property.id)}
          </p>
          <div className="lg:hidden">
            {contactCard}
          </div>
          {property.videoUrl && (
            <a
              href={property.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-ocean-200 bg-ocean-50 px-5 py-3 text-sm font-semibold text-ocean-800 transition hover:border-ocean-400 hover:bg-ocean-100 dark:border-ocean-900 dark:bg-ocean-950/40 dark:text-ocean-100"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              Ver vídeo do imóvel
            </a>
          )}
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <p>
              Evite pagamentos antecipados sem visitar o imóvel e confirmar os dados do anunciante.
              A Potilar revisa anúncios, mas a negociação deve ser feita com cuidado.
            </p>
          </div>
        </section>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Mapa do entorno</h2>
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`}
              className="rounded-full border border-ocean-200 px-4 py-2 text-xs font-semibold text-ocean-700"
            >
              Ver no Street View
            </a>
          </div>
          <PropertyMap items={[property]} height="320px" center={[property.lat, property.lng]} zoom={13} />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            A localização exata deve ser confirmada diretamente com o anunciante antes de visitar ou negociar.
          </p>
        </section>
        {property.tourUrl && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Tour 360</h2>
            <div className="aspect-video w-full overflow-hidden rounded-3xl border border-sand-200 bg-sand-50 dark:border-slate-800 dark:bg-slate-900">
              <iframe
                title="Tour 360 do imóvel"
                src={property.tourUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </section>
        )}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {advertiserListings.length > 0 ? 'Outros anúncios deste anunciante' : 'Imóveis similares'}
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} variant={advertiserListings.length > 0 ? 'compact' : 'grid'} />
            ))}
          </div>
        </section>
          </div>
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            {contactCard}
          </aside>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-sand-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <a
            href={whatsappHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
          {property.contactPhone && phoneNumber && (
            <a
              href={`tel:+${phoneNumber}`}
              className="inline-flex items-center justify-center rounded-2xl border border-ocean-200 px-4 py-3 text-sm font-semibold text-ocean-700"
              aria-label="Ligar para anunciante"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {property.ownerId && (
            <ListingMessageButton listingId={property.id} ownerId={property.ownerId} title={displayTitle} />
          )}
        </div>
      </div>
    </main>
  );
}
