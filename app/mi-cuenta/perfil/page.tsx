import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProfileEditorForm from '@/components/ProfileEditorForm';
import { createClient } from '@/lib/supabase/server';
import { buildProfessionalProfileSlug, getPublicProfilePath, isProfessionalAccountType } from '@/lib/publicProfile';

export default async function PerfilPublicoPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta/perfil');

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name,company_name,bio,public_slug,account_type,phone,creci,creci_verified')
    .eq('id', user.id)
    .single();

  if (profileError) {
    const fallback = await supabase
      .from('profiles')
      .select('full_name,company_name,bio,public_slug,account_type,phone,creci')
      .eq('id', user.id)
      .single();
    profile = fallback.data ? { ...fallback.data, creci_verified: false } : null;
  }

  if (profile && isProfessionalAccountType(profile.account_type) && !profile.public_slug) {
    const generatedSlug = buildProfessionalProfileSlug(profile, user.id);
    const { error: profileSlugError } = await supabase
      .from('profiles')
      .update({
        public_slug: generatedSlug,
        company_name: profile.account_type === 'imobiliaria' ? profile.company_name || profile.full_name || null : profile.company_name || null
      })
      .eq('id', user.id);

    if (!profileSlugError) {
      profile = { ...profile, public_slug: generatedSlug };
    }
  }

  const publicSlug = profile?.public_slug || buildProfessionalProfileSlug(profile ?? {}, user.id);

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/mi-cuenta" className="text-sm font-semibold text-ocean-700">
            Voltar para Minha conta
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Perfil público</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Corretores e imobiliárias podem ter uma página com todos os anúncios ativos.
          </p>
          {profile?.public_slug && (
            <p className="mt-3 text-sm font-semibold text-ocean-700">
              Sua página:{' '}
              <Link href={getPublicProfilePath(profile.public_slug)} className="underline">
                {getPublicProfilePath(profile.public_slug)}
              </Link>
            </p>
          )}
        </div>
        <ProfileEditorForm
          fullName={profile?.full_name ?? ''}
          companyName={profile?.company_name ?? ''}
          bio={profile?.bio ?? ''}
          publicSlug={publicSlug}
          accountType={profile?.account_type ?? 'particular'}
          creci={profile?.creci ?? ''}
          creciVerified={Boolean(profile?.creci_verified)}
          userId={user.id}
        />
      </div>
    </main>
  );
}
