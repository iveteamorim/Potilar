import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, MessageCircle, Search, ShieldCheck } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import AdvertiserMapToggle from '@/components/AdvertiserMapToggle';
import RevealPhoneButton from '@/components/RevealPhoneButton';
import { fetchPublicAdvertiserProfile, type PublicAdvertiserProfileRow } from '@/lib/fetchPublicAdvertiserProfile';
import { getDemoProfessionalListings } from '@/data/demoProfessionalProfiles';
import { createClient } from '@/lib/supabase/server';
import { enrichPublicListings } from '@/lib/advertiserProfiles';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchOwnerPublicListings } from '@/lib/fetchApprovedListings';
import { listingRowToProperty, type ListingRow } from '@/lib/listings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import { getAccountTypeLabel } from '@/lib/publicProfile';

type Props = {
  params: { slug: string };
  searchParams?: {
    q?: string;
    tipo?: string;
    imovel?: string;
    preco_min?: string;
    preco_max?: string;
  };
};

type Profile = PublicAdvertiserProfileRow;
type ProfileListings = Awaited<ReturnType<typeof getProfileListings>>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await fetchPublicAdvertiserProfile(params.slug);
  if (!profile) {
    return { title: 'Anunciante não encontrado | Potilar' };
  }

  const displayName = profile.company_name || profile.full_name || 'Anunciante';
  return {
    title: `${displayName} | Potilar`,
    description: profile.bio || `Imóveis publicados por ${displayName} no Rio Grande do Norte.`
  };
}

async function getProfileListings(ownerId: string) {
  const demoListings = getDemoProfessionalListings(ownerId);
  if (demoListings.length > 0) {
    return orderListingsForDisplay(demoListings);
  }

  const supabase = createClient();
  let rows = await fetchOwnerPublicListings(supabase, ownerId);

  if (rows.length === 0) {
    try {
      const admin = createAdminClient();
      rows = await fetchOwnerPublicListings(admin, ownerId);
    } catch {
      // Service role not configured in this environment.
    }
  }

  const properties = orderListingsForDisplay(
    (rows as unknown as ListingRow[]).map((row) => listingRowToProperty({ ...row, owner_id: ownerId }))
  );

  try {
    return await enrichPublicListings(supabase, properties);
  } catch {
    return properties;
  }
}

function normalizeSearchValue(value?: string) {
  return decodeURIComponent(value ?? '').trim().toLowerCase();
}

function filterListings(listings: ProfileListings, searchParams?: Props['searchParams']) {
  const query = normalizeSearchValue(searchParams?.q);
  const tipo = normalizeSearchValue(searchParams?.tipo);
  const imovel = normalizeSearchValue(searchParams?.imovel);
  const minPrice = Number(searchParams?.preco_min || 0);
  const maxPrice = Number(searchParams?.preco_max || 0);

  return listings.filter((property) => {
    const matchesQuery =
      !query ||
      [
        property.title,
        property.location,
        property.neighborhood,
        property.community,
        property.propertyType,
        property.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);

    const matchesType = !tipo || tipo === 'todos' || property.transaction.toLowerCase() === tipo;
    const matchesProperty = !imovel || imovel === 'todos' || property.propertyType.toLowerCase() === imovel;
    const matchesMinPrice = !Number.isFinite(minPrice) || minPrice <= 0 || property.price >= minPrice;
    const matchesMaxPrice = !Number.isFinite(maxPrice) || maxPrice <= 0 || property.price <= maxPrice;
    return matchesQuery && matchesType && matchesProperty && matchesMinPrice && matchesMaxPrice;
  });
}

function getProfileDisplayName(profile: Profile) {
  return profile.company_name || profile.full_name || 'Anunciante';
}

function countByTransaction(listings: ProfileListings, transaction: string) {
  return listings.filter((property) => property.transaction.toLowerCase() === transaction).length;
}

function getHeroImage(listings: ProfileListings) {
  return listings.find((property) => property.images[0])?.images[0] ?? '/og-home.svg';
}

