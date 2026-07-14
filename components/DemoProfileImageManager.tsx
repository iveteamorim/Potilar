'use client';

import { useMemo, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  displayName: string;
  profileImageUrl: string;
  bannerImageUrl: string;
  publicSlug?: string;
  editableLabel?: string;
};

function useLocalImage(initialUrl: string) {
  const [url, setUrl] = useState(initialUrl);

  function handleFile(file?: File | null) {
    if (!file || !file.type.startsWith('image/')) return;
    setUrl(URL.createObjectURL(file));
  }

  return { url, setUrl, handleFile };
}

export default function DemoProfileImageManager({
  displayName,
  profileImageUrl,
  bannerImageUrl,
  publicSlug,
  editableLabel = 'Editavel'
}: Props) {
  const router = useRouter();
  const profile = useLocalImage(profileImageUrl);
  const banner = useLocalImage(bannerImageUrl);
  const profileInitial = useMemo(() => profileImageUrl, [profileImageUrl]);
  const bannerInitial = useMemo(() => bannerImageUrl, [bannerImageUrl]);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState<'profile' | 'banner' | null>(null);

  async function uploadProfileImage(file: File | null | undefined, kind: 'profile' | 'banner') {
    if (!file || !file.type.startsWith('image/')) return;

    const localUrl = URL.createObjectURL(file);
    if (kind === 'profile') profile.setUrl(localUrl);
    if (kind === 'banner') banner.setUrl(localUrl);

    if (!publicSlug) return;

    setUploading(kind);
    setStatus('');

    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('Entre na conta para salvar a imagem.');
        return;
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${kind}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('professional-profile-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        setStatus(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('professional-profile-images').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const response = await fetch('/api/profile/public', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_slug: publicSlug,
          ...(kind === 'profile' ? { profile_image_url: publicUrl } : { banner_image_url: publicUrl })
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatus(payload.error ?? 'Nao foi possivel salvar a imagem.');
        return;
      }

      setStatus('Imagem salva.');
      router.refresh();
    } finally {
      setUploading(null);
    }
  }

  return (
    <section className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Imagens do perfil</h3>
          <p className="mt-1 text-sm text-slate-500">Foto/logo e capa que aparecem na pagina publica.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-800">
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          {editableLabel}
        </span>
      </div>

      <div className="mt-5 overflow-hidden border border-sand-200 dark:border-slate-800">
        <div className="relative h-44 bg-slate-100 sm:h-56">
          <img src={banner.url} alt={`Capa de ${displayName}`} className="h-full w-full object-cover" />
          <label className="absolute bottom-4 right-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-sand-50">
            <Upload className="h-4 w-4" aria-hidden="true" />
            {uploading === 'banner' ? 'Salvando...' : 'Trocar capa'}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadProfileImage(event.target.files?.[0], 'banner')} />
          </label>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="h-28 w-28 shrink-0 overflow-hidden border border-sand-200 bg-white shadow-sm dark:border-slate-700 dark:bg-white">
              <img src={profile.url} alt={`Foto de ${displayName}`} className="h-full w-full object-contain" />
            </div>
            <div className="pb-1">
              <p className="text-sm font-semibold text-slate-500">Imagem principal</p>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">{displayName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {uploading === 'profile' ? 'Salvando...' : 'Trocar foto/logo'}
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadProfileImage(event.target.files?.[0], 'profile')} />
            </label>
            <button
              type="button"
              onClick={() => {
                profile.setUrl(profileInitial);
                banner.setUrl(bannerInitial);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-sand-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restaurar
            </button>
          </div>
        </div>
        {status && <p className="px-5 pb-5 text-sm font-semibold text-ocean-700">{status}</p>}
      </div>
    </section>
  );
}
