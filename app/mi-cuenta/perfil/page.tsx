import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProfileEditorForm from '@/components/ProfileEditorForm';
import { createClient } from '@/lib/supabase/server';
import { buildPublicProfileSlug, getPublicProfilePath } from '@/lib/publicProfile';

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

  const publicSlug = profile?.public_slug || buildPublicProfileSlug(profile?.full_name ?? 'anunciante', user.id);

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/mi-cuenta" className="text-sm font-semibold text-ocean-700">
            Voltar para Minha conta
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Perfil publico</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Corretores e imobiliarias podem ter uma pagina com todos os anuncios ativos.
          </p>
          {profile?.public_slug && (
            <p className="mt-3 text-sm font-semibold text-ocean-700">
              Sua pagina:{' '}
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
