/** Nivel de confianca dos dados usados no Preco Justo RN. */
export type PriceDataTier =
  | 'potilar_listings'
  | 'fipezap_city'
  | 'fipezap_neighborhood'
  | 'calibrated_estimate'
  | 'land_estimate'
  | 'generic_estimate'
  | 'none';

export function getDataTierLabel(tier: PriceDataTier, sampleCount?: number) {
  switch (tier) {
    case 'potilar_listings':
      return sampleCount
        ? `Media de ${sampleCount} anuncio${sampleCount === 1 ? '' : 's'} na Potilar`
        : 'Anuncios publicados na Potilar';
    case 'fipezap_city':
      return 'Indice FipeZAP (Natal)';
    case 'fipezap_neighborhood':
      return 'FipeZAP Natal + ajuste de bairro';
    case 'calibrated_estimate':
      return 'Estimativa Potilar (modelo regional)';
    case 'land_estimate':
      return 'Estimativa Potilar (terrenos)';
    case 'generic_estimate':
      return 'Sem dados confiaveis';
    default:
      return 'Sem referencia';
  }
}

export function getConfidenceLabel(tier: PriceDataTier) {
  switch (tier) {
    case 'potilar_listings':
      return 'Anuncios reais';
    case 'fipezap_city':
      return 'Indice oficial';
    case 'fipezap_neighborhood':
      return 'Indice + bairro';
    case 'calibrated_estimate':
    case 'land_estimate':
      return 'Estimativa';
    default:
      return 'Indisponivel';
  }
}

/** So exibimos comparacao quando ha base minimamente defensavel. */
export function canShowPriceComparison(tier: PriceDataTier) {
  return tier !== 'generic_estimate' && tier !== 'none';
}

export function isOfficialMarketData(tier: PriceDataTier) {
  return tier === 'fipezap_city' || tier === 'fipezap_neighborhood';
}
