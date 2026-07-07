import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { createClient } from '@/lib/supabase/server';
import { fetchApprovedListingRows } from '@/lib/fetchApprovedListings';
import { listingRowToProperty, type ListingRow } from '@/lib/listings';
import { orderListingsForDisplay } from '@/lib/propertyOrdering';
import { getAccountTypeLabel } from '@/lib/publicProfile';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile(params.slug);
  if (!profile) {
    return { title: 'Anunciante nao encontrado | Potilar' };
  }

  const displayName = profile.company_name || profile.full_name || 'Anunciante';
  return {
    title: `${displayName} | Potilar`,
    description: profile.bio || `Imoveis publicados por ${displayName} no Rio Grande do Norte.`
  };
}

async function getPublicProfile(slug: string) {
  const supabase = createClient();
  let { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,company_name,bio,phone,account_type,public_slug,creci,creci_verified')
    .ilike('public_slug', slug)
    .in('account_type', ['corretor', 'imobiliaria'])
    .maybeSingle();

  if (error) {
    const fallback = await supabase
      .from('profiles')
      .select('id,full_name,company_name,bio,phone,account_type,public_slug,creci')
      .ilike('public_slug', slug)
      .in('account_type', ['corretor', 'imobiliaria'])
      .maybeSingle();
    data = fallback.data ? { ...fallback.data, creci_verified: false } : null;
  }

  return data;
}

async function getProfileListings(ownerId: string) {
  const supabase = createClient();
  const data = await fetchApprovedListingRows(supabase, { ownerId });
  return orderListingsForDisplay(
    (data as unknown as ListingRow[]).map((row) => listingRowToProperty({ ...row, owner_id: ownerId }))
  );
}

export default async function AnunciantePage({ params }: Props) {
  const profile = await getPublicProfile(params.slug);
  if (!profile?.public_slug) notFound();

  const listings = await getProfileListings(profile.id);
  const verifiedListings = listings.map((property) => ({
    ...property,
    advertiserAccountType: profile.account_type ?? undefined,
    advertiserCreciVerified: Boolean(profile.creci && profile.creci_verified)
  }));
  const displayName = profile.company_name || profile.full_name || 'Anunciante';
  const accountLabel = getAccountTypeLabel(profile.account_type as 'corretor' | 'imobiliaria');
  const phone = profile.phone?.replace(/\D/g, '');
  const whatsappHref = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(`Ola, vi seu perfil na Potilar e quero falar sobre imoveis.`)}`
    : null;

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="glass-card space-y-4 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">{accountLabel} no RN</p>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">{displayName}</h1>
          {profile.creci && <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">CRECI {profile.creci}</p>}
          {profile.bio && <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{profile.bio}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Perfil Potilar
            </span>
            {profile.creci && profile.creci_verified && (
              <span className="inline-flex items-center gap-2 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                CRECI verificado
              </span>
            )}
            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {listings.length} anuncio{listings.length === 1 ? '' : 's'} ativo{listings.length === 1 ? '' : 's'}
            </span>
          </div>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Falar no WhatsApp
            </a>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Imoveis deste anunciante</h2>
          {listings.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">Nenhum anuncio ativo no momento.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {verifiedListings.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>

        <p className="text-sm text-slate-500">
          Voce e corretor ou imobiliaria?{' '}
          <Link href="/mi-cuenta/perfil" className="font-semibold text-ocean-700">
            Configure seu perfil publico
          </Link>
        </p>
      </div>
    </main>
  );
}
