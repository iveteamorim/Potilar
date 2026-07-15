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
        ? `Média de ${sampleCount} anúncio${sampleCount === 1 ? '' : 's'} na Potilar`
        : 'Anúncios publicados na Potilar';
    case 'fipezap_city':
      return 'Índice FipeZAP (Natal)';
    case 'fipezap_neighborhood':
      return 'FipeZAP Natal + ajuste de bairro';
    case 'calibrated_estimate':
      return 'Estimativa Potilar (modelo regional)';
    case 'land_estimate':
      return 'Estimativa Potilar (terrenos)';
    case 'generic_estimate':
      return 'Sem dados confiáveis';
    default:
      return 'Sem referência';
  }
}

export function getConfidenceLabel(tier: PriceDataTier) {
  switch (tier) {
    case 'potilar_listings':
      return 'Anúncios reais';
    case 'fipezap_city':
      return 'Índice oficial';
    case 'fipezap_neighborhood':
      return 'Índice + bairro';
    case 'calibrated_estimate':
    case 'land_estimate':
      return 'Estimativa';
    default:
      return 'Indisponível';
  }
}

/** So exibimos comparacao quando ha base minimamente defensavel. */
export function canShowPriceComparison(tier: PriceDataTier) {
  return tier !== 'generic_estimate' && tier !== 'none';
}

export function isOfficialMarketData(tier: PriceDataTier) {
  return tier === 'fipezap_city' || tier === 'fipezap_neighborhood';
}
