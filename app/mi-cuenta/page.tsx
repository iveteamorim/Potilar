import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, BarChart3, Bath, BedDouble, Bell, Car, Check, Clock3, CreditCard, ExternalLink, Eye, FileSpreadsheet, Globe2, Heart, Home, MessageCircle, MoreVertical, Pencil, Plus, Ruler, Search, Settings, Share2, ShieldCheck, Sparkles, Trash2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SUPABASE_URL } from '@/lib/supabase/config';
import AccountNotice from '@/components/AccountNotice';
import AccountTabs from '@/components/AccountTabs';
import DemoProfileImageManager from '@/components/DemoProfileImageManager';
import ProfessionalProfilePanelCard from '@/components/ProfessionalProfilePanelCard';
import BrokerPotilarScoreCard from '@/components/BrokerPotilarScoreCard';
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
import { computeBrokerGamification } from '@/lib/brokerGamification';
import { normalizeListingImageUrl, normalizeListingImageUrls } from '@/lib/imageUrls';
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
    headline: `Renovação de temporada - ${PLANS.listing.seasonalRenewal30DurationDays} dias`
  },
  {
    days: PLANS.listing.seasonalRenewal60DurationDays,
    amount: PLANS.listing.seasonalRenewal60Price,
    headline: `Renovação de temporada - ${PLANS.listing.seasonalRenewal60DurationDays} dias`
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
    pending: 'Em revisão',
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
  const propertyType = ['Casa', 'Terreno', 'Apartamento', 'Kitnet/Conjugado', 'Ponto comercial'].includes(listing.property_type)
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
    images: normalizeListingImageUrls(Array.isArray(listing.images) ? listing.images : []),
    videoUrl: listing.video_url ?? undefined,
    tourUrl: listing.tour_url ?? undefined,
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

function EmptyListingsIllustration() {
  return (
    <svg viewBox="0 0 160 160" className="mx-auto h-28 w-28" aria-hidden="true">
      <circle cx="80" cy="80" r="78" fill="#e8f1fb" />
      <ellipse cx="48" cy="58" rx="22" ry="12" fill="#fff" />
      <ellipse cx="118" cy="50" rx="18" ry="10" fill="#fff" />
      <path d="M38 118c8-22 22-34 42-34s34 12 42 34" fill="#d7ead8" />
      <path d="M46 108h68v18H46z" fill="#f4f7fb" />
      <path d="M52 108V86h56v22" fill="#fff" />
      <path d="M46 88l34-28 34 28" fill="#1d4f91" />
      <rect x="72" y="98" width="16" height="28" rx="2" fill="#1d4f91" />
      <rect x="58" y="94" width="14" height="12" rx="1.5" fill="#9ec3ea" />
      <rect x="88" y="94" width="14" height="12" rx="1.5" fill="#9ec3ea" />
      <circle cx="124" cy="112" r="10" fill="#3f8f4b" />
      <circle cx="136" cy="116" r="8" fill="#4aa057" />
    </svg>
  );
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
    plano?: string;
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

  if (!profile) {
    redirect('/login?next=/mi-cuenta&session=invalid');
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
    .select('id,title,property_type,location,neighborhood,transaction,price,price_period,bedrooms,bathrooms,parking,area_sqm,lat,lng,is_pet_friendly,is_furnished,condo_fee,description,features,video_url,tour_url,status,images,is_paid,payment_status,payment_amount,payment_confirmed_at,payment_proof_sent_at,listing_expires_at,featured_plan,featured_payment_status,featured_payment_amount,featured_payment_proof_sent_at,featured_starts_at,featured_expires_at,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods,created_at,updated_at')
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
  const professionalLabel = profile?.account_type === 'corretor' ? 'Corretor' : 'Imobiliária';
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
    const effectivePublicSlug = profile.public_slug || buildProfessionalProfileSlug(profile, user.id);
    const publicPath = getPublicProfilePath(effectivePublicSlug);
    const profileImageUrl = profile.profile_image_url || DEFAULT_PROFESSIONAL_PHOTO;
    const bannerImageUrl = profile.banner_image_url || DEFAULT_PROFESSIONAL_BANNER;
    const professionalListings = (listings ?? []).map((listing) => toPropertyCardListing(listing, profile));
    const brokerGamification = computeBrokerGamification(listings ?? [], profile);
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
                ['Importar carteira', FileSpreadsheet, '/mi-cuenta/importar', 'default'],
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
                  <Link href="/mi-cuenta/importar" className="inline-flex items-center gap-2 rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700">
                    <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                    Importar carteira
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

            {searchParams?.plano === 'ativacao_sucesso' && (
              <AccountNotice>
                Ativacao recebida. Sua carteira profissional fica liberada por 60 dias antes da primeira mensalidade.
              </AccountNotice>
            )}

            {searchParams?.plano === 'ativacao_pendente' && (
              <AccountNotice>
                Ativacao pendente. Assim que o Mercado Pago confirmar, liberamos sua carteira profissional.
              </AccountNotice>
            )}

            {searchParams?.plano === 'erro' && (
              <AccountNotice tone="error">
                Nao foi possivel concluir a ativacao. Voce pode tentar novamente em Planos.
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

            <BrokerPotilarScoreCard gamification={brokerGamification} />

            <ProfessionalProfilePanelCard
              displayName={displayName}
              accountLabel={accountLabel}
              roleLabel={professionalLabel}
              profileImageUrl={profileImageUrl}
              creci={profile.creci}
              creciVerified={Boolean(profile.creci_verified)}
              languages={languages}
              bio={profile.bio || ''}
              publicSlug={effectivePublicSlug}
              updateAction={updateProfessionalProfile}
            />

            <div id="imagens-perfil">
            <DemoProfileImageManager
              displayName={displayName}
              bannerImageUrl={bannerImageUrl}
              publicSlug={effectivePublicSlug}
            />
            </div>

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
                      placeholder="Buscar por título, cidade, preço ou código"
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
                    <PropertyCard property={property} variant="horizontal" panelPreview />
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
                        : 'Tente buscar por cidade, título, preço ou código POT.'}
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
    <main className="section-padding max-sm:py-8">
      <div className="mx-auto max-w-6xl space-y-8 max-sm:space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <h1 className="font-display text-[2rem] leading-tight text-ocean-950 dark:text-white sm:text-4xl sm:font-bold">
              Minha conta
            </h1>
            {isProfessional && (
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-ocean-600">
                Painel {professionalLabel}
              </p>
            )}
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300 sm:mt-3 sm:text-base sm:leading-7">
              {isProfessional
                ? 'Gerencie sua carteira, página profissional, contatos e anúncios publicados.'
                : 'Salve favoritos, acompanhe alertas de busca e gerencie seus anúncios publicados.'}
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Link href="/admin" className="inline-flex h-11 items-center justify-center rounded-xl border border-ocean-200 bg-white px-4 text-sm font-semibold text-ocean-700 shadow-sm hover:border-ocean-400 dark:border-slate-700 dark:bg-slate-900 dark:text-ocean-200">
              Panel admin
            </Link>
          )}
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
            Destaque cancelado. Você pode escolher outro plano.
          </AccountNotice>
        )}

        {searchParams?.listing_paused && (
          <AccountNotice>
            Anúncio pausado. Ele saiu dos resultados públicos.
          </AccountNotice>
        )}

        {searchParams?.listing_reactivated && (
          <AccountNotice>
            Anúncio reativado.
          </AccountNotice>
        )}

        {searchParams?.listing_deleted && (
          <AccountNotice>
            Anúncio eliminado com sucesso.
          </AccountNotice>
        )}

        {searchParams?.contact_error && (
          <AccountNotice tone="error">
            {searchParams.contact_error === 'phone'
              ? 'Informe o telefone/WhatsApp com DDI (ex: +55 84 99999-9999 ou +34 687 153 601).'
              : searchParams.contact_error === 'email'
                ? 'Informe um email valido ou desmarque a opcao Email.'
                : searchParams.contact_error === 'missing'
                  ? 'Selecione ao menos um canal de contato (WhatsApp, Telefone ou Email).'
                  : 'Não foi possível atualizar o contato.'}
          </AccountNotice>
        )}

        {searchParams?.image_error && (
          <AccountNotice tone="error">
            Não foi possível atualizar a foto principal.
          </AccountNotice>
        )}

        {searchParams?.highlight_error && (
          <AccountNotice tone="error">
            Não foi possível ativar o destaque.
          </AccountNotice>
        )}

        {searchParams?.listing_error && (
          <AccountNotice tone="error">
            Não foi possível atualizar o anúncio.
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
                  Sua página profissional Potilar está liberada.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Edite seu perfil público, acompanhe seus anúncios e compartilhe sua vitrine com clientes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {profile?.public_slug && (
                  <Link href={getPublicProfilePath(profile.public_slug)} className="inline-flex rounded-xl bg-ocean-700 px-4 py-2 text-sm font-semibold text-white">
                    Ver minha página
                  </Link>
                )}
                <Link href="/mi-cuenta/perfil" className="inline-flex rounded-xl border border-ocean-200 bg-white px-4 py-2 text-sm font-semibold text-ocean-700">
                  Editar perfil
                </Link>
              </div>
            </div>
          </section>
        )}

        <div id="anuncios">
          <AccountTabs active="anuncios" />
        </div>

        <div className="grid gap-5">
          {(listings ?? []).map((listing) => {
            const seasonalRenewal = listing.transaction === 'Temporada' ? getSeasonalRenewalInfo(listing.created_at) : null;
            const listingPublicHref = `/imoveis/${slugify(`${listing.title}-${listing.location}-${listing.id}`)}`;
            const hasPendingPayment = listing.payment_status === 'pix_pending';
            const isPublished = listing.status === 'approved' && !hasPendingPayment;
            const coverImage = listing.images?.[0] ? normalizeListingImageUrl(listing.images[0]) : null;
            const statusPill = hasPendingPayment
              ? 'Pagamento pendente'
              : listing.status === 'approved'
                ? 'Publicado'
                : getStatusLabel(listing.status);
            const actionButtonClass =
              'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-sand-300 bg-white px-4 text-sm font-bold text-ocean-800 dark:border-slate-700 dark:bg-slate-900';

            return (
            <article key={listing.id} className="relative overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <details className="absolute right-4 top-4 z-10">
                <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full text-slate-400 hover:bg-sand-50 hover:text-slate-600 [&::-webkit-details-marker]:hidden">
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Mais opções</span>
                </summary>
                <div className="absolute right-0 mt-1 w-44 overflow-hidden rounded-xl border border-sand-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {!hasPendingPayment && listing.status === 'approved' && (
                    <form action={updateOwnListingStatus}>
                      <input type="hidden" name="id" value={listing.id} />
                      <input type="hidden" name="action" value="pause" />
                      <button type="submit" className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-sand-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        Pausar anúncio
                      </button>
                    </form>
                  )}
                  {!hasPendingPayment && listing.status === 'paused' && (
                    <form action={updateOwnListingStatus}>
                      <input type="hidden" name="id" value={listing.id} />
                      <input type="hidden" name="action" value="reactivate" />
                      <button type="submit" className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-green-700 hover:bg-sand-50">
                        Reativar anúncio
                      </button>
                    </form>
                  )}
                  <Link href={`/mi-cuenta/editar/${listing.id}`} className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sand-50 dark:text-slate-200 dark:hover:bg-slate-800">
                    Editar anúncio
                  </Link>
                </div>
              </details>

              <div className="grid gap-6 p-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
                <div>
                  <div className="relative h-[200px] overflow-hidden rounded-lg bg-sand-100">
                    {coverImage ? (
                      <Image src={coverImage} alt={listing.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full min-h-48 items-center justify-center text-sm font-semibold text-slate-400">
                        Sem foto
                      </div>
                    )}
                  </div>
                  {!isPublished && (
                    <div className="mt-4 flex items-center gap-6">
                      <Link href={`/mi-cuenta/editar/${listing.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-ocean-800">
                        <Pencil className="h-4 w-4" />
                        Editar anúncio
                      </Link>
                      <form action={deleteOwnListing}>
                        <input type="hidden" name="id" value={listing.id} />
                        <button type="submit" className="inline-flex items-center gap-2 text-sm font-bold text-red-700">
                          <Trash2 className="h-4 w-4" />
                          Excluir anúncio
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col pr-8">
                  <h2 className="text-2xl font-bold leading-tight text-ocean-950 dark:text-white">{listing.title}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">{listing.location}</p>
                  <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {listing.bedrooms > 0 && <span className="inline-flex items-center gap-2"><BedDouble className="h-4 w-4" />{listing.bedrooms} quartos</span>}
                    {listing.bathrooms > 0 && <span className="inline-flex items-center gap-2"><Bath className="h-4 w-4" />{listing.bathrooms} banheiros</span>}
                    {listing.parking > 0 && <span className="inline-flex items-center gap-2"><Car className="h-4 w-4" />{listing.parking} vaga{listing.parking === 1 ? '' : 's'}</span>}
                    {listing.area_sqm && <span className="inline-flex items-center gap-2"><Ruler className="h-4 w-4" />{listing.area_sqm} m²</span>}
                  </div>
                  <p className="mt-7 text-3xl font-bold text-ocean-950 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(listing.price)}
                    {listing.transaction === 'Aluguel' && <span className="text-base font-semibold text-slate-500"> / mês</span>}
                    {listing.transaction === 'Temporada' && <span className="text-base font-semibold text-slate-500"> / {listing.price_period ?? 'dia'}</span>}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    {isPublished
                      ? `Publicado em ${formatDate(listing.created_at)}`
                      : `Criado em ${formatDate(listing.created_at)}`}
                  </p>
                </div>

                <aside className="flex flex-col gap-5 lg:border-l lg:border-sand-200 lg:pl-8 lg:pr-8 dark:lg:border-slate-800">
                  <div className="flex justify-start lg:justify-center">
                    <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${
                      hasPendingPayment
                        ? 'bg-sun-100 text-sun-700'
                        : listing.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-sand-100 text-slate-700'
                    }`}>
                      {hasPendingPayment && <Clock3 className="mr-2 h-4 w-4" />}
                      {listing.status === 'approved' && !hasPendingPayment && <Check className="mr-2 h-4 w-4" />}
                      {statusPill}
                    </span>
                  </div>

                  {hasPendingPayment ? (
                    <div className="mt-auto space-y-5">
                      <p className="text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Seu anúncio está pronto. Finalize o pagamento para publicar.
                      </p>
                      <div className="border-t border-sand-200 pt-4 text-center dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-500">Valor para publicação</p>
                        <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                          {formatPlanPrice(Number(listing.payment_amount ?? 0))}
                        </p>
                      </div>
                      <ListingMercadoPagoButton
                        listingId={listing.id}
                        kind={listing.transaction === 'Temporada' ? 'seasonal' : 'listing'}
                        label="Pagar e publicar"
                      />
                    </div>
                  ) : isPublished ? (
                    <div className="mt-auto space-y-4 text-center text-sm text-slate-600 dark:text-slate-300">
                      <p>{listing.listing_expires_at ? `Publicado até ${formatDate(listing.listing_expires_at)}` : 'Anúncio publicado.'}</p>
                      {seasonalRenewal?.shouldShowNotice && (
                        <div className="rounded-xl border border-ocean-100 bg-ocean-50 p-3 text-left dark:border-ocean-900 dark:bg-ocean-950/30">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {seasonalRenewal.daysLeft > 0
                              ? `Temporada expira em ${seasonalRenewal.daysLeft} dia${seasonalRenewal.daysLeft === 1 ? '' : 's'}.`
                              : 'O prazo de 60 dias da temporada ja venceu.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-auto text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {listing.status === 'pending' ? 'Seu anúncio está em revisão.' : 'Este anúncio não está publicado.'}
                    </p>
                  )}
                </aside>
              </div>

              {isPublished && (
                <div className="grid gap-3 border-t border-sand-200 px-6 py-4 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
                  <Link href={listingPublicHref} className={actionButtonClass}>
                    <ExternalLink className="h-4 w-4" />
                    Ver anúncio
                  </Link>
                  <Link href={`/mi-cuenta/divulgar/${listing.id}`} className={actionButtonClass}>
                    <Share2 className="h-4 w-4" />
                    Kit de divulgação
                  </Link>
                  <Link href={`/mi-cuenta/editar/${listing.id}`} className={actionButtonClass}>
                    <Pencil className="h-4 w-4" />
                    Editar anúncio
                  </Link>
                  <form action={deleteOwnListing} className="w-full">
                    <input type="hidden" name="id" value={listing.id} />
                    <button type="submit" className={`${actionButtonClass} text-red-700`}>
                      <Trash2 className="h-4 w-4" />
                      Excluir anúncio
                    </button>
                  </form>
                </div>
              )}
            </article>
            );
          })}
          {(!listings || listings.length === 0) && (
            <>
              <div className="rounded-2xl border border-sand-200 bg-white px-5 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:hidden">
                <EmptyListingsIllustration />
                <p className="mt-5 text-lg font-bold text-ocean-950 dark:text-white">Nenhum anúncio ainda</p>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Publique seu primeiro imóvel gratuitamente e comece a receber contatos.
                </p>
                <Link
                  href="/anunciar"
                  className="mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-ocean-800 px-5 py-3.5 text-sm font-bold text-white"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </span>
                  Anunciar imóvel
                </Link>
              </div>
              <div className="glass-card hidden p-8 text-center sm:block">
                <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum anúncio ainda</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {isLaunchPromoActive()
                    ? 'Publique seu primeiro anúncio grátis.'
                    : 'Publique seu primeiro anúncio gratuito.'}
                </p>
                <Link href="/anunciar" className="mt-5 inline-flex rounded-2xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white">
                  Anunciar imóvel
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-[#eef4fb] px-4 py-4 dark:bg-slate-900 sm:hidden">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-ocean-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-ocean-950 dark:text-white">Seguro e confiável</p>
            <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
              Seus dados estão protegidos e seus anúncios passam por verificações automáticas.
            </p>
          </div>
        </div>
        <p className="hidden border-t border-sand-200 pt-5 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:block">
          Anúncios enviados normalmente são analisados em até 24 horas.
        </p>
      </div>
    </main>
  );
}


