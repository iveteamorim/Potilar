import { buildPriceInsight, priceInsightInputFromProperty } from '@/lib/priceIntelligence';
import type { Property } from '@/data/properties';
import PrecoJustoRNCard from '@/components/PrecoJustoRNCard';
import { isCommercialPropertyType } from '@/lib/propertyTypes';

export default async function ListingPrecoJustoSection({ property }: { property: Property }) {
  if (isCommercialPropertyType(property.propertyType)) return null;
  if (!property.areaSqm || property.areaSqm <= 0 || !property.price) return null;

  const insight = await buildPriceInsight(priceInsightInputFromProperty(property));

  if (insight.verdict === 'insufficient_data' || insight.medianPrice <= 0) {
    return null;
  }

  return <PrecoJustoRNCard insight={insight} />;
}
