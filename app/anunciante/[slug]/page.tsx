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

const LANGUAGE_CHIPS = [
  { match: /portugu|brazilian|pt[-_]?br|^pt$/i, code: 'br', label: 'Português' },
  { match: /espanh|spanish|^es$/i, code: 'es', label: 'Espanhol' },
  { match: /ingl[eê]s|english|^en$/i, code: 'gb', label: 'Inglês' },
  { match: /italian|^it$/i, code: 'it', label: 'Italiano' },
  { match: /franc[eê]s|french|^fr$/i, code: 'fr', label: 'Francês' },
  { match: /alem[aã]o|german|^de$/i, code: 'de', label: 'Alemão' }
] as const;

function getLanguages(profile: Profile) {
  if ('languages' in profile && Array.isArray(profile.languages) && profile.languages.length > 0) {
    return profile.languages.map((item) => String(item).trim()).filter(Boolean);
  }

  return ['Português'];
}

function getProfileLocation(listings: ProfileListings) {
  const location = listings.find((property) => property.location)?.location?.trim();
  if (!location) return 'Rio Grande do Norte';
  return /,\s*RN$/i.test(location) ? location : `${location.replace(/,\s*Rio Grande do Norte$/i, '')}, RN`;
}

function formatCreciLabel(creci: string) {
  const value = creci.trim();
  return /^creci\b/i.test(value) ? value : `CRECI ${value}`;
}

function toLanguageChip(value: string) {
  const known = LANGUAGE_CHIPS.find((item) => item.match.test(value));
  return known ?? { code: '', label: value };
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
    advertiserCreci: profile.creci?.trim() || undefined,
    advertiserCreciVerified: Boolean(profile.creci && profile.creci_verified),
    advertiserPublicSlug: publicSlug,
    advertiserDisplayName: displayName,
    advertiserImageUrl:
      'profile_image_url' in profile && typeof profile.profile_image_url === 'string'
        ? profile.profile_image_url
        : property.advertiserImageUrl
  }));
  const accountLabel = getAccountTypeLabel(profile.account_type as 'corretor' | 'imobiliaria');
  const professionalBadge =
    profile.account_type === 'imobiliaria' ? 'Imobiliária' : 'Profissional imobiliário';
  const profileBio = profile.bio?.trim();
  const shouldShowBio =
    Boolean(profileBio) && profileBio?.toLowerCase() !== accountLabel.toLowerCase();
  const profileLocation = getProfileLocation(listings);
  const creciLabel = profile.creci?.trim() ? formatCreciLabel(profile.creci) : null;
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
    advertiserCreci: profile.creci?.trim() || property.advertiserCreci,
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

      <section className="mx-auto -mt-16 max-w-7xl px-4 sm:-mt-20 sm:px-6 md:-mt-24 lg:px-8">
        <div className="rounded-[2rem] border border-sand-200 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-sand-100 shadow-sm ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900 sm:h-28 sm:w-28">
                {profileImage ? (
                  <img src={profileImage} alt={`Foto ou logo de ${displayName}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-sm font-semibold text-slate-600">{displayName}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {professionalBadge}
                  </span>
                  {creciLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {creciLabel}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-2 font-sans text-3xl font-extrabold leading-none text-slate-950 dark:text-white sm:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {listings.length} imóvel{listings.length === 1 ? '' : 's'} ativo{listings.length === 1 ? '' : 's'}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {profileLocation}
                </p>
                {shouldShowBio ? (
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">{profileBio}</p>
                ) : null}
              </div>
            </div>

            <aside className="shrink-0 space-y-4 text-center lg:text-right">
              <div>
                <p className="text-sm font-medium text-slate-400">Idiomas de atendimento</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-end">
                  {languages.map((language) => {
                    const chip = toLanguageChip(language);
                    return (
                      <span
                        key={language}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {chip.code ? (
                          <span className="flex h-5 w-5 overflow-hidden rounded-full ring-1 ring-slate-200">
                            <img
                              src={`/flags/${chip.code}.svg`}
                              alt=""
                              width={20}
                              height={20}
                              className="h-full w-full object-cover"
                            />
                          </span>
                        ) : null}
                        {chip.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-nowrap items-center justify-center gap-3 lg:justify-end">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    WhatsApp
                  </a>
                ) : null}
                {phone ? (
                  <RevealPhoneButton
                    phone={phone}
                    className="h-12 justify-center rounded-2xl border border-sand-200 bg-white px-5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                ) : null}
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
