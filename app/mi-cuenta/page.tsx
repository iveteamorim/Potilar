import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, BadgeCheck, BarChart3, Eye, Globe2, Home, Languages, MessageCircle, Pencil, Plus, Search, Settings, ShieldCheck, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SUPABASE_URL } from '@/lib/supabase/config';
import AccountNotice from '@/components/AccountNotice';
import DemoProfileImageManager from '@/components/DemoProfileImageManager';
import ListingMercadoPagoButton from '@/components/ListingMercadoPagoButton';
import LogoutButton from '@/components/LogoutButton';
import PropertyCard from '@/components/PropertyCard';
import type { Property } from '@/data/properties';
import { PLANS, formatPlanPrice, getFreeListingLimit, getHighlightLabel, getHighlightPrice, getLaunchPromoDeadlineLabel, isLaunchPromoActive } from '@/lib/plans';
import { SEARCH_ALERTS_ENABLED } from '@/lib/config';
import { getListingHref } from '@/lib/listingUrls';
import { getPaymentCode } from '@/lib/pix';
import { buildProfessionalProfileSlug, getAccountTypeLabel, getPublicProfilePath, isProfessionalAccountType } from '@/lib/publicProfile';
import { slugify } from '@/lib/slugify';
import {
  cancelListingHighlight,
  cancelProfessionalSubscription,
  deleteOwnListing,
  requestAccountDeletion,
  requestListingHighlight,
  setMainImage,
  updateProfessionalProfile,
  updateListingContact,
  updateOwnListingStatus
} from './actions';

export const metadata: Metadata = {
  title: 'Minha conta | Potilar'
};

const SEASONAL_DURATION_DAYS = PLANS.listing.seasonalDurationDays;
const SEASONAL_RENEWAL_NOTICE_DAYS = PLANS.listing.seasonalRenewalNoticeDays;
const SEASONAL_RENEWAL_OPTIONS = [
  {
    days: PLANS.listing.seasonalRenewal30DurationDays,
    amount: PLANS.listing.seasonalRenewal30Price,
    headline: `Renovacao de temporada - ${PLANS.listing.seasonalRenewal30DurationDays} dias`
  },
  {
    days: PLANS.listing.seasonalRenewal60DurationDays,
    amount: PLANS.listing.seasonalRenewal60Price,
    headline: `Renovacao de temporada - ${PLANS.listing.seasonalRenewal60DurationDays} dias`
  }
];
const DEFAULT_PROFESSIONAL_BANNER =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80';
const DEFAULT_PROFESSIONAL_PHOTO =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=320&h=320&q=85';

function getSeasonalRenewalInfo(createdAt: string, now = new Date()) {
  const created = new Date(createdAt);
  const expiresAt = new Date(created);
  expiresAt.setDate(expiresAt.getDate() + SEASONAL_DURATION_DAYS);

  const noticeAt = new Date(expiresAt);
  noticeAt.setDate(noticeAt.getDate() - SEASONAL_RENEWAL_NOTICE_DAYS);

  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    expiresAt,
    daysLeft,
    shouldShowNotice: now >= noticeAt
  };
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Em revisao',
    approved: 'Publicado',
    paused: 'Pausado',
    rejected: 'Rejeitado'
  };

  return labels[status] ?? status;
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function normalizeForSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getPlanLabel(plan?: string | null, accountType?: string | null) {
  if (plan === 'plus') return 'Imobiliaria Plus';
  if (plan === 'imobiliaria' || accountType === 'imobiliaria') return 'Imobiliaria';
  return 'Corretor';
}

function toPropertyCardListing(listing: any, profile: any): Property {
  const propertyType = ['Casa', 'Terreno', 'Apartamento', 'Kitnet/Conjugado'].includes(listing.property_type)
    ? listing.property_type
    : 'Casa';
  const transaction = ['Aluguel', 'Compra', 'Temporada'].includes(listing.transaction) ? listing.transaction : 'Compra';
  const contactMethods =
    Array.isArray(listing.contact_methods) && listing.contact_methods.length > 0
      ? listing.contact_methods
      : [
          listing.contact_whatsapp ? 'whatsapp' : '',
          listing.contact_phone ? 'phone' : '',
          listing.contact_email ? 'email' : ''
        ].filter(Boolean);

  return {
    id: `user-${listing.id}`,
    ownerId: profile?.id,
    slug: slugify(`${listing.title}-${listing.location}-${listing.id}`),
    title: listing.title,
    propertyType,
    transaction,
    price: Number(listing.price ?? 0),
    pricePeriod: listing.price_period ?? (transaction === 'Temporada' ? 'dia' : undefined),
    bedrooms: Number(listing.bedrooms ?? 0),
    bathrooms: Number(listing.bathrooms ?? 0),
    parking: Number(listing.parking ?? 0),
    areaSqm: listing.area_sqm ?? undefined,
    location: listing.location,
    neighborhood: listing.neighborhood ?? undefined,
    lat: Number(listing.lat ?? -5.7945),
    lng: Number(listing.lng ?? -35.211),
    isPetFriendly: Boolean(listing.is_pet_friendly),
    isFurnished: Boolean(listing.is_furnished),
    condoFee: listing.condo_fee ?? undefined,
    images: Array.isArray(listing.images) ? listing.images : [],
    videoUrl: listing.video_url ?? undefined,
    isFeatured: Boolean(listing.featured_plan && listing.featured_payment_status === 'confirmed'),
    featuredPlan: listing.featured_plan ?? undefined,
    contactName: listing.contact_name ?? profile?.company_name ?? profile?.full_name ?? undefined,
    contactPhone: listing.contact_phone ?? undefined,
    contactWhatsapp: listing.contact_whatsapp ?? listing.contact_phone ?? undefined,
    contactEmail: listing.contact_email ?? undefined,
    contactMethods,
    advertiserAccountType: profile?.account_type ?? undefined,
    advertiserCreciVerified: Boolean(profile?.creci && profile?.creci_verified),
    advertiserPublicSlug: profile?.public_slug ?? undefined,
    advertiserDisplayName: profile?.company_name ?? profile?.full_name ?? undefined,
    advertiserImageUrl: profile?.profile_image_url ?? undefined,
    description: listing.description ?? '',
    features: Array.isArray(listing.features) ? listing.features : [],
    createdAt: listing.created_at ?? undefined,
    updatedAt: listing.updated_at ?? listing.created_at ?? undefined
  };
}

