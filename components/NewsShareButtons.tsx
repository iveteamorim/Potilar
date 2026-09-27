'use client';

import ShareButtons from '@/components/ShareButtons';
import { shareActionToKind, type NewsShareAction, type NewsSurface } from '@/lib/newsAnalytics';

type Props = {
  slug: string;
  title: string;
  url: string;
  surface: NewsSurface;
  variant: 'action' | 'icon';
  className?: string;
};

function trackNewsShare(slug: string, action: NewsShareAction, surface: NewsSurface) {
  fetch('/api/news/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      kind: shareActionToKind(action),
      surface
    })
  }).catch(() => {
    // Tracking is best-effort.
  });
}

export default function NewsShareButtons({ slug, title, url, surface, variant, className }: Props) {
  return (
    <ShareButtons
      title={title}
      url={url}
      variant={variant}
      className={className}
      attribution
      onShareAction={(action) => {
        trackNewsShare(slug, action, surface);
      }}
    />
  );
}
