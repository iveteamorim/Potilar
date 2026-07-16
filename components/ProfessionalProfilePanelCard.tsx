import { BadgeCheck, Languages, ShieldCheck } from 'lucide-react';
import ProfilePhotoQuickEdit from '@/components/ProfilePhotoQuickEdit';

type Props = {
  displayName: string;
  accountLabel: string;
  roleLabel: string;
  profileImageUrl: string;
  creci?: string | null;
  creciVerified: boolean;
  languages: string[];
  bio: string;
  publicSlug?: string;
  updateAction: (formData: FormData) => Promise<void>;
};

export default function ProfessionalProfilePanelCard({
  displayName,
  accountLabel,
  roleLabel,
  profileImageUrl,
  creci,
  creciVerified,
  languages,
  bio,
  publicSlug,
  updateAction
}: Props) {
  return (
    <section className="overflow-hidden border border-sand-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-sand-200 px-5 py-4 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Pr{'\u00e9'}via da p{'\u00e1'}gina p{'\u00fa'}blica</h3>
        <p className="mt-0.5 text-sm text-slate-500">Esses dados aparecem para visitantes.</p>
      </div>

      <div className="flex items-start gap-4 border-b border-sand-200 px-5 py-5 dark:border-slate-800 sm:gap-5">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-sand-200 bg-white shadow-sm dark:border-slate-700">
          <img src={profileImageUrl} alt={`Foto de ${displayName}`} className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">{displayName}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-300">{roleLabel}</p>
            </div>
            <ProfilePhotoQuickEdit publicSlug={publicSlug} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-semibold text-ocean-800">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {accountLabel} Potilar
            </span>
            {creci && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  creciVerified
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200'
                    : 'bg-ocean-50 text-ocean-800 dark:bg-ocean-950/40 dark:text-ocean-100'
                }`}
                title={creciVerified ? creci : `${creci} — aguardando verificação pela Potilar`}
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {creciVerified ? 'CRECI verificado' : 'CRECI informado'}
              </span>
            )}
          </div>

          <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <Languages className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            {languages.join(' \u2022 ')}
          </p>
        </div>
      </div>

      <form action={updateAction} className="space-y-4 px-5 py-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nome p{'\u00fa'}blico</span>
          <input
            name="company_name"
            defaultValue={displayName}
            className="mt-2 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">CRECI</span>
          <input
            name="creci"
            defaultValue={creci || ''}
            placeholder="Ex: CRECI-RN 0000-F"
            className="mt-2 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Idiomas</span>
          <input
            name="languages"
            defaultValue={languages.join(', ')}
            placeholder={'Portugu\u00eas, Ingl\u00eas'}
            className="mt-2 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sobre</span>
          <textarea
            name="bio"
            defaultValue={bio}
            rows={3}
            placeholder={'Conte em poucas linhas como voc\u00ea atua no RN.'}
            className="mt-2 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-ocean-800"
          >
            Salvar altera{'\u00e7'}{'\u00f5'}es
          </button>
        </div>
      </form>
    </section>
  );
}
