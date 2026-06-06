'use client';

import { useEffect } from 'react';

type Props = {
  listingId: string;
};

export default function ListingViewTracker({ listingId }: Props) {
  useEffect(() => {
    if (!listingId) return;

    fetch(`/api/listings/${listingId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' })
    }).catch(() => {
      // Tracking is best-effort.
    });
  }, [listingId]);

  return null;
}
