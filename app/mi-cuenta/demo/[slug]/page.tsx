import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, BarChart3, Eye, Globe2, Home, Languages, MessageCircle, Pencil, Plus, Settings, ShieldCheck } from 'lucide-react';
import DemoProfileImageManager from '@/components/DemoProfileImageManager';
import PropertyCard from '@/components/PropertyCard';
import { getDemoProfessionalListings, getDemoProfessionalProfile } from '@/data/demoProfessionalProfiles';
import { getAccountTypeLabel, getPublicProfilePath } from '@/lib/publicProfile';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = getDemoProfessionalProfile(params.slug);
  return {
    title: profile ? `Demo interna ${profile.company_name || profile.full_name} | Potilar` : 'Demo interna | Potilar'
  };
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

function getPlanLabel(plan?: string | null) {
  if (plan === 'plus') return 'Imobiliária Plus';
  if (plan === 'imobiliaria') return 'Imobiliária';
  return 'Corretor';
}

export default function DemoInternalPage({ params }: Props) {
  const profile = getDemoProfessionalProfile(params.slug);
  if (!profile) notFound();

  const listings = getDemoProfessionalListings(profile.id);
  const activeListings = listings.length;
  const totalPortfolio = listings.reduce((sum, listing) => sum + listing.price, 0);
  const publicPath = getPublicProfilePath(profile.public_slug);
  const displayName = profile.company_name || profile.full_name;
  const accountLabel = getAccountTypeLabel(profile.account_type);

  return (
    <main className="bg-sand-50 py-8 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit border border-sand-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-sand-200 pb-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-600">Conta demo</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{displayName}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{getPlanLabel(profile.professional_plan)}</p>
          </div>
          <nav className="mt-4 grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {([
              ['Visão geral', BarChart3],
              ['Minha página pública', Globe2],
              ['Meus anúncios', Home],
              ['Editar perfil', Pencil],
              ['Mensagens', MessageCircle],
              ['Configurações', Settings]
            ] as const).map(([label, Icon]) => (
              <a
                key={String(label)}
                href="#"
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition first:bg-ocean-50 first:text-ocean-800 hover:bg-sand-50 dark:first:bg-ocean-950/40 dark:hover:bg-slate-800"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>
          <Link href="/login" className="mt-5 inline-flex w-full justify-center rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Trocar demo
          </Link>
        </aside>

        <section className="space-y-6">
          <div className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Painel {accountLabel}</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Página profissional de {displayName}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Área interna demo para editar a vitrine pública, acompanhar anúncios e revisar contatos recebidos.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Imóveis ativos', String(activeListings)],
              ['Valor da carteira', formatPrice(totalPortfolio)],
              ['Contatos este mês', profile.professional_plan === 'plus' ? '42' : profile.professional_plan === 'imobiliaria' ? '27' : '18']
            ].map(([label, value]) => (
              <div key={label} className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-ocean-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Prévia da página pública</h3>
                  <p className="mt-1 text-sm text-slate-500">Esses dados aparecem para visitantes.</p>
                </div>
                <BadgeCheck className="h-6 w-6 text-ocean-700" aria-hidden="true" />
              </div>

              <div className="mt-5 border border-sand-200 p-5 dark:border-slate-800">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="grid h-24 w-40 shrink-0 place-items-center border border-sand-200 bg-white px-4 text-center text-base font-semibold text-slate-950">
                    {displayName}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-800">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {accountLabel} Potilar
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        CRECI verificado
                      </span>
                    </div>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{displayName}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.bio}</p>
                    <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <Languages className="h-4 w-4" aria-hidden="true" />
                      Fala {profile.languages?.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Editar perfil público</h3>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nome público</span>
                  <input defaultValue={displayName} className="mt-2 h-11 w-full border border-sand-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">CRECI</span>
                  <input defaultValue={profile.creci} className="mt-2 h-11 w-full border border-sand-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Idiomas</span>
                  <input defaultValue={profile.languages?.join(', ')} className="mt-2 h-11 w-full border border-sand-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sobre</span>
                  <textarea defaultValue={profile.bio} rows={4} className="mt-2 w-full border border-sand-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                </label>
                <button type="button" className="h-11 w-full rounded-xl bg-ocean-700 px-4 text-sm font-semibold text-white">
                  Salvar alterações
                </button>
              </div>
            </section>
          </div>

          <DemoProfileImageManager
            displayName={displayName}
            profileImageUrl={profile.profile_image_url}
            bannerImageUrl={profile.banner_image_url}
          />

          <section className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Anúncios da conta</h3>
                <p className="mt-1 text-sm text-slate-500">Prévia interna da carteira publicada.</p>
              </div>
              <Link href="/anunciar" className="inline-flex w-fit rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700">
                Publicar imóvel
              </Link>
            </div>
            <div className="mt-5 grid gap-5">
              {listings.map((property) => (
                <PropertyCard key={property.id} property={property} variant="horizontal" />
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