function getProfileImage(profile: Profile) {
  if ('profile_image_url' in profile && typeof profile.profile_image_url === 'string' && profile.profile_image_url) {
    return profile.profile_image_url;
  }

  return null;
}

function getBannerImage(profile: Profile, listings: ProfileListings) {
  if ('banner_image_url' in profile && typeof profile.banner_image_url === 'string' && profile.banner_image_url) {
    return profile.banner_image_url;
  }

  return getHeroImage(listings);
}

function getLanguages(profile: Profile) {
  if ('languages' in profile && Array.isArray(profile.languages) && profile.languages.length > 0) {
    return profile.languages;
  }

  return ['Português'];
}

function buildTabHref(slug: string, tipo: string) {
  return `/anunciante/${slug}?tipo=${tipo}#imoveis`;
}

export default async function AnunciantePage({ params, searchParams }: Props) {
  const profile = await fetchPublicAdvertiserProfile(params.slug);
  if (!profile?.public_slug) notFound();
  const publicSlug = profile.public_slug;

  const listings = await getProfileListings(profile.id);
  const visibleListings = filterListings(listings, searchParams);
  const mapListings = visibleListings.length > 0 ? visibleListings : listings;
  const displayName = getProfileDisplayName(profile);
  const verifiedListings = visibleListings.map((property) => ({
    ...property,
    advertiserAccountType: profile.account_type ?? undefined,
    advertiserCreciVerified: Boolean(profile.creci && profile.creci_verified),
    advertiserPublicSlug: publicSlug,
    advertiserDisplayName: displayName,
    advertiserImageUrl:
      'profile_image_url' in profile && typeof profile.profile_image_url === 'string'
        ? profile.profile_image_url
        : property.advertiserImageUrl
  }));
  const accountLabel = getAccountTypeLabel(profile.account_type as 'corretor' | 'imobiliaria');
  const profileBio = profile.bio?.trim();
  const shouldShowBio =
    Boolean(profileBio) && profileBio?.toLowerCase() !== accountLabel.toLowerCase();
  const phone = profile.phone?.replace(/\D/g, '');
  const whatsappHref = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(`Ola, vi seu perfil na Potilar e quero falar sobre imoveis.`)}`
    : null;
  const heroImage = getBannerImage(profile, listings);
  const profileImage = getProfileImage(profile);
  const selectedType = normalizeSearchValue(searchParams?.tipo) || 'todos';
  const languages = getLanguages(profile);

  const mapListingsWithBrand = mapListings.map((property) => ({
    ...property,
    advertiserAccountType: profile.account_type ?? property.advertiserAccountType,
    advertiserCreciVerified: Boolean(profile.creci && profile.creci_verified),
    advertiserPublicSlug: publicSlug,
    advertiserDisplayName: displayName,
    advertiserImageUrl:
      typeof profile.profile_image_url === 'string' && profile.profile_image_url
        ? profile.profile_image_url
        : property.advertiserImageUrl
  }));

  const tabs = [
    ['todos', `Todos (${listings.length})`],
    ['compra', `Compra (${countByTransaction(listings, 'compra')})`],
    ['aluguel', `Aluguel (${countByTransaction(listings, 'aluguel')})`],
    ['temporada', `Temporada (${countByTransaction(listings, 'temporada')})`]
  ] as const;

  return (
    <main className="bg-sand-50 pb-14 dark:bg-slate-950">
      <section
        className="h-[170px] bg-cover bg-center sm:h-[220px] md:h-[300px]"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.18), rgba(15,23,42,0.02)), url(${heroImage})` }}
        aria-label={`Imagem de capa de ${displayName}`}
      />

      <section className="mx-auto -mt-20 max-w-7xl px-4 sm:-mt-20 sm:px-6 md:-mt-16 lg:px-8">
        <div className="overflow-hidden rounded-[1.5rem] border border-sand-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[118px_1fr_280px] md:gap-7 md:p-7">
            <div className="flex items-start justify-center md:justify-start">
              <div className="grid h-36 w-36 place-items-center overflow-hidden rounded-xl bg-sand-100 text-center text-lg font-semibold leading-tight text-slate-950 shadow-sm dark:bg-slate-800">
                {profileImage ? (
                  <img src={profileImage} alt={`Foto ou logo de ${displayName}`} className="h-full w-full object-cover" />
                ) : (
                  displayName
                )}
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full bg-ocean-50 px-3 py-1 text-xs font-bold text-ocean-800 ring-1 ring-ocean-100">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {accountLabel} verificado
                </span>
                {profile.creci && profile.creci_verified && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    CRECI verificado
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-sans text-3xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-4xl md:text-5xl">
                {displayName}
              </h1>
              <p className="mt-2 text-base font-semibold text-slate-600 dark:text-slate-300">
                {listings.length} imovel{listings.length === 1 ? '' : 's'} ativo{listings.length === 1 ? '' : 's'}
              </p>
              <p className="sr-only">
                {listings.length} imóvel{listings.length === 1 ? '' : 's'} publicado{listings.length === 1 ? '' : 's'}
              </p>
              <div className="sr-only">
                <span>{listings.length} imoveis</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" aria-hidden="true" />
                <span>Membro PotiLar</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" aria-hidden="true" />
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-ocean-700" aria-hidden="true" />
                  RN
                </span>
              </div>
              {shouldShowBio && (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{profileBio}</p>
              )}
              <div className="mt-4 grid max-w-[180px] grid-cols-1 gap-2">
                <div className="hidden rounded-2xl bg-sand-50 px-3 py-2 text-center ring-1 ring-sand-100 dark:bg-slate-950">
                  <strong className="block text-lg font-extrabold text-ocean-800 dark:text-ocean-200">{listings.length}</strong>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">imoveis ativos</span>
                </div>
                <div className="hidden rounded-2xl bg-sand-50 px-3 py-2 text-center ring-1 ring-sand-100 dark:bg-slate-950">
                  <strong className="block text-lg font-extrabold text-green-700">{profile.creci && profile.creci_verified ? 'OK' : 'PotiLar'}</strong>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">perfil verificado</span>
                </div>
                <div className="hidden rounded-2xl bg-sand-50 px-3 py-2 text-center ring-1 ring-sand-100 dark:bg-slate-950">
                  <strong className="block text-lg font-extrabold text-ocean-800 dark:text-ocean-200">RN</strong>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">atuação local</span>
                </div>
                <div className="hidden rounded-2xl bg-sand-50 px-3 py-2 text-center ring-1 ring-sand-100 dark:bg-slate-950">
                  <strong className="block text-lg font-extrabold text-ocean-800 dark:text-ocean-200">{profile.creci && profile.creci_verified ? 'OK' : 'PotiLar'}</strong>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">perfil profissional</span>
                </div>
              </div>
              <div className="sr-only">
                {profile.creci && <p>{profile.creci}</p>}
                <p className="inline-flex items-center gap-2 text-ocean-700">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Rio Grande do Norte
                </p>
              </div>
            </div>

            <aside className="space-y-4 md:border-l md:border-sand-200 md:pl-8 dark:md:border-slate-800">
              <a href={`/anunciante/${publicSlug}`} className="hidden">
                Página Potilar
              </a>
              <div className="text-base font-semibold leading-7 text-slate-800 dark:text-slate-100">
                Fala {languages.join(', ')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-green-700 sm:text-base"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
                {phone && (
                  <RevealPhoneButton
                    phone={phone}
                    className="min-h-14 justify-center rounded-2xl border border-ocean-200 bg-white px-4 py-3 text-center text-sm shadow-sm sm:text-base"
                  />
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="imoveis" className="mx-auto mt-10 max-w-7xl scroll-mt-28 px-4 sm:px-6 lg:px-8">
        <div className="mb-5 text-sm font-semibold text-ocean-700">
          <Link href="/imoveis">Imóveis</Link>
          <span className="mx-2 text-slate-400">›</span>
          <span className="text-slate-600 dark:text-slate-300">{displayName}</span>
        </div>

        <h2 className="sr-only">
          {displayName}: {visibleListings.length} imóvel{visibleListings.length === 1 ? '' : 's'} encontrado
          {visibleListings.length === 1 ? '' : 's'}
        </h2>

        <div className="border-b border-sand-200 dark:border-slate-800">
          <nav className="flex flex-wrap gap-6">
            {tabs.map(([value, label]) => {
              const active = selectedType === value || (!selectedType && value === 'todos');
              return (
                <Link
                  key={value}
                  href={buildTabHref(publicSlug, value)}
                  className={`border-b-3 px-1 pb-3 text-base font-semibold transition ${
                    active ? 'border-ocean-700 text-ocean-800' : 'border-transparent text-slate-500 hover:text-ocean-700'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {mapListingsWithBrand.length > 0 ? (
              <AdvertiserMapToggle items={mapListingsWithBrand} />
            ) : (
              <div className="inline-flex h-14 w-full cursor-not-allowed items-center justify-center gap-2 border border-sand-200 bg-sand-50 px-4 text-sm font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Ver no mapa
              </div>
            )}

            <form action={`/anunciante/${publicSlug}`} className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-950 dark:text-white">Buscar</span>
                <span className="relative mt-2 block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={searchParams?.q ?? ''}
                    placeholder="Cidade, bairro ou palavra-chave"
                    className="h-12 w-full border border-sand-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-ocean-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950 dark:text-white">Finalidade</span>
                <select
                  name="tipo"
                  defaultValue={searchParams?.tipo ?? 'todos'}
                  className="mt-2 h-12 w-full border border-sand-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-ocean-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="todos">Todos</option>
                  <option value="compra">Compra</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="temporada">Temporada</option>
                </select>
              </label>

              <div>
                <span className="text-sm font-semibold text-slate-950 dark:text-white">Preço</span>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    name="preco_min"
                    min="0"
                    inputMode="numeric"
                    defaultValue={searchParams?.preco_min ?? ''}
                    placeholder="Mín"
                    className="h-12 w-full border border-sand-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-ocean-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    name="preco_max"
                    min="0"
                    inputMode="numeric"
                    defaultValue={searchParams?.preco_max ?? ''}
                    placeholder="Máx"
                    className="h-12 w-full border border-sand-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-ocean-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950 dark:text-white">Tipo de imóvel</span>
                <select
                  name="imovel"
                  defaultValue={searchParams?.imovel ?? 'todos'}
                  className="mt-2 h-12 w-full border border-sand-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-ocean-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="todos">Todos</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="kitnet/conjugado">Kitnet/Conjugado</option>
                  <option value="ponto comercial">Ponto comercial</option>
                </select>
              </label>

              <button type="submit" className="h-12 w-full bg-ocean-700 px-5 text-sm font-semibold text-white transition hover:bg-ocean-800">
                Aplicar filtros
              </button>
            </form>
          </aside>

          <div>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Ordenar: <span className="text-ocean-800">Relevância</span>
              </p>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Contato direto
              </span>
            </div>

            {listings.length === 0 ? (
              <div className="border border-sand-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Nenhum imóvel ativo no momento.
              </div>
            ) : visibleListings.length === 0 ? (
              <div className="border border-sand-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Nenhum imóvel encontrado com esses filtros.
              </div>
            ) : (
              <div className="grid gap-5">
                {verifiedListings.map((property) => (
                  <PropertyCard key={property.id} property={property} variant="horizontal" />
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Você é corretor ou imobiliária?{' '}
          <Link href="/mi-cuenta/perfil" className="font-semibold text-ocean-700">
            Configure seu perfil público
          </Link>
        </p>
      </section>
    </main>
  );
}
