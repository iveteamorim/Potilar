import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPaymentCode } from '@/lib/pix';
import { PLANS } from '@/lib/plans';
import { setMainImage, grantHighlight, updateCreciVerification, updateHighlightStatus, updateListingPaymentStatus, updateListingStatus } from './actions';

export const metadata: Metadata = {
  title: 'Admin | Potilar'
};

const ADMIN_LISTING_SELECT =
  'id,owner_id,title,location,neighborhood,community,address_extra,price,property_type,transaction,bedrooms,bathrooms,parking,description,features,images,status,is_paid,payment_status,payment_amount,payment_confirmed_at,listing_expires_at,featured_plan,featured_payment_status,featured_payment_amount,featured_starts_at,featured_expires_at,referral_code,created_at';
const ADMIN_LISTING_SELECT_FALLBACK =
  'id,owner_id,title,location,neighborhood,community,address_extra,price,property_type,transaction,bedrooms,bathrooms,parking,description,features,images,status,is_paid,payment_status,payment_amount,featured_plan,featured_payment_status,featured_payment_amount,created_at';

function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}


function formatMoney(value?: number | null) {
  return Number(value ?? 0).toFixed(2).replace('.', ',');
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function getListingPaymentLabel(listing: { transaction: string; payment_amount?: number | null }) {
  if (listing.transaction === 'Temporada') return 'Anuncio de temporada';
  return 'Anuncio adicional';
}

function getHighlightLabel(plan?: string | null) {
  if (plan === 'super_30_days') return 'Super destaque 30 dias';
  if (plan === '7_days') return 'Destaque 7 dias';
  if (plan === '15_days') return 'Destaque 15 dias';
  if (plan === '30_days') return 'Destaque 30 dias';
  return 'Destaque';
}

function formatDocument(value?: string | null) {
  const digits = value?.replace(/\D/g, '') ?? '';
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value || 'Não informado';
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: { error?: string; success?: string; filtro?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return (
      <main className="section-padding">
        <div className="mx-auto max-w-3xl glass-card p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Acesso restrito</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Sua conta ainda não tem permissão de administrador.
          </p>
        </div>
      </main>
    );
  }

  let { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select(ADMIN_LISTING_SELECT)
    .in('status', ['pending', 'approved', 'paused', 'rejected'])
    .order('created_at', { ascending: false });

  if (listingsError) {
    const fallback = await supabase
      .from('listings')
      .select(ADMIN_LISTING_SELECT_FALLBACK)
      .in('status', ['pending', 'approved', 'paused', 'rejected'])
      .order('created_at', { ascending: false });
    listings = (fallback.data ?? []).map((listing) => ({
      ...listing,
      payment_confirmed_at: null,
      listing_expires_at: null,
      featured_starts_at: null,
      featured_expires_at: null,
      referral_code: null
    }));
  }

  const ownerIds = Array.from(new Set((listings ?? []).map((listing) => listing.owner_id).filter(Boolean)));
  let advertiserProfiles = new Map<string, { document: string | null; accountType: string | null; creci: string | null; creciVerified: boolean }>();
  if (ownerIds.length > 0) {
    let { data: profileDocs, error: profileDocsError } = await supabase
      .from('profiles')
      .select('id,advertiser_document,account_type,creci,creci_verified')
      .in('id', ownerIds);

    if (profileDocsError) {
      const fallback = await supabase
        .from('profiles')
        .select('id,advertiser_document,account_type,creci')
        .in('id', ownerIds);
      profileDocs = fallback.data?.map((profile) => ({ ...profile, creci_verified: false })) ?? [];
    }

    advertiserProfiles = new Map(
      ((profileDocs ?? []) as Array<{ id: string; advertiser_document: string | null; account_type: string | null; creci: string | null; creci_verified?: boolean | null }>).map((profile) => [
        profile.id,
        {
          document: profile.advertiser_document,
          accountType: profile.account_type,
          creci: profile.creci,
          creciVerified: Boolean(profile.creci_verified)
        }
      ])
    );
  }

  const searchQuery = (searchParams?.q ?? '').trim().toLowerCase();
  const searchDigits = searchQuery.replace(/\D/g, '');
  const normalizedSearchCode = searchQuery.replace(/^pot-?/i, '').replace(/[^0-9a-f]/g, '');

  const filteredListings = (listings ?? []).filter((listing) => {
    if (searchParams?.filtro === 'pix') {
      if (!((listing.is_paid && listing.payment_status !== 'confirmed') || listing.featured_payment_status === 'pix_pending')) return false;
    }
    if (searchParams?.filtro === 'featured') {
      if (!listing.featured_plan) return false;
    }
    if (searchParams?.filtro && ['pending', 'approved', 'paused', 'rejected'].includes(searchParams.filtro) && listing.status !== searchParams.filtro) {
      return false;
    }

    if (!searchQuery) return true;

    const ownerProfile = advertiserProfiles.get(listing.owner_id);
    const documentDigits = (ownerProfile?.document?.replace(/\D/g, '') ?? '');
    const creci = ownerProfile?.creci?.toLowerCase() ?? '';
    const listingCode = getPaymentCode(listing.id).toLowerCase();
    const listingIdCompact = String(listing.id).toLowerCase().replace(/-/g, '');

    return (
      listingCode.includes(searchQuery) ||
      listingIdCompact.includes(normalizedSearchCode) ||
      (searchDigits.length >= 3 && documentDigits.includes(searchDigits)) ||
      creci.includes(searchQuery) ||
      String(listing.title).toLowerCase().includes(searchQuery)
    );
  });

  const orderedListings = [...filteredListings].sort((a, b) => {
    const order = { pending: 0, approved: 1, paused: 2, rejected: 3 } as Record<string, number>;
    return (order[a.status] ?? 99) - (order[b.status] ?? 99);
  });
  const counts = (listings ?? []).reduce(
    (acc, listing) => {
      acc[listing.status] = (acc[listing.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Admin</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Revisao de anuncios</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Aprove, rejeite ou pause anúncios enviados por proprietários.
            </p>
          </div>
          <Link href="/admin/news" className="inline-flex rounded-2xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700">
            Gerenciar notícias
          </Link>
        </div>

        {searchParams?.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Erro: {searchParams.error}
          </div>
        )}

        {searchParams?.success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            Status atualizado com sucesso.
          </div>
        )}

        <form action="/admin" className="grid gap-3 rounded-2xl border border-sand-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_auto]">
          {searchParams?.filtro && <input type="hidden" name="filtro" value={searchParams.filtro} />}
          <input
            name="q"
            defaultValue={searchParams?.q ?? ''}
            placeholder="Buscar por ID, codigo POT, CPF/CNPJ, CRECI ou titulo"
            className="rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <button className="rounded-xl bg-ocean-700 px-5 py-3 text-sm font-semibold text-white">
            Buscar
          </button>
        </form>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ['pending', 'Pendentes'],
            ['approved', 'Publicados'],
            ['paused', 'Pausados'],
            ['rejected', 'Rejeitados']
          ].map(([status, label]) => (
            <div key={status} className="rounded-2xl border border-sand-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{counts[status] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['', 'Todos'],
            ['pending', 'Pendentes'],
            ['pix', 'Pagamentos pendentes'],
            ['featured', 'Destaques'],
            ['approved', 'Publicados'],
            ['paused', 'Pausados'],
            ['rejected', 'Rejeitados']
          ].map(([value, label]) => (
            <Link
              key={value || 'all'}
              href={value ? `/admin?filtro=${value}` : '/admin'}
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                (searchParams?.filtro ?? '') === value
                  ? 'border-ocean-600 bg-ocean-600 text-white'
                  : 'border-sand-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="grid gap-3">
          {orderedListings.map((listing) => (
            <details key={listing.id} className="group overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <summary className="grid cursor-pointer list-none gap-3 p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center [&::-webkit-details-marker]:hidden">
                <div className="relative h-16 w-full overflow-hidden rounded-lg bg-sand-100 sm:w-18 dark:bg-slate-900">
                  {listing.images?.[0] && (
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{listing.title}</h2>
                    <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {listing.status}
                    </span>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800">
                      Anuncio:{' '}
                      {listing.listing_expires_at
                        ? `ativo ate ${formatDate(listing.listing_expires_at)}`
                        : listing.is_paid && listing.payment_status !== 'confirmed'
                          ? 'Pagamento pendente'
                          : listing.is_paid
                            ? 'Pago'
                            : 'Grátis'}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
                      Destaque:{' '}
                      {listing.featured_plan && listing.featured_payment_status !== 'not_requested'
                        ? `${getHighlightLabel(listing.featured_plan)}${
                            listing.featured_expires_at
                              ? ` ate ${formatDate(listing.featured_expires_at)}`
                              : listing.featured_payment_status === 'pix_pending'
                                ? ' pendente'
                                : ' ativo'
                          }`
                        : 'Não'}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-xs text-slate-500">
                    {[listing.location, listing.neighborhood, listing.community].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="text-sm font-semibold text-ocean-700">{formatPrice(listing.price)}</p>
                  <span className="text-lg font-semibold text-slate-400 transition group-open:rotate-180">⌄</span>
                </div>
              </summary>
              <div className="space-y-2 border-t border-sand-100 p-3 dark:border-slate-800">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {listing.status}
                        </span>
                        {listing.is_paid && (
                          <span className="rounded-full bg-sun-100 px-3 py-1 text-xs font-semibold text-slate-800">
                            Anuncio R$ {Number(listing.payment_amount ?? PLANS.listing.additionalPrice).toFixed(2).replace('.', ',')} - {listing.payment_status}
                          </span>
                        )}
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                          Anuncio:{' '}
                          {listing.listing_expires_at
                            ? `ativo ate ${formatDate(listing.listing_expires_at)}`
                            : listing.is_paid && listing.payment_status !== 'confirmed'
                              ? 'Pagamento pendente'
                              : listing.is_paid
                                ? 'Pago'
                                : 'Grátis'}
                        </span>
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
                          Destaque:{' '}
                          {listing.featured_plan && listing.featured_payment_status !== 'not_requested'
                            ? `${getHighlightLabel(listing.featured_plan)}${
                                listing.featured_expires_at
                                  ? ` ate ${formatDate(listing.featured_expires_at)}`
                                  : listing.featured_payment_status === 'pix_pending'
                                    ? ' pendente'
                                    : ' ativo'
                              }`
                            : 'Não'}
                        </span>
                        {listing.referral_code && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                            Captador: {listing.referral_code}
                          </span>
                        )}
                      </div>
                      {((listing.is_paid && listing.payment_status !== 'confirmed') || listing.featured_payment_status === 'pix_pending') && (
                        <div className="mt-2 rounded-xl border border-sun-200 bg-sun-50 px-3 py-2 text-sm text-slate-800">
                          <p className="font-semibold">Pagamento para revisar - codigo {getPaymentCode(listing.id)}</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {listing.is_paid && listing.payment_status !== 'confirmed' && (
                              <div className="rounded-lg bg-white px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  Tipo de pagamento
                                </p>
                                <p className="mt-1 font-semibold">{getListingPaymentLabel(listing)}</p>
                                <p className="text-xs text-slate-600">Status: {listing.payment_status ?? 'pendente'}</p>
                                <p className="text-xs text-slate-600">Valor: R$ {formatMoney(listing.payment_amount)}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <form action={updateListingPaymentStatus}>
                                    <input type="hidden" name="id" value={listing.id} />
                                    <input type="hidden" name="action" value="confirm" />
                                    <button className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white">
                                      Confirmar pagamento
                                    </button>
                                  </form>
                                  <form action={updateListingPaymentStatus}>
                                    <input type="hidden" name="id" value={listing.id} />
                                    <input type="hidden" name="action" value="cancel" />
                                    <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                                      Manter pendente
                                    </button>
                                  </form>
                                </div>
                              </div>
                            )}
                            {listing.featured_payment_status === 'pix_pending' && (
                              <div className="rounded-lg bg-white px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  Tipo de pagamento
                                </p>
                                <p className="mt-1 font-semibold">{getHighlightLabel(listing.featured_plan)}</p>
                                <p className="text-xs text-slate-600">Valor: R$ {formatMoney(listing.featured_payment_amount)}</p>
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-xs">
                            Compare o codigo do pagamento antes de aprovar manualmente.
                          </p>
                        </div>
                      )}
                      <h2 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{listing.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {[listing.location, listing.neighborhood, listing.community].filter(Boolean).join(', ')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <p className="inline-flex rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                          Tipo: {advertiserProfiles.get(listing.owner_id)?.accountType ?? 'particular'}
                        </p>
                        <p className="inline-flex rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                          CPF/CNPJ: {formatDocument(advertiserProfiles.get(listing.owner_id)?.document)}
                        </p>
                        {advertiserProfiles.get(listing.owner_id)?.creci && (
                          <p className="inline-flex rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                            CRECI: {advertiserProfiles.get(listing.owner_id)?.creci}
                          </p>
                        )}
                        {advertiserProfiles.get(listing.owner_id)?.creci && (
                          <p
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              advertiserProfiles.get(listing.owner_id)?.creciVerified
                                ? 'bg-green-50 text-green-800'
                                : 'bg-sun-50 text-slate-800'
                            }`}
                          >
                            {advertiserProfiles.get(listing.owner_id)?.creciVerified ? 'CRECI verificado' : 'CRECI pendente'}
                          </p>
                        )}
                      </div>
                      {advertiserProfiles.get(listing.owner_id)?.creci && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <form action={updateCreciVerification}>
                            <input type="hidden" name="owner_id" value={listing.owner_id} />
                            <input type="hidden" name="action" value="verify" />
                            <button className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white">
                              Marcar CRECI verificado
                            </button>
                          </form>
                          <form action={updateCreciVerification}>
                            <input type="hidden" name="owner_id" value={listing.owner_id} />
                            <input type="hidden" name="action" value="unverify" />
                            <button className="rounded-xl border border-sand-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                              Remover verificação
                            </button>
                          </form>
                        </div>
                      )}
                      {listing.address_extra && (
                        <p className="mt-1 text-xs font-semibold text-slate-500">Referencia: {listing.address_extra}</p>
                      )}
                    </div>
                    <p className="text-base font-semibold text-ocean-700">{formatPrice(listing.price)}</p>
                  </div>

                  <p className="line-clamp-1 text-sm text-slate-600 dark:text-slate-300">{listing.description}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {listing.property_type} - {listing.transaction} - {listing.bedrooms} quartos - {listing.bathrooms} banheiros - {listing.parking} garagem
                  </p>

                  {listing.status === 'approved' && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-slate-900">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                            Dar destaque grátis (admin)
                          </p>
                          <p className="mt-1 text-xs text-violet-800 dark:text-violet-200">
                            Cortesia admin: entra no carrossel da home e no topo das buscas, mesmo sem Pix. Vale para anúncios novos após o corte de destaque pago.
                          </p>
                          {listing.featured_payment_status === 'confirmed' && listing.featured_plan && (
                            <p className="mt-2 text-xs font-semibold text-violet-700 dark:text-violet-200">
                              Ativo: {getHighlightLabel(listing.featured_plan)}
                              {listing.featured_expires_at ? ` ate ${formatDate(listing.featured_expires_at)}` : ''}
                              {Number(listing.featured_payment_amount ?? 0) === 0 ? ' (cortesia)' : ''}
                            </p>
                          )}
                        </div>
                        <form action={grantHighlight} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={listing.id} />
                          <label className="text-xs font-semibold text-violet-900 dark:text-violet-100">
                            Plano
                            <select
                              name="featured_plan"
                              defaultValue={listing.featured_plan ?? '7_days'}
                              className="mt-1 block min-w-[11rem] rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-violet-800 dark:bg-slate-950 dark:text-slate-200"
                            >
                              <option value="7_days">Destaque 7 dias</option>
                              <option value="15_days">Destaque 15 dias</option>
                              <option value="30_days">Destaque 30 dias</option>
                              <option value="super_30_days">Super destaque 30 dias</option>
                            </select>
                          </label>
                          <button className="rounded-2xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                            Ativar destaque grátis
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {listing.featured_plan && (
                    <div className="rounded-xl border border-ocean-100 bg-ocean-50 p-3 dark:border-ocean-900 dark:bg-slate-900">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ocean-900 dark:text-ocean-100">
                            Pedido de destaque
                          </p>
                          <p className="mt-1 text-xs font-semibold text-ocean-700 dark:text-ocean-200">
                            {getHighlightLabel(listing.featured_plan)} -{' '}
                            {Number(listing.featured_payment_amount ?? 0) === 0
                              ? 'Cortesia admin'
                              : `R$ ${formatMoney(listing.featured_payment_amount)}`}{' '}
                            - {listing.featured_payment_status}
                          </p>
                          {listing.featured_payment_status === 'pix_pending' && (
                            <p className="mt-2 text-xs font-semibold text-ocean-700 dark:text-ocean-200">
                              Codigo: {getPaymentCode(listing.id)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {listing.featured_payment_status === 'pix_pending' && (
                            <form action={updateHighlightStatus}>
                              <input type="hidden" name="id" value={listing.id} />
                              <input type="hidden" name="action" value="confirm" />
                              <button className="rounded-2xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white">
                                Confirmar destaque
                              </button>
                            </form>
                          )}
                          {listing.featured_payment_status !== 'not_requested' && (
                            <form action={updateHighlightStatus}>
                              <input type="hidden" name="id" value={listing.id} />
                              <input type="hidden" name="action" value="cancel" />
                              <button className="rounded-2xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700">
                                Pausar destaque
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {listing.images && listing.images.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Foto principal</p>
                      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {listing.images.slice(0, 10).map((image: string, index: number) => (
                          <form key={image} action={setMainImage} className="space-y-2">
                            <input type="hidden" name="id" value={listing.id} />
                            <input type="hidden" name="image_url" value={image} />
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                              <Image src={image} alt={listing.title} fill className="object-cover" />
                              {index === 0 && (
                                <span className="absolute left-1 top-1 rounded-full bg-ocean-600 px-2 py-1 text-[10px] font-semibold text-white">
                                  Principal
                                </span>
                              )}
                            </div>
                            <button
                              type="submit"
                              disabled={index === 0}
                              className="w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-[10px] font-semibold text-ocean-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Usar
                            </button>
                          </form>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Link href={`/admin/editar/${listing.id}`} className="rounded-xl border border-ocean-200 px-4 py-2 text-xs font-semibold text-ocean-700">
                      Editar anúncio
                    </Link>
                    {listing.status !== 'approved' && (
                      <form action={updateListingStatus}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white">Aprovar e publicar</button>
                      </form>
                    )}
                    {listing.status !== 'rejected' && (
                      <form action={updateListingStatus}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700">Rejeitar</button>
                      </form>
                    )}
                    {listing.status !== 'paused' && (
                      <form action={updateListingStatus}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value="paused" />
                        <button className="rounded-xl border border-sand-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Pausar</button>
                      </form>
                    )}
                    {listing.status === 'approved' && (
                      <span className="inline-flex items-center rounded-xl bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
                        Publicado em Imoveis
                      </span>
                    )}
                  </div>
                </div>
            </details>
          ))}

          {(!listings || listings.length === 0) && (
            <div className="glass-card p-8 text-center">
              <p className="text-base font-semibold text-slate-900 dark:text-white">Nenhum anúncio enviado ainda</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
