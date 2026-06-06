'use client';

import { useEffect, useState } from 'react';
import type { PriceInsight } from '@/lib/priceIntelligence';
import PrecoJustoRNCard from '@/components/PrecoJustoRNCard';

type Props = {
  price: string;
  transaction: string;
  propertyType: string;
  location: string;
  neighborhood: string;
  bedrooms: string;
  areaSqm?: string;
};

export default function PrecoJustoRNAdvisor({
  price,
  transaction,
  propertyType,
  location,
  neighborhood,
  bedrooms,
  areaSqm
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
            areaSqm: numericAreaSqm
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
  }, [numericPrice, numericAreaSqm, transaction, propertyType, location, neighborhood, bedrooms]);

  if (!numericPrice || !numericAreaSqm || numericAreaSqm <= 0 || !transaction || !propertyType || !location.trim()) {
    return null;
  }

  if (loading && !insight) {
    return <div className="glass-card h-36 animate-pulse" />;
  }

  if (!insight || insight.verdict === 'insufficient_data') return null;

  return <PrecoJustoRNCard insight={insight} compact />;
}
