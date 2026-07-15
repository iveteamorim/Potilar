'use client';

import { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  publicSlug?: string;
};

export default function ProfilePhotoQuickEdit({ publicSlug }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file?: File | null) {
    if (!file || !file.type.startsWith('image/') || !publicSlug) return;

    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/profile-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('professional-profile-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) return;

      const { data } = supabase.storage.from('professional-profile-images').getPublicUrl(path);
      await fetch('/api/profile/public', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_slug: publicSlug,
          profile_image_url: data.publicUrl
        })
      });

      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || !publicSlug}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sand-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-ocean-300 hover:text-ocean-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-ocean-800 dark:hover:text-ocean-300"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        {uploading ? 'Salvando...' : 'Editar foto'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </>
  );
}
