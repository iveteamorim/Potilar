'use client';

import { useEffect, useState } from 'react';
import type { PriceInsight } from '@/lib/priceIntelligence';
import PrecoJustoRNCard from '@/components/PrecoJustoRNCard';
import { isCommercialPropertyType } from '@/lib/propertyTypes';

type Props = {
  price: string;
  transaction: string;
  propertyType: string;
  location: string;
  neighborhood: string;
  bedrooms: string;
  bathrooms?: string;
  parking?: string;
  areaSqm?: string;
  lat?: number;
  lng?: number;
  isFurnished?: boolean;
  isPetFriendly?: boolean;
  imageCount?: number;
  videoUrl?: string;
  tourUrl?: string;
  featureCount?: number;
  descriptionLength?: number;
};

export default function PrecoJustoRNAdvisor({
  price,
  transaction,
  propertyType,
  location,
  neighborhood,
  bedrooms,
  bathrooms,
  parking,
  areaSqm,
  lat,
  lng,
  isFurnished,
  isPetFriendly,
  imageCount,
  videoUrl,
  tourUrl,
  featureCount,
  descriptionLength
}: Props) {
  const [insight, setInsight] = useState<PriceInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const numericPrice = Number(price.replace(/\D/g, ''));
  const numericAreaSqm = Number(areaSqm);

  useEffect(() => {
    if (!numericPrice || !numericAreaSqm || numericAreaSqm <= 0 || !transaction || !propertyType || !location.trim()) {
      setInsight(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/preco-justo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            price: numericPrice,
            transaction,
            propertyType,
            location,
            neighborhood: neighborhood.trim() || null,
            bedrooms: Number(bedrooms) || undefined,
            bathrooms: Number(bathrooms) || undefined,
            parking: Number(parking) || undefined,
            areaSqm: numericAreaSqm,
            lat: lat || undefined,
            lng: lng || undefined,
            isFurnished: Boolean(isFurnished),
            isPetFriendly: Boolean(isPetFriendly),
            imageCount: imageCount || undefined,
            videoUrl: videoUrl?.trim() || null,
            tourUrl: tourUrl?.trim() || null,
            featureCount: featureCount || undefined,
            descriptionLength: descriptionLength || undefined
          })
        });

        const payload = await response.json();
        if (response.ok) {
          setInsight(payload.insight as PriceInsight);
        } else {
          setInsight(null);
        }
      } catch {
        if (!controller.signal.aborted) setInsight(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 700);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    numericPrice,
    numericAreaSqm,
    transaction,
    propertyType,
    location,
    neighborhood,
    bedrooms,
    bathrooms,
    parking,
    lat,
    lng,
    isFurnished,
    isPetFriendly,
    imageCount,
    videoUrl,
    tourUrl,
    featureCount,
    descriptionLength
  ]);

  if (isCommercialPropertyType(propertyType)) {
    return null;
  }

  if (!numericPrice || !numericAreaSqm || numericAreaSqm <= 0 || !transaction || !propertyType || !location.trim()) {
    return null;
  }

  if (loading && !insight) {
    return <div className="glass-card h-36 animate-pulse" />;
  }

  if (!insight) return null;

  if (insight.verdict === 'insufficient_data' || insight.medianPrice <= 0) {
    return null;
  }

  return <PrecoJustoRNCard insight={insight} compact />;
}
