import { buildPriceInsight, priceInsightInputFromProperty } from '@/lib/priceIntelligence';
import type { Property } from '@/data/properties';
import PrecoJustoRNCard from '@/components/PrecoJustoRNCard';
import PublicPrecoJustoSignal from '@/components/PublicPrecoJustoSignal';
import { isCommercialPropertyType } from '@/lib/propertyTypes';
import { selectPrecoJustoPresentation } from '@/lib/publicPriceSignal';
import { createClient } from '@/lib/supabase/server';

async function getCurrentUserId() {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export default async function ListingPrecoJustoSection({ property }: { property: Property }) {
  if (isCommercialPropertyType(property.propertyType)) return null;
  if (!property.areaSqm || property.areaSqm <= 0 || !property.price) return null;

  const insight = await buildPriceInsight(priceInsightInputFromProperty(property));

  if (insight.verdict === 'insufficient_data' || insight.medianPrice <= 0) {
    return null;
  }

  const userId = await getCurrentUserId();
  const presentation = selectPrecoJustoPresentation(userId, property.ownerId, insight);

  if (presentation.kind === 'owner') {
    return <PrecoJustoRNCard insight={presentation.insight} />;
  }

  if (presentation.kind === 'public') {
    return <PublicPrecoJustoSignal signal={presentation.signal} />;
  }

  return null;
}
