import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AccountNotice from '@/components/AccountNotice';
import LogoutButton from '@/components/LogoutButton';
import PixPaymentPanel from '@/components/PixPaymentPanel';
import { PLANS, formatPlanPrice, getHighlightLabel, getHighlightPrice } from '@/lib/plans';
import {
  cancelListingHighlight,
  deleteOwnListing,
  markPixProofSent,
  requestListingHighlight,
  setMainImage,
  updateListingContact,
  updateOwnListingStatus
} from './actions';

export const metadata: Metadata = {
  title: 'Minha conta | Potilar'
};

const SEASONAL_DURATION_DAYS = PLANS.listing.seasonalDurationDays;
const SEASONAL_RENEWAL_NOTICE_DAYS = PLANS.listing.seasonalRenewalNoticeDays;
const SEASONAL_RENEWAL_PRICE = PLANS.listing.seasonalRenewalPrice;

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
  };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta');

  let { data: profile } = await supabase.from('profiles').select('role,account_type,public_slug').eq('id', user.id).single();

  if (!profile) {
    const fallbackProfile = await supabase.from('profiles').select('role,account_type').eq('id', user.id).single();
    profile = fallbackProfile.data ? { ...fallbackProfile.data, public_slug: null } : null;
  }

  let { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id,title,location,transaction,price,status,images,is_paid,payment_status,payment_amount,payment_confirmed_at,payment_proof_sent_at,listing_expires_at,featured_plan,featured_payment_status,featured_payment_amount,featured_payment_proof_sent_at,featured_starts_at,featured_expires_at,contact_name,contact_phone,contact_whatsapp,contact_email,contact_methods,created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

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

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Minha conta</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Meus anuncios ({listingCount})
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Acompanhe seus anuncios enviados, pendentes de revisao e publicados. Para criar um novo, clique em Anunciar imovel.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <Link href="/anunciar" className="inline-flex rounded-xl bg-ocean-600 px-3.5 py-2 text-sm font-semibold text-white">
              Anunciar imovel
            </Link>
            <Link href="/mi-cuenta/favoritos" className="inline-flex rounded-xl border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-300">
              Meus favoritos
            </Link>
            <Link href="/mi-cuenta/alertas" className="inline-flex rounded-xl border border-ocean-200 px-3.5 py-2 text-sm font-semibold text-ocean-700">
              Meus alertas
            </Link>
            {(profile?.account_type === 'corretor' || profile?.account_type === 'imobiliaria') && (
              <Link href="/mi-cuenta/perfil" className="inline-flex rounded-xl border border-violet-200 px-3.5 py-2 text-sm font-semibold text-violet-700 dark:border-violet-900 dark:text-violet-300">
                Perfil publico
              </Link>
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

        {searchParams?.image_success && (
          <AccountNotice>
            Foto principal atualizada com sucesso.
          </AccountNotice>
        )}

        {searchParams?.highlight_success && (
          <AccountNotice>
            Destaque ativado. Faca o Pix para liberar a publicacao do destaque.
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

        <div className="grid gap-4">
          {(listings ?? []).map((listing) => {
            const seasonalRenewal = listing.transaction === 'Temporada' ? getSeasonalRenewalInfo(listing.created_at) : null;
            const stats = statsByListingId.get(listing.id);

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
                      {stats.view_count ?? 0} visualizacoes · {stats.whatsapp_click_count ?? 0} cliques no WhatsApp
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm lg:justify-end">
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
                      Pix em revisao
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
                  <PixPaymentPanel
                    listingId={listing.id}
                    amount={SEASONAL_RENEWAL_PRICE}
                    title={listing.title}
                    kind="renewal"
                    headline="Renovacao de temporada"
                    showSteps={false}
                  />
                </div>
              )}

              {listing.payment_status === 'pix_pending' && listing.payment_proof_sent_at ? (
                <div className="rounded-2xl border border-sun-200 bg-sun-50 p-4 text-sm text-slate-800 dark:border-sun-900 dark:bg-sun-950/20 dark:text-slate-100">
                  <p className="font-semibold">Comprovante enviado. Aguardando revisao da Potilar.</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Recebemos sua confirmacao em {formatDate(listing.payment_proof_sent_at)}. O admin ainda precisa confirmar o Pix para liberar o anuncio.
                  </p>
                </div>
              ) : listing.payment_status === 'pix_pending' ? (
                <div className="space-y-3">
                  <PixPaymentPanel
                    listingId={listing.id}
                    amount={Number(listing.payment_amount ?? 0)}
                    title={listing.title}
                    kind={listing.transaction === 'Temporada' ? 'seasonal' : 'listing'}
                    headline="Aguardando pagamento Pix"
                    showSteps={false}
                  />
                  <form action={markPixProofSent} className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:border-green-900 dark:from-green-950/30 dark:to-slate-950">
                    <input type="hidden" name="id" value={listing.id} />
                    <input type="hidden" name="kind" value="listing" />
                    <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      Ja paguei e enviei o comprovante
                    </button>
                    <p className="mt-2 text-center text-xs font-semibold text-green-800 dark:text-green-100">
                      Clique aqui depois de enviar o comprovante pelo WhatsApp.
                    </p>
                  </form>
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
                    {(['7_days', '30_days', 'super_30_days'] as const).map((planId) => (
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
                    Recebemos sua confirmacao em {formatDate(listing.featured_payment_proof_sent_at)}. O destaque entra no ar depois da confirmacao do Pix.
                  </p>
                </div>
              ) : listing.featured_plan && listing.featured_payment_status === 'pix_pending' ? (
                <div className="space-y-3">
                  <PixPaymentPanel
                    listingId={listing.id}
                    amount={Number(listing.featured_payment_amount ?? 0)}
                    title={listing.title}
                    kind="highlight"
                    headline={`Destaque - ${getHighlightLabel(listing.featured_plan)}`}
                    showSteps={false}
                  />
                  <form action={markPixProofSent} className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:border-green-900 dark:from-green-950/30 dark:to-slate-950">
                    <input type="hidden" name="id" value={listing.id} />
                    <input type="hidden" name="kind" value="highlight" />
                    <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      Ja paguei e enviei o comprovante do destaque
                    </button>
                    <p className="mt-2 text-center text-xs font-semibold text-green-800 dark:text-green-100">
                      Clique aqui depois de enviar o comprovante pelo WhatsApp.
                    </p>
                  </form>
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
                Publique ate {PLANS.listing.freeListingLimit} anuncios gratuitos na promocao de lancamento.
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
