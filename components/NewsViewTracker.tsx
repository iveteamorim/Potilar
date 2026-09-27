'use client';

import { useEffect } from 'react';
import type { NewsShareChannel } from '@/lib/newsAnalytics';

type Props = {
  slug: string;
  shareChannel?: NewsShareChannel | null;
};

export default function NewsViewTracker({ slug, shareChannel = null }: Props) {
  useEffect(() => {
    if (!slug) return;

    fetch('/api/news/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        kind: 'view',
        shareChannel: shareChannel ?? null
      })
    }).catch(() => {
      // Tracking is best-effort.
    });
  }, [slug, shareChannel]);

  return null;
}
