import { scoreListingPresentation, type ListingPresentationInput } from '@/lib/listingPresentationSignals';

export type BrokerLevel = 'bronze' | 'prata' | 'ouro' | 'rn_elite';

export type BrokerBadge = {
  id: string;
  label: string;
};

type ListingRow = {
  status?: string | null;
  images?: string[] | null;
  video_url?: string | null;
  tour_url?: string | null;
  area_sqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  is_furnished?: boolean | null;
  is_pet_friendly?: boolean | null;
  features?: string[] | null;
  description?: string | null;
};

type ProfileRow = {
  profile_image_url?: string | null;
  creci?: string | null;
  creci_verified?: boolean | null;
  company_name?: string | null;
  bio?: string | null;
};

export type BrokerGamification = {
  score: number;
  level: BrokerLevel;
  levelLabel: string;
  badges: BrokerBadge[];
  nextTip: string;
};

const LEVELS: Array<{ min: number; level: BrokerLevel; label: string }> = [
  { min: 85, level: 'rn_elite', label: 'Elite RN' },
  { min: 65, level: 'ouro', label: 'Ouro' },
  { min: 40, level: 'prata', label: 'Prata' },
  { min: 0, level: 'bronze', label: 'Bronze' }
];

function levelFromScore(score: number) {
  return LEVELS.find((item) => score >= item.min) ?? LEVELS[LEVELS.length - 1];
}

function listingPresentationRow(listing: ListingRow): ListingPresentationInput {
  return {
    imageCount: Array.isArray(listing.images) ? listing.images.length : 0,
    videoUrl: listing.video_url,
    tourUrl: listing.tour_url,
    areaSqm: listing.area_sqm ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    parking: listing.parking ?? undefined,
    isFurnished: Boolean(listing.is_furnished),
    isPetFriendly: Boolean(listing.is_pet_friendly),
    featureCount: Array.isArray(listing.features) ? listing.features.length : 0,
    descriptionLength: listing.description?.length ?? 0
  };
}

export function computeBrokerGamification(
  listings: ListingRow[],
  profile: ProfileRow | null
): BrokerGamification {
  const approved = listings.filter((listing) => listing.status === 'approved');
  const badges: BrokerBadge[] = [];
  let score = 0;

  if (approved.length >= 1) score += 12;
  if (approved.length >= 5) score += 10;
  if (approved.length >= 15) score += 8;

  if (profile?.profile_image_url?.trim()) {
    score += 10;
    badges.push({ id: 'foto', label: 'Foto profissional' });
  }

  if (profile?.creci?.trim()) {
    score += 8;
    badges.push({ id: 'creci', label: 'CRECI informado' });
  }

  if (profile?.creci_verified) {
    score += 12;
    badges.push({ id: 'creci_ok', label: 'CRECI verificado' });
  }

  if (profile?.company_name?.trim() || profile?.bio?.trim()) {
    score += 6;
    badges.push({ id: 'perfil', label: 'Perfil completo' });
  }

  const presentationScores = approved.map((listing) => scoreListingPresentation(listingPresentationRow(listing)));
  const avgPresentation =
    presentationScores.length > 0
      ? presentationScores.reduce((sum, item) => sum + item.score, 0) / presentationScores.length
      : 0;

  score += Math.round(avgPresentation * 0.35);

  const withTour = approved.filter((listing) => listing.tour_url?.trim()).length;
  const withVideo = approved.filter((listing) => listing.video_url?.trim()).length;
  const richPhotos = approved.filter((listing) => (listing.images?.length ?? 0) >= 8).length;

  if (withTour > 0) badges.push({ id: 'tour3d', label: 'Tour 3D ativo' });
  if (withVideo > 0) badges.push({ id: 'video', label: 'Vídeo no portfólio' });
  if (richPhotos >= 2) badges.push({ id: 'fotos_pro', label: 'Anúncios com 8+ fotos' });

  const capped = Math.min(100, score);
  const { level, label } = levelFromScore(capped);

  let nextTip = 'Publique seu primeiro anúncio completo para subir de nível.';
  if (capped < 40 && approved.length > 0) {
    nextTip = 'Adicione 6+ fotos, metragem e descrição detalhada em cada anúncio.';
  } else if (withTour === 0) {
    nextTip = 'Inclua um tour virtual 3D em um imóvel destaque para ganhar mais confiança.';
  } else if (!profile?.creci_verified && profile?.creci) {
    nextTip = 'Valide seu CRECI para liberar o selo de profissional verificado.';
  } else if (capped < 65) {
    nextTip = 'Mantenha preços alinhados ao Preço Justo RN e atualize anúncios antigos.';
  } else if (capped < 85) {
    nextTip = 'Destaque imóveis premium com tour 3D e vídeo para alcançar Elite RN.';
  } else {
    nextTip = 'Você está no topo. Continue respondendo rápido e mantendo anúncios atualizados.';
  }

  return {
    score: capped,
    level,
    levelLabel: label,
    badges,
    nextTip
  };
}
