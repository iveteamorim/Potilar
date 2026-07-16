import { haversineKm } from '@/lib/geoDistance';
import { isKnownCityCenterCoordinate } from '@/lib/locationCoordinates';

const COAST_ANCHORS: Array<{ label: string; lat: number; lng: number }> = [
  { label: 'Ponta Negra', lat: -5.8834, lng: -35.1802 },
  { label: 'Pipa', lat: -6.2272, lng: -35.0449 },
  { label: 'Via Costeira', lat: -5.8517, lng: -35.1981 }
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getGeoPriceAdjustment(input: {
  lat?: number;
  lng?: number;
  location: string;
  neighborhood?: string | null;
  transaction: string;
}) {
  const text = normalizeText(`${input.location} ${input.neighborhood ?? ''}`);
  let adjustment = 0;

  if (['ponta negra', 'via costeira', 'pipa', 'touros', 'maxaranguape', 'baia formosa'].some((token) => text.includes(token))) {
    adjustment += input.transaction === 'Compra' ? 0.04 : 0.03;
  }

  if (Number.isFinite(input.lat) && Number.isFinite(input.lng) && !isKnownCityCenterCoordinate(input.lat!, input.lng!)) {
    const nearestCoastKm = COAST_ANCHORS.reduce((min, anchor) => {
      const distance = haversineKm(input.lat!, input.lng!, anchor.lat, anchor.lng);
      return Math.min(min, distance);
    }, Number.POSITIVE_INFINITY);

    if (nearestCoastKm <= 2) adjustment += 0.03;
    else if (nearestCoastKm <= 6) adjustment += 0.015;
  }

  return Math.min(0.06, Math.max(-0.02, adjustment));
}

export function describeGeoAdjustment(adjustment: number) {
  if (adjustment >= 0.03) return 'Zona com demanda turística ou costeira.';
  if (adjustment > 0) return 'Localização com leve prêmio regional.';
  if (adjustment < 0) return 'Ajuste conservador por localização interior.';
  return 'Sem ajuste geográfico relevante.';
}
