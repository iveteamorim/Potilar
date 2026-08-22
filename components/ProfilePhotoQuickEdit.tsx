'use client';

import { useEffect, useRef, useState } from 'react';
import { Move, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  publicSlug?: string;
};

type Point = {
  x: number;
  y: number;
};

const CROP_SIZE = 600;

export default function ProfilePhotoQuickEdit({ publicSlug }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<Point | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState('');
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function openFile(file?: File | null) {
    if (!file || !file.type.startsWith('image/')) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setImageSize({ width: 1, height: 1 });
    setStatus('');
  }

  function getRenderedSize(frameSize: number) {
    const aspect = imageSize.width / imageSize.height;
    if (aspect >= 1) {
      return {
        width: frameSize * aspect * scale,
        height: frameSize * scale
      };
    }

    return {
      width: frameSize * scale,
      height: (frameSize / aspect) * scale
    };
  }

  function closeEditor() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setStatus('');
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX - position.x, y: event.clientY - position.y };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    setPosition({
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y
    });
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  async function buildCroppedBlob() {
    const image = imageRef.current;
    if (!image) return null;

    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const context = canvas.getContext('2d');
    if (!context) return null;

    const frameSize = 256;
    const { width: renderedWidth, height: renderedHeight } = getRenderedSize(frameSize);
    const sourceX = ((renderedWidth - frameSize) / 2 - position.x) * (image.naturalWidth / renderedWidth);
    const sourceY = ((renderedHeight - frameSize) / 2 - position.y) * (image.naturalHeight / renderedHeight);
    const sourceWidth = frameSize * (image.naturalWidth / renderedWidth);
    const sourceHeight = frameSize * (image.naturalHeight / renderedHeight);

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      CROP_SIZE,
      CROP_SIZE
    );

    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  }

  async function saveCrop() {
    if (!previewUrl || !publicSlug) return;
    setUploading(true);
    setStatus('');

    try {
      const blob = await buildCroppedBlob();
      if (!blob) {
        setStatus('Nao foi possivel recortar a imagem.');
        return;
      }

      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('Entre na conta para salvar a imagem.');
        return;
      }

      const path = `${user.id}/profile-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('professional-profile-images')
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
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
          profile_image_url: data.publicUrl
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(payload.error ?? 'Nao foi possivel salvar a foto.');
        return;
      }

      closeEditor();
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
          openFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Enquadrar foto</h2>
                <p className="mt-1 text-sm text-slate-500">Arraste a imagem para escolher o foco.</p>
              </div>
              <button type="button" onClick={closeEditor} className="rounded-full p-2 text-slate-500 hover:bg-sand-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const rendered = getRenderedSize(256);

              return (
            <div
              className="relative mx-auto mt-5 h-64 w-64 touch-none cursor-move overflow-hidden rounded-xl bg-sand-100"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Previa do recorte"
                draggable={false}
                onLoad={(event) =>
                  setImageSize({
                    width: event.currentTarget.naturalWidth || 1,
                    height: event.currentTarget.naturalHeight || 1
                  })
                }
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: `${rendered.width}px`,
                  height: `${rendered.height}px`,
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
                }}
              />
              <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-white/85" />
              <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white">
                <Move className="h-3.5 w-3.5" />
                Arraste
              </div>
            </div>
              );
            })()}

            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Zoom
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </label>

            {status && <p className="mt-3 text-sm font-semibold text-red-600">{status}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={closeEditor} className="rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar
              </button>
              <button type="button" onClick={saveCrop} disabled={uploading} className="rounded-xl bg-ocean-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {uploading ? 'Salvando...' : 'Salvar foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
