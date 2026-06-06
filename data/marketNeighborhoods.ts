/**
 * Multiplicadores de preco por bairro em relacao a media da cidade.
 * Quando o cron atualiza FipeZAP (Natal), os valores dos bairros recalculam automaticamente.
 *
 * Fontes para os multiplicadores: FipeZAP + analises de mercado online (portais, Larya, IPD).
 */

export type NeighborhoodMultiplier = {
  neighborhood: string;
  city: string;
  saleMultiplier: number;
  rentMultiplier: number;
  source: string;
};

/** Natal/RN - bairros com referencia publica de mercado online. */
export const NATAL_NEIGHBORHOOD_MULTIPLIERS: NeighborhoodMultiplier[] = [
  { neighborhood: 'Tirol', city: 'Natal', saleMultiplier: 1.27, rentMultiplier: 1.28, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Petropolis', city: 'Natal', saleMultiplier: 1.22, rentMultiplier: 1.23, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Lagoa Nova', city: 'Natal', saleMultiplier: 1.18, rentMultiplier: 1.2, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Capim Macio', city: 'Natal', saleMultiplier: 1.14, rentMultiplier: 1.15, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Ponta Negra', city: 'Natal', saleMultiplier: 0.99, rentMultiplier: 1.11, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Via Costeira', city: 'Natal', saleMultiplier: 1.05, rentMultiplier: 1.18, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Neopolis', city: 'Natal', saleMultiplier: 1.02, rentMultiplier: 1.05, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Pitimbu', city: 'Natal', saleMultiplier: 1.08, rentMultiplier: 1.1, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Quintas', city: 'Natal', saleMultiplier: 0.95, rentMultiplier: 0.98, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Morro Branco', city: 'Natal', saleMultiplier: 0.95, rentMultiplier: 0.96, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Candelaria', city: 'Natal', saleMultiplier: 0.93, rentMultiplier: 0.94, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Lagoa Seca', city: 'Natal', saleMultiplier: 0.92, rentMultiplier: 0.93, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Pajucara', city: 'Natal', saleMultiplier: 0.9, rentMultiplier: 0.92, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Alecrim', city: 'Natal', saleMultiplier: 0.88, rentMultiplier: 0.89, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Nordeste', city: 'Natal', saleMultiplier: 0.88, rentMultiplier: 0.9, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Nova Descoberta', city: 'Natal', saleMultiplier: 0.87, rentMultiplier: 0.88, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Rocas', city: 'Natal', saleMultiplier: 0.86, rentMultiplier: 0.87, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Nossa Senhora de Nazare', city: 'Natal', saleMultiplier: 0.85, rentMultiplier: 0.86, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Igapo', city: 'Natal', saleMultiplier: 0.84, rentMultiplier: 0.85, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Barro Vermelho', city: 'Natal', saleMultiplier: 0.83, rentMultiplier: 0.84, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Dix Sept Rosado', city: 'Natal', saleMultiplier: 0.82, rentMultiplier: 0.83, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Santos Reis', city: 'Natal', saleMultiplier: 0.8, rentMultiplier: 0.82, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Cajazeiras', city: 'Natal', saleMultiplier: 0.79, rentMultiplier: 0.8, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Mae Luiza', city: 'Natal', saleMultiplier: 0.78, rentMultiplier: 0.8, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Salgado', city: 'Natal', saleMultiplier: 0.75, rentMultiplier: 0.77, source: 'Mercado online / FipeZAP Natal' },
  { neighborhood: 'Redinha', city: 'Natal', saleMultiplier: 0.72, rentMultiplier: 0.74, source: 'Mercado online / FipeZAP Natal' }
];

