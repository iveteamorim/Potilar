'use client';

import { useMemo, useState } from 'react';
import { Camera, RotateCcw, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  displayName: string;
  bannerImageUrl: string;
  publicSlug?: string;
  editableLabel?: string;
};

export default function DemoProfileImageManager({
  displayName,
  bannerImageUrl,
  publicSlug,
  editableLabel = 'Edit\u00e1vel'
}: Props) {
  const router = useRouter();
  const [bannerUrl, setBannerUrl] = useState(bannerImageUrl);
  const bannerInitial = useMemo(() => bannerImageUrl, [bannerImageUrl]);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  async function uploadBanner(file: File | null | undefined) {
    if (!file || !file.type.startsWith('image/')) return;

    setBannerUrl(URL.createObjectURL(file));
    if (!publicSlug) return;

    setUploading(true);
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
      const path = `${user.id}/banner-${Date.now()}.${extension}`;
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
      const response = await fetch('/api/profile/public', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_slug: publicSlug,
          banner_image_url: data.publicUrl
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatus(payload.error ?? 'N\u00e3o foi poss\u00edvel salvar a imagem.');
        return;
      }

      setStatus('Capa salva.');
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Capa da p{'\u00e1'}gina p{'\u00fa'}blica</h3>
          <p className="mt-1 text-sm text-slate-500">
            Imagem de capa exibida no topo da vitrine. A foto principal {'\u00e9'} editada na pr{'\u00e9'}via acima.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-800">
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          {editableLabel}
        </span>
      </div>

      <div className="mt-5 overflow-hidden border border-sand-200 dark:border-slate-800">
        <div className="relative h-44 bg-slate-100 sm:h-56">
          <img src={bannerUrl} alt={`Capa de ${displayName}`} className="h-full w-full object-cover" />
          <label className="absolute bottom-4 right-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-sand-50">
            <Upload className="h-4 w-4" aria-hidden="true" />
            {uploading ? 'Salvando...' : 'Trocar capa'}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadBanner(event.target.files?.[0])} />
          </label>
        </div>

        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={() => setBannerUrl(bannerInitial)}
            className="inline-flex items-center gap-2 rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-sand-50 dark:border-slate-700 dark:text-slate-300"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Restaurar capa
          </button>
        </div>
        {status && <p className="px-5 pb-5 text-sm font-semibold text-ocean-700">{status}</p>}
      </div>
    </section>
  );
}
