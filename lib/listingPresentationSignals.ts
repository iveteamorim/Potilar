import type { Property } from '@/data/properties';

export type ListingPresentationInput = {
  imageCount?: number;
  videoUrl?: string | null;
  tourUrl?: string | null;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  isFurnished?: boolean;
  isPetFriendly?: boolean;
  featureCount?: number;
  descriptionLength?: number;
};

export type ListingPresentationScore = {
  score: number;
  priceAdjustment: number;
  highlights: string[];
};

export function scoreListingPresentation(input: ListingPresentationInput): ListingPresentationScore {
  let score = 0;
  const highlights: string[] = [];

  const images = Number(input.imageCount ?? 0);
  if (images >= 10) {
    score += 25;
    highlights.push('10+ fotos');
  } else if (images >= 6) {
    score += 18;
    highlights.push('fotos completas');
  } else if (images >= 3) {
    score += 8;
  }

  if (input.tourUrl?.trim()) {
    score += 20;
    highlights.push('tour 3D');
  }

  if (input.videoUrl?.trim()) {
    score += 10;
    highlights.push('vídeo');
  }

  if ((input.areaSqm ?? 0) > 0) score += 12;
  if ((input.bedrooms ?? 0) > 0) score += 5;
  if ((input.bathrooms ?? 0) > 0) score += 5;
  if ((input.parking ?? 0) > 0) score += 4;
  if (input.isFurnished) {
    score += 6;
    highlights.push('mobiliado');
  }
  if (input.isPetFriendly) {
    score += 4;
    highlights.push('aceita pet');
  }

  const features = Number(input.featureCount ?? 0);
  if (features >= 3) score += 8;

  const descriptionLength = Number(input.descriptionLength ?? 0);
  if (descriptionLength >= 280) score += 10;
  else if (descriptionLength >= 120) score += 5;

  const capped = Math.min(100, score);
  const priceAdjustment =
    capped >= 80 ? 0.03 : capped >= 55 ? 0.01 : capped < 35 ? -0.02 : 0;

  return { score: capped, priceAdjustment, highlights };
}

export function presentationFromProperty(property: Property): ListingPresentationInput {
  return {
    imageCount: property.images.length,
    videoUrl: property.videoUrl,
    tourUrl: property.tourUrl,
    areaSqm: property.areaSqm,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking: property.parking,
    isFurnished: property.isFurnished,
    isPetFriendly: property.isPetFriendly,
    featureCount: property.features.length,
    descriptionLength: property.description.length
  };
}