/** Parnamirim/RN - bairros com base em portais (IPD / anuncios online). */
export const PARNAMIRIM_NEIGHBORHOOD_MULTIPLIERS: NeighborhoodMultiplier[] = [
  { neighborhood: 'Centro', city: 'Parnamirim', saleMultiplier: 0.7, rentMultiplier: 0.72, source: 'Portais imobiliarios / regiao metropolitana' },
  { neighborhood: 'Monte Castelo', city: 'Parnamirim', saleMultiplier: 0.68, rentMultiplier: 0.7, source: 'Portais imobiliarios / regiao metropolitana' },
  { neighborhood: 'Rosa dos Ventos', city: 'Parnamirim', saleMultiplier: 0.72, rentMultiplier: 0.74, source: 'Portais imobiliarios / regiao metropolitana' },
  { neighborhood: 'Emaus', city: 'Parnamirim', saleMultiplier: 0.65, rentMultiplier: 0.67, source: 'Portais imobiliarios / regiao metropolitana' },
  { neighborhood: 'Cajupiranga', city: 'Parnamirim', saleMultiplier: 0.64, rentMultiplier: 0.66, source: 'Portais imobiliarios / regiao metropolitana' },
  { neighborhood: 'Nova Esperanca', city: 'Parnamirim', saleMultiplier: 0.59, rentMultiplier: 0.62, source: 'Portais imobiliarios (IPD)' },
  { neighborhood: 'Nova Parnamirim', city: 'Parnamirim', saleMultiplier: 0.61, rentMultiplier: 0.63, source: 'Portais imobiliarios (IPD)' },
  { neighborhood: 'Passagem de Areia', city: 'Parnamirim', saleMultiplier: 0.66, rentMultiplier: 0.68, source: 'Portais imobiliarios / regiao metropolitana' },
  { neighborhood: 'Vida Nova', city: 'Parnamirim', saleMultiplier: 0.63, rentMultiplier: 0.65, source: 'Portais imobiliarios / regiao metropolitana' }
];

/** Mossoro/RN - bairros com base em portais e imobiliarias locais. */
export const MOSSORO_NEIGHBORHOOD_MULTIPLIERS: NeighborhoodMultiplier[] = [
  { neighborhood: 'Centro', city: 'Mossoro', saleMultiplier: 1.12, rentMultiplier: 1.08, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Nova Betania', city: 'Mossoro', saleMultiplier: 1.08, rentMultiplier: 1.05, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Bela Vista', city: 'Mossoro', saleMultiplier: 1.06, rentMultiplier: 1.03, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Boa Vista', city: 'Mossoro', saleMultiplier: 1.05, rentMultiplier: 1.02, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Alto de Sao Manoel', city: 'Mossoro', saleMultiplier: 0.94, rentMultiplier: 0.93, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Ilha de Santa Luzia', city: 'Mossoro', saleMultiplier: 0.92, rentMultiplier: 0.91, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Santo Antonio', city: 'Mossoro', saleMultiplier: 0.9, rentMultiplier: 0.89, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Presidente Costa e Silva', city: 'Mossoro', saleMultiplier: 0.96, rentMultiplier: 0.95, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Alto do Sumare', city: 'Mossoro', saleMultiplier: 0.88, rentMultiplier: 0.87, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Sumare', city: 'Mossoro', saleMultiplier: 0.85, rentMultiplier: 0.84, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Aeroporto', city: 'Mossoro', saleMultiplier: 0.86, rentMultiplier: 0.85, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Doze Anos', city: 'Mossoro', saleMultiplier: 0.82, rentMultiplier: 0.81, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Dix Sept Rosado', city: 'Mossoro', saleMultiplier: 0.8, rentMultiplier: 0.79, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Abolicao', city: 'Mossoro', saleMultiplier: 0.77, rentMultiplier: 0.78, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Bom Jardim', city: 'Mossoro', saleMultiplier: 0.78, rentMultiplier: 0.76, source: 'Portais imobiliarios Mossoro' },
  { neighborhood: 'Pintos', city: 'Mossoro', saleMultiplier: 0.74, rentMultiplier: 0.73, source: 'Portais imobiliarios Mossoro' }
];

export const ALL_NEIGHBORHOOD_MULTIPLIERS: NeighborhoodMultiplier[] = [
  ...NATAL_NEIGHBORHOOD_MULTIPLIERS,
  ...PARNAMIRIM_NEIGHBORHOOD_MULTIPLIERS,
  ...MOSSORO_NEIGHBORHOOD_MULTIPLIERS
];