function getSupabaseProjectRef() {
  try {
    return new URL(SUPABASE_URL).hostname.replace('.supabase.co', '');
  } catch {
    return 'unknown';
  }
}

export default async function MinhaContaPage({
  searchParams
}: {
  searchParams?: {
    contact_error?: string;
    contact_success?: string;
    image_error?: string;
    image_success?: string;
    highlight_error?: string;
    highlight_success?: string;
    highlight_cancelled?: string;
    listing_deleted?: string;
    listing_error?: string;
    listing_paused?: string;
    listing_reactivated?: string;
    profile_error?: string;
    profile_success?: string;
    subscription_cancelled?: string;
    subscription_error?: string;
    account_delete_error?: string;
    account_delete_requested?: string;
    anuncio_q?: string;
    debug?: string;
  };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta');

  let profileDebug = 'not_started';
  const profileResult = await supabase
    .from('profiles')
    .select('id,email,role,account_type,professional_plan,public_slug,full_name,company_name,bio,phone,creci,creci_verified,profile_image_url,banner_image_url,languages')
    .eq('id', user.id)
    .single();
  let profile = profileResult.data;
  profileDebug = profileResult.error ? `primary_error:${profileResult.error.message}` : 'primary_ok';

  if (!profile) {
    const fallbackProfile = await supabase.from('profiles').select('id,email,role,account_type,public_slug,full_name,company_name,bio,phone,creci,profile_image_url,banner_image_url').eq('id', user.id).single();
    if (fallbackProfile.error) profileDebug = `${profileDebug}|fallback_error:${fallbackProfile.error.message}`;
    if (fallbackProfile.data) profileDebug = `${profileDebug}|fallback_ok`;
    profile = fallbackProfile.data ? { ...fallbackProfile.data, professional_plan: null, creci_verified: false, languages: ['Português'] } : null;
  }

  if (!profile) {
    const minimalProfile = await supabase.from('profiles').select('id,email,role,account_type,public_slug,full_name,creci').eq('id', user.id).single();
    if (minimalProfile.error) profileDebug = `${profileDebug}|minimal_error:${minimalProfile.error.message}`;
    if (minimalProfile.data) profileDebug = `${profileDebug}|minimal_ok`;
    profile = minimalProfile.data
      ? {
          ...minimalProfile.data,
          professional_plan: null,
          company_name: null,
          bio: null,
          phone: null,
          creci_verified: false,
          profile_image_url: null,
          banner_image_url: null,
          languages: ['Português']
        }
      : null;
  }

  if (user.email && (!profile || !isProfessionalAccountType(profile.account_type))) {
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('id,email,role,account_type,professional_plan,public_slug,full_name,company_name,bio,phone,creci,creci_verified,profile_image_url,banner_image_url,languages')
      .ilike('email', user.email)
      .maybeSingle();

    if (profileByEmail && isProfessionalAccountType(profileByEmail.account_type)) {
      profile = profileByEmail;
    }
  }

  let adminProfileDebug = 'not_checked';

  if (user.email && (!profile || !isProfessionalAccountType(profile.account_type))) {
    try {
      const adminSupabase = createAdminClient();
      const { data: adminProfiles } = await adminSupabase
        .from('profiles')
        .select('id,email,role,account_type,professional_plan,public_slug,full_name,company_name,bio,phone,creci,creci_verified,profile_image_url,banner_image_url,languages')
        .ilike('email', user.email)
        .in('account_type', ['corretor', 'imobiliaria'])
        .limit(1);
      const adminProfile = adminProfiles?.[0] ?? null;
      adminProfileDebug = adminProfile ? `${adminProfile.email}:${adminProfile.account_type}` : 'not_found';

      if (adminProfile) {
        const syncedProfile = {
          account_type: adminProfile.account_type,
          professional_plan: adminProfile.professional_plan,
          public_slug: adminProfile.public_slug,
          company_name: adminProfile.company_name,
          bio: adminProfile.bio,
          creci: adminProfile.creci,
          creci_verified: adminProfile.creci_verified,
          profile_image_url: adminProfile.profile_image_url,
          banner_image_url: adminProfile.banner_image_url,
          languages: adminProfile.languages
        };

        await adminSupabase.from('profiles').update(syncedProfile).eq('id', user.id);
        profile = { ...adminProfile, id: user.id };
      }
    } catch {
      adminProfileDebug = 'admin_unavailable';
      // Keep the normal account view if the admin client is not configured.
    }
  }

  if (profile && isProfessionalAccountType(profile.account_type) && !profile.public_slug) {
    const publicSlug = buildProfessionalProfileSlug(profile, user.id);
    const { error: profileSlugError } = await supabase
      .from('profiles')
      .update({
        public_slug: publicSlug,
        company_name: profile.account_type === 'imobiliaria' ? profile.company_name || profile.full_name || null : profile.company_name || null
      })
      .eq('id', user.id);

    if (!profileSlugError) {
      profile = { ...profile, public_slug: publicSlug };
    }
  }

  const listingsResult = await supabase
    .from('listings')
    .select('id,title,property_type,location,neighborhood,transaction,price,price_period,bedrooms,bathrooms,parking,area_sqm,lat,lng,is_pet_friendly,is_furnished,condo_fee,description,features,video_url,status,images,is_paid,payment_status,payment_amount,payment_confirmed_at,payment_proof_sent_at,listing_expires_at,featured_plan,featured_payment_status,featured_payment_amount,featured_payment_proof_sent_at,featured_starts_at,featured_expires_at,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods,created_at,updated_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });
  let listings: any[] | null = listingsResult.data;
  const listingsError = listingsResult.error;

  if (listingsError) {
    const fallback = await supabase
      .from('listings')
      .select('id,title,location,transaction,price,status,images,is_paid,payment_status,payment_amount,featured_plan,featured_payment_status,featured_payment_amount,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods,created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    listings = (fallback.data ?? []).map((listing) => ({
      ...listing,
      payment_confirmed_at: null,
      payment_proof_sent_at: null,
      listing_expires_at: null,
      featured_payment_proof_sent_at: null,
      featured_starts_at: null,
      featured_expires_at: null
    }));
  }

  if (listingsError && (!listings || listings.length === 0)) {
    const minimalFallback = await supabase
      .from('listings')
      .select('id,title,location,transaction,price,status,images,created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    listings = (minimalFallback.data ?? []).map((listing) => ({
      ...listing,
      is_paid: false,
      payment_status: 'not_required',
      payment_amount: null,
      payment_confirmed_at: null,
      payment_proof_sent_at: null,
      listing_expires_at: null,
      featured_plan: null,
      featured_payment_status: 'not_requested',
      featured_payment_amount: null,
      featured_payment_proof_sent_at: null,
      featured_starts_at: null,
      featured_expires_at: null,
      contact_name: null,
      contact_phone: null,
      contact_whatsapp: null,
      contact_email: null,
      contact_methods: []
    }));
  }
  const listingCount = listings?.length ?? 0;
  const listingIds = (listings ?? []).map((listing) => listing.id);
  const { data: listingStats } =
    listingIds.length > 0
      ? await supabase.from('listing_stats').select('listing_id,view_count,whatsapp_click_count').in('listing_id', listingIds)
      : { data: [] };
  const statsByListingId = new Map((listingStats ?? []).map((row) => [row.listing_id, row]));
  const isProfessional = profile?.account_type === 'corretor' || profile?.account_type === 'imobiliaria';
  const professionalLabel = profile?.account_type === 'corretor' ? 'Corretor' : 'Imobiliaria';
  const professionalPlanLabel =
    profile?.account_type === 'corretor'
      ? 'Plano Corretor'
      : profile?.account_type === 'imobiliaria'
        ? 'Plano Imobiliaria'
        : null;
  const aiBalanceResult = await supabase.rpc('get_ai_credit_balance');
  const aiCreditBalance = Number(aiBalanceResult.data ?? 0);

  if (isProfessional && profile) {
    const displayName = profile?.company_name || profile?.full_name || user.email || 'Anunciante';
    const accountLabel = getAccountTypeLabel(profile.account_type as 'corretor' | 'imobiliaria');
    const publicPath = profile.public_slug ? getPublicProfilePath(profile.public_slug) : '/mi-cuenta/perfil';
    const profileImageUrl = profile.profile_image_url || DEFAULT_PROFESSIONAL_PHOTO;
    const bannerImageUrl = profile.banner_image_url || DEFAULT_PROFESSIONAL_BANNER;
    const professionalListings = (listings ?? []).map((listing) => toPropertyCardListing(listing, profile));
    const listingSearch = (searchParams?.anuncio_q ?? '').trim();
    const normalizedListingSearch = normalizeForSearch(listingSearch);
    const filteredProfessionalListings = normalizedListingSearch
      ? professionalListings.filter((property) => {
          const listingId = property.id.replace(/^user-/, '');
          const searchText = normalizeForSearch(
            [
              property.title,
              property.location,
              property.neighborhood ?? '',
              property.transaction,
              property.propertyType,
              property.price ? String(property.price) : '',
              listingId,
              getPaymentCode(listingId)
            ].join(' ')
          );
          return searchText.includes(normalizedListingSearch);
        })
      : professionalListings;
    const totalPortfolio = professionalListings.reduce((sum, listing) => sum + listing.price, 0);
    const languages = Array.isArray((profile as any).languages) && (profile as any).languages.length > 0 ? (profile as any).languages : ['Português'];

    return (
      <main className="bg-sand-50 py-8 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          <aside className="h-fit border border-sand-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-sand-200 pb-4 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-600">Conta profissional</p>
              <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{displayName}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{getPlanLabel(profile.professional_plan, profile.account_type)}</p>
            </div>
            <nav className="mt-4 grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {([
                ['Visão geral', BarChart3, '/mi-cuenta', 'default'],
                ['Minha página pública', Globe2, publicPath, 'default'],
                ['Meus anúncios', Home, '#anuncios', 'default'],
                ['Editar perfil', Pencil, '/mi-cuenta/perfil', 'default'],
                ['Mensagens', MessageCircle, '/mi-cuenta/mensagens', 'default'],
                ['IA e créditos', Sparkles, '/mi-cuenta/creditos', 'ai'],
                ['Configurações', Settings, '/mi-cuenta/perfil', 'default'],
                ['Zona de risco', AlertTriangle, '#zona-risco', 'danger']
              ] as const).map(([label, Icon, href, kind], index) => (
                <Link
                  key={String(label)}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-sand-50 dark:hover:bg-slate-800 ${
                    kind === 'ai'
                      ? 'border border-ocean-100 bg-ocean-50 text-ocean-800 shadow-sm dark:border-ocean-900 dark:bg-ocean-950/40'
                      : kind === 'danger'
                        ? 'mt-2 border border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
                      : index === 0
                        ? 'bg-ocean-50 text-ocean-800 dark:bg-ocean-950/40'
                        : ''
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="min-w-0 flex-1">{label}</span>
                  {kind === 'ai' && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ocean-800 shadow-sm dark:bg-slate-900">
                      {aiCreditBalance}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="mt-5">
              <LogoutButton />
            </div>
          </aside>

          <section className="space-y-6">
            <div className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Painel {accountLabel}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Página profissional de {displayName}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Área interna para editar sua vitrine pública, acompanhar anúncios e revisar contatos recebidos.
                  </p>
                </div>
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end lg:justify-self-end">
                  <Link href={publicPath} className="inline-flex items-center gap-2 rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Ver página pública
                  </Link>
                  <Link href="/anunciar" className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Novo anúncio
                  </Link>
                </div>
              </div>
            </div>

            {searchParams?.profile_success && (
              <AccountNotice>
                Perfil público atualizado com sucesso.
              </AccountNotice>
            )}

            {searchParams?.profile_error && (
              <AccountNotice tone="error">
                Não foi possível salvar o perfil público: {searchParams.profile_error}
              </AccountNotice>
            )}

            {searchParams?.subscription_cancelled && (
              <AccountNotice>
                Assinatura cancelada. A conta voltou para particular e a página profissional saiu do plano ativo.
              </AccountNotice>
            )}

            {searchParams?.subscription_error && (
              <AccountNotice tone="error">
                Não foi possível cancelar a assinatura: {searchParams.subscription_error}
              </AccountNotice>
            )}

            {searchParams?.account_delete_requested && (
              <AccountNotice>
                Conta retirada da área pública. Os anúncios foram pausados e o perfil profissional foi removido.
              </AccountNotice>
            )}

            {searchParams?.account_delete_error && (
              <AccountNotice tone="error">
                Não foi possível retirar a conta: {searchParams.account_delete_error}
              </AccountNotice>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Imóveis ativos', String(professionalListings.length)],
                ['Valor da carteira', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalPortfolio)],
                ['Créditos de IA', String(aiCreditBalance)]
              ].map(([label, value]) => (
                <div key={label} className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-ocean-800">{value}</p>
                </div>
              ))}
            </div>

            <section className="border border-sand-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
                <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Prévia da página pública</h3>
                    <p className="mt-1 text-sm text-slate-500">Esses dados aparecem para visitantes.</p>
                  </div>
                  <BadgeCheck className="h-6 w-6 text-ocean-700" aria-hidden="true" />
                </div>

                <div className="mt-4 border border-sand-200 p-4 dark:border-slate-800">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-24 w-24 shrink-0 overflow-hidden border border-sand-200 bg-white shadow-sm dark:border-slate-700 dark:bg-white">
                      <img src={profileImageUrl} alt={`Foto de ${displayName}`} className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-800">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {accountLabel} Potilar
                        </span>
                        {profile.creci && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            {profile.creci_verified ? 'CRECI verificado' : 'CRECI pendente'}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">{displayName}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {profile.bio || 'Adicione uma apresentação profissional para sua página pública.'}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Languages className="h-4 w-4" aria-hidden="true" />
                        Fala {languages.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
                </div>

                <form action={updateProfessionalProfile} className="border-t border-sand-200 pt-4 dark:border-slate-800 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Editar perfil público</h3>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nome público</span>
                    <input name="company_name" defaultValue={displayName} className="mt-2 h-11 w-full border border-sand-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">CRECI</span>
                    <input name="creci" defaultValue={profile.creci || ''} className="mt-2 h-11 w-full border border-sand-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Idiomas</span>
                    <input name="languages" defaultValue={languages.join(', ')} className="mt-2 h-11 w-full border border-sand-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sobre</span>
                    <textarea name="bio" defaultValue={profile.bio || ''} rows={2} className="mt-2 w-full border border-sand-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-ocean-700 px-4 text-sm font-semibold text-white">
                    Salvar alterações
                  </button>
                </div>
                </form>
              </div>
            </section>

            <DemoProfileImageManager
              displayName={displayName}
              profileImageUrl={profileImageUrl}
              bannerImageUrl={bannerImageUrl}
              publicSlug={profile.public_slug ?? undefined}
            />

            <section id="anuncios" className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Anúncios da conta</h3>
                  <p className="mt-1 text-sm text-slate-500">Prévia interna da carteira publicada.</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {listingSearch
                      ? `${filteredProfessionalListings.length} de ${professionalListings.length} anúncios encontrados.`
                      : `${professionalListings.length} anúncios na carteira.`}
                  </p>
                </div>
                <form action="/mi-cuenta" className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      name="anuncio_q"
                      defaultValue={listingSearch}
                      placeholder="Buscar por titulo, cidade, preco ou codigo"
                      className="h-11 w-full border border-sand-200 bg-sand-50 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-ocean-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                  <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-ocean-700 px-4 text-sm font-semibold text-white transition hover:bg-ocean-800">
                    Buscar
                  </button>
                  {listingSearch && (
                    <Link
                      href="/mi-cuenta#anuncios"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-sand-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-ocean-300 hover:text-ocean-700 dark:border-slate-700 dark:text-slate-200"
                    >
                      Limpar
                    </Link>
                  )}
                </form>
              </div>
              <div className="mt-5 grid gap-5">
                {filteredProfessionalListings.map((property) => (
                  <div key={property.id} className="relative">
                    <PropertyCard property={property} variant="horizontal" />
                    <div className="absolute bottom-4 right-5 z-30 flex items-center gap-3 text-xs font-semibold">
                      <Link href={getListingHref(property)} className="text-slate-950 underline-offset-4 hover:underline dark:text-white">
                        Ver anúncio
                      </Link>
                      <Link href={`/mi-cuenta/editar/${property.id.replace(/^user-/, '')}`} className="text-slate-950 underline-offset-4 hover:underline dark:text-white">
                        Editar
                      </Link>
                      <form action={requestListingHighlight} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={property.id.replace(/^user-/, '')} />
                        {(['7_days', '15_days', '30_days'] as const).map((planId) => (
                          <button
                            key={planId}
                            type="submit"
                            name="featured_plan"
                            value={planId}
                            title={`${getHighlightLabel(planId)} - ${formatPlanPrice(getHighlightPrice(planId))}`}
                            className="rounded-full bg-sun-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sun-600"
                          >
                            {PLANS.highlights[planId].days} dias
                          </button>
                        ))}
                      </form>
                    </div>
                  </div>
                ))}
                {filteredProfessionalListings.length === 0 && (
                  <div className="border border-dashed border-sand-300 p-8 text-center dark:border-slate-700">
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {professionalListings.length === 0 ? 'Nenhum anúncio ainda' : 'Nenhum anúncio encontrado'}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {professionalListings.length === 0
                        ? 'Publique o primeiro imóvel da sua carteira.'
                        : 'Tente buscar por cidade, titulo, preco ou codigo POT.'}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section id="zona-risco" className="border border-red-200 bg-white p-5 shadow-sm dark:border-red-900 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-red-50 p-3 text-red-700 dark:bg-red-950/40 dark:text-red-200">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Zona de risco</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Ações sensíveis da conta profissional. Use apenas quando tiver certeza.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <form action={cancelProfessionalSubscription} className="border border-red-100 bg-red-50/60 p-4 dark:border-red-900 dark:bg-red-950/20">
                  <h4 className="font-semibold text-red-800 dark:text-red-100">Cancelar assinatura</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Cancela o plano profissional na Potilar e transforma a conta em particular. Para confirmar, escreva CANCELAR.
                  </p>
                  <input
                    name="confirmation"
                    placeholder="CANCELAR"
                    className="mt-4 h-11 w-full border border-red-200 bg-white px-3 text-sm font-semibold dark:border-red-900 dark:bg-slate-950"
                  />
                  <button type="submit" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white">
                    Cancelar assinatura
                  </button>
                </form>

                <form action={requestAccountDeletion} className="border border-red-100 bg-red-50/60 p-4 dark:border-red-900 dark:bg-red-950/20">
                  <h4 className="font-semibold text-red-800 dark:text-red-100">Eliminar conta pública</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Retira a página profissional do ar e pausa seus anúncios. Para confirmar, escreva EXCLUIR.
                  </p>
                  <input
                    name="confirmation"
                    placeholder="EXCLUIR"
                    className="mt-4 h-11 w-full border border-red-200 bg-white px-3 text-sm font-semibold dark:border-red-900 dark:bg-slate-950"
                  />
                  <button type="submit" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-slate-950 dark:text-red-200">
                    Eliminar conta pública
                  </button>
                </form>
              </div>
            </section>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Minha conta</p>
            {isProfessional && (
              <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                Painel {professionalLabel}
              </h1>
            )}
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {isProfessional
                ? 'Gerencie sua carteira, pagina profissional, contatos e anuncios publicados.'
                : 'Salve favoritos, acompanhe alertas de busca e gerencie seus anuncios publicados.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <Link href="/anunciar" className="inline-flex rounded-xl bg-ocean-600 px-3.5 py-2 text-sm font-semibold text-white">
              Anunciar imovel
            </Link>
            <Link href="/mi-cuenta/favoritos" className="inline-flex rounded-xl border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300">
              Meus favoritos
            </Link>
            <Link href="/mi-cuenta/mensagens" className="inline-flex rounded-xl border border-ocean-200 px-3.5 py-2 text-sm font-semibold text-ocean-700">
              Mensagens
            </Link>
            <Link href="/mi-cuenta/creditos" className="inline-flex rounded-xl border border-sun-200 px-3.5 py-2 text-sm font-semibold text-slate-700">
              Creditos de IA
            </Link>
            {SEARCH_ALERTS_ENABLED && (
              <Link href="/mi-cuenta/alertas" className="inline-flex rounded-xl border border-ocean-200 px-3.5 py-2 text-sm font-semibold text-ocean-700">
                Meus alertas
              </Link>
            )}
            {(profile?.account_type === 'corretor' || profile?.account_type === 'imobiliaria') && (
              <>
                {profile.public_slug && (
                  <Link href={getPublicProfilePath(profile.public_slug)} className="inline-flex rounded-xl border border-ocean-200 px-3.5 py-2 text-sm font-semibold text-ocean-700">
                    Minha pagina
                  </Link>
                )}
                <Link href="/mi-cuenta/perfil" className="inline-flex rounded-xl border border-violet-200 px-3.5 py-2 text-sm font-semibold text-violet-700 dark:border-violet-900 dark:text-violet-300">
                  Editar perfil publico
                </Link>
              </>
            )}
            {profile?.role === 'admin' && (
              <Link href="/admin" className="inline-flex rounded-xl border border-ocean-200 px-3.5 py-2 text-sm font-semibold text-ocean-700">
                Panel admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        {searchParams?.contact_success && (
          <AccountNotice>
            Dados atualizados com sucesso.
          </AccountNotice>
        )}

        {searchParams?.profile_success && (
          <AccountNotice>
            Perfil público atualizado com sucesso.
          </AccountNotice>
        )}

        {searchParams?.profile_error && (
          <AccountNotice tone="error">
            Não foi possível salvar o perfil público: {searchParams.profile_error}
          </AccountNotice>
        )}

        {searchParams?.debug === '1' && (
          <AccountNotice>
            Supabase: {getSupabaseProjectRef()} | Sessao: {user.email ?? 'sem email'} | Auth ID: {user.id} | Perfil: {profile?.email ?? 'sem email'} | Tipo: {profile?.account_type ?? 'sem perfil'} | Plano: {profile?.professional_plan ?? 'sem plano'} | Query: {profileDebug} | Admin: {adminProfileDebug}
          </AccountNotice>
        )}

        {searchParams?.image_success && (
          <AccountNotice>
            Foto principal atualizada com sucesso.
          </AccountNotice>
        )}

        {searchParams?.highlight_success && (
          <AccountNotice>
            Destaque ativado. Conclua o pagamento para liberar a publicacao do destaque.
          </AccountNotice>
        )}

        {searchParams?.highlight_cancelled && (
          <AccountNotice>
            Destaque cancelado. Voce pode escolher outro plano.
          </AccountNotice>
        )}

        {searchParams?.listing_paused && (
          <AccountNotice>
            Anuncio pausado. Ele saiu dos resultados publicos.
          </AccountNotice>
        )}

        {searchParams?.listing_reactivated && (
          <AccountNotice>
            Anuncio reativado.
          </AccountNotice>
        )}

        {searchParams?.listing_deleted && (
          <AccountNotice>
            Anuncio eliminado com sucesso.
          </AccountNotice>
        )}

        {searchParams?.contact_error && (
          <AccountNotice tone="error">
            {searchParams.contact_error === 'phone'
              ? 'Informe um telefone ou WhatsApp valido.'
              : 'Nao foi possivel atualizar o contato.'}
          </AccountNotice>
        )}

        {searchParams?.image_error && (
          <AccountNotice tone="error">
            Nao foi possivel atualizar a foto principal.
          </AccountNotice>
        )}

        {searchParams?.highlight_error && (
          <AccountNotice tone="error">
            Nao foi possivel ativar o destaque.
          </AccountNotice>
        )}

        {searchParams?.listing_error && (
          <AccountNotice tone="error">
            Nao foi possivel atualizar o anuncio.
          </AccountNotice>
        )}

        {isProfessional && (
          <section className="rounded-3xl border border-ocean-100 bg-ocean-50 p-5 shadow-sm dark:border-ocean-900 dark:bg-ocean-950/40">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-700 dark:text-ocean-200">
                  {professionalPlanLabel} ativo
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                  Sua pagina profissional Potilar esta liberada.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Edite seu perfil publico, acompanhe seus anuncios e compartilhe sua vitrine com clientes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {profile?.public_slug && (
                  <Link href={getPublicProfilePath(profile.public_slug)} className="inline-flex rounded-xl bg-ocean-700 px-4 py-2 text-sm font-semibold text-white">
                    Ver minha pagina
                  </Link>
                )}
                <Link href="/mi-cuenta/perfil" className="inline-flex rounded-xl border border-ocean-200 bg-white px-4 py-2 text-sm font-semibold text-ocean-700">
                  Editar perfil
                </Link>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-4">
          {(listings ?? []).map((listing) => {
            const seasonalRenewal = listing.transaction === 'Temporada' ? getSeasonalRenewalInfo(listing.created_at) : null;
            const stats = statsByListingId.get(listing.id);
            const listingPublicHref = `/imoveis/${slugify(`${listing.title}-${listing.location}-${listing.id}`)}`;
            const advertiserPublicHref = profile?.public_slug ? getPublicProfilePath(profile.public_slug) : null;

            return (
            <article key={listing.id} className="glass-card space-y-5 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{listing.title}</h2>
                    <span className="text-base font-bold text-ocean-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(listing.price)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{listing.location}</p>
                  {stats && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {stats.view_count ?? 0} visualizações · {stats.whatsapp_click_count ?? 0} cliques no WhatsApp
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm lg:justify-end">
                  <Link href={listingPublicHref} className="rounded-full border border-sand-200 px-3 py-1 font-semibold text-slate-700">
                    Ver anuncio
                  </Link>
                  {advertiserPublicHref && (
                    <Link href={advertiserPublicHref} className="rounded-full border border-ocean-200 px-3 py-1 font-semibold text-ocean-700">
                      Pagina do anunciante
                    </Link>
                  )}
                  <Link href={`/mi-cuenta/editar/${listing.id}`} className="rounded-full border border-ocean-200 px-3 py-1 font-semibold text-ocean-700">
                    Editar
                  </Link>
                  {listing.status === 'paused' ? (
                    <form action={updateOwnListingStatus}>
                      <input type="hidden" name="id" value={listing.id} />
                      <input type="hidden" name="action" value="reactivate" />
                      <button type="submit" className="rounded-full border border-green-200 px-3 py-1 font-semibold text-green-700">
                        Reativar
                      </button>
                    </form>
                  ) : (
                    <form action={updateOwnListingStatus}>
                      <input type="hidden" name="id" value={listing.id} />
                      <input type="hidden" name="action" value="pause" />
                      <button type="submit" className="rounded-full border border-sun-200 px-3 py-1 font-semibold text-slate-700">
                        Pausar
                      </button>
                    </form>
                  )}
                  <form action={deleteOwnListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button type="submit" className="rounded-full border border-red-200 px-3 py-1 font-semibold text-red-700">
                      Eliminar
                    </button>
                  </form>
                  <span className="rounded-full bg-sand-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {getStatusLabel(listing.status)}
                  </span>
                  {listing.payment_status === 'pix_pending' && (
                    <span className="rounded-full bg-sun-100 px-3 py-1 font-semibold text-slate-800">
                      Pagamento pendente
                    </span>
                  )}
                  {listing.payment_status === 'confirmed' && listing.listing_expires_at && (
                    <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800">
                      Ativo ate {formatDate(listing.listing_expires_at)}
                    </span>
                  )}
                  {listing.featured_payment_status === 'confirmed' && listing.featured_expires_at && (
                    <span className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-800">
                      Destaque ate {formatDate(listing.featured_expires_at)}
                    </span>
                  )}
                </div>
              </div>

              {seasonalRenewal?.shouldShowNotice && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {seasonalRenewal.daysLeft > 0
                      ? `Temporada expira em ${seasonalRenewal.daysLeft} dia${seasonalRenewal.daysLeft === 1 ? '' : 's'}.`
                      : 'O prazo de 60 dias da temporada ja venceu.'}
                  </p>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {SEASONAL_RENEWAL_OPTIONS.map((option) => (
                      <div
                        key={option.days}
                        className="rounded-3xl border border-ocean-100 bg-ocean-50 p-4 dark:border-ocean-900 dark:bg-ocean-950/30"
                      >
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{option.headline}</p>
                        <p className="mt-1 text-2xl font-semibold text-ocean-800">{formatPlanPrice(option.amount)}</p>
                        <div className="mt-4">
                          <ListingMercadoPagoButton
                            listingId={listing.id}
                            kind={option.days === PLANS.listing.seasonalRenewal30DurationDays ? 'renewal30' : 'renewal60'}
                            label={`Pagar renovacao ${option.days} dias`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {listing.payment_status === 'pix_pending' && listing.payment_proof_sent_at ? (
                <div className="rounded-2xl border border-sun-200 bg-sun-50 p-4 text-sm text-slate-800 dark:border-sun-900 dark:bg-sun-950/20 dark:text-slate-100">
                  <p className="font-semibold">Comprovante enviado. Aguardando revisao da Potilar.</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Recebemos sua confirmacao em {formatDate(listing.payment_proof_sent_at)}. O admin ainda precisa confirmar o pagamento para liberar o anuncio.
                  </p>
                </div>
              ) : listing.payment_status === 'pix_pending' ? (
                <div className="space-y-3">
                  <div className="rounded-3xl border border-ocean-100 bg-ocean-50 p-4 dark:border-ocean-900 dark:bg-ocean-950/30">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {listing.transaction === 'Temporada' ? 'Anuncio de temporada pendente' : 'Publicacao pendente'}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-ocean-800">
                      {formatPlanPrice(Number(listing.payment_amount ?? 0))}
                    </p>
                    <div className="mt-4">
                      <ListingMercadoPagoButton
                        listingId={listing.id}
                        kind={listing.transaction === 'Temporada' ? 'seasonal' : 'listing'}
                        label="Pagar agora"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {listing.images && listing.images.length > 0 && (
                <div className="border-t border-sand-200 pt-4 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Foto principal</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {listing.images.map((image: string, index: number) => (
                      <form key={image} action={setMainImage} className="space-y-2">
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="image_url" value={image} />
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                          <Image src={image} alt={listing.title} fill className="object-cover" />
                          {index === 0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-ocean-600 px-2 py-1 text-[10px] font-semibold text-white">
                              Principal
                            </span>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-xs font-semibold text-ocean-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Usar como principal
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )}

              <form action={requestListingHighlight} className="grid gap-3 border-t border-sand-200 pt-4 dark:border-slate-800">
                <input type="hidden" name="id" value={listing.id} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Destacar anuncio</p>
                    {listing.featured_plan && (
                      <p className="mt-1 text-xs text-slate-500">
                        Atual: {getHighlightLabel(listing.featured_plan)} - {formatPlanPrice(Number(listing.featured_payment_amount ?? 0))} - {listing.featured_payment_status}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    name="featured_plan"
                    defaultValue={listing.featured_plan ?? '7_days'}
                    className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    {(['7_days', '15_days', '30_days'] as const).map((planId) => (
                      <option key={planId} value={planId}>
                        {getHighlightLabel(planId)} - {formatPlanPrice(getHighlightPrice(planId))}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-2xl bg-sun-500 px-5 py-3 text-sm font-semibold text-white">
                    Ativar destaque
                  </button>
                </div>
              </form>

              {listing.featured_plan && listing.featured_payment_status === 'pix_pending' && listing.featured_payment_proof_sent_at ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-slate-800 dark:border-violet-900 dark:bg-violet-950/20 dark:text-slate-100">
                  <p className="font-semibold">Comprovante do destaque enviado. Aguardando revisao da Potilar.</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Recebemos sua confirmacao em {formatDate(listing.featured_payment_proof_sent_at)}. O destaque entra no ar depois da confirmacao do pagamento.
                  </p>
                </div>
              ) : listing.featured_plan && listing.featured_payment_status === 'pix_pending' ? (
                <div className="space-y-3">
                  <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Destaque - {getHighlightLabel(listing.featured_plan)}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-violet-800">
                      {formatPlanPrice(Number(listing.featured_payment_amount ?? 0))}
                    </p>
                    <div className="mt-4">
                      <ListingMercadoPagoButton listingId={listing.id} kind="highlight" label="Pagar destaque" />
                    </div>
                  </div>
                </div>
              ) : null}

              {listing.featured_plan && listing.featured_payment_status === 'pix_pending' && (
                <form action={cancelListingHighlight}>
                  <input type="hidden" name="id" value={listing.id} />
                  <button type="submit" className="rounded-2xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700">
                    Cancelar destaque
                  </button>
                </form>
              )}

              <form action={updateListingContact} className="grid gap-3 border-t border-sand-200 pt-4 dark:border-slate-800">
                <input type="hidden" name="id" value={listing.id} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    name="contact_name"
                    type="text"
                    defaultValue={listing.contact_name ?? ''}
                    placeholder="Nome para contato"
                    className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    name="contact_phone"
                    type="tel"
                    defaultValue={listing.contact_whatsapp ?? listing.contact_phone ?? ''}
                    placeholder="Telefone ou WhatsApp"
                    inputMode="numeric"
                    maxLength={12}
                    pattern="[0-9 ]{11,12}"
                    className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    name="contact_email"
                    type="email"
                    defaultValue={listing.contact_email ?? ''}
                    placeholder="Email"
                    className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    ['whatsapp', 'WhatsApp'],
                    ['phone', 'Telefone'],
                    ['email', 'Email']
                  ].map(([value, label]) => (
                    <label key={value} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <input
                        type="checkbox"
                        name="contact_methods"
                        value={value}
                        defaultChecked={(listing.contact_methods ?? []).includes(value)}
                      />
                      {label}
                    </label>
                  ))}
                  <button type="submit" className="rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
                    Guardar contato
                  </button>
                </div>
              </form>
            </article>
            );
          })}
          {(!listings || listings.length === 0) && (
            <div className="glass-card p-8 text-center">
              <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum anuncio ainda</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {isLaunchPromoActive()
                  ? `Publique seus ${getFreeListingLimit()} primeiros anuncios gratis.`
                  : 'Publique seu primeiro anuncio gratuito.'}
              </p>
              <Link href="/anunciar" className="mt-5 inline-flex rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
                Anunciar imovel
              </Link>
            </div>
          )}
        </div>

        <p className="border-t border-sand-200 pt-5 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Anuncios enviados normalmente sao analisados em ate 24 horas.
        </p>
      </div>
    </main>
  );
}


