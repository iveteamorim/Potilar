export const PROPERTY_TYPES = [
  'Casa',
  'Terreno',
  'Apartamento',
  'Kitnet/Conjugado',
  'Ponto comercial'
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const COMMERCIAL_SUBTYPES = [
  'Loja',
  'Sala comercial',
  'Galpão',
  'Ponto de rua',
  'Quiosque',
  'Prédio comercial',
  'Outro'
] as const;

export const COMMERCIAL_FEATURES = [
  'Vão livre',
  'Térreo',
  'Esquina',
  'Fachada para rua',
  'Rua movimentada',
  'Banheiro',
  'Copa',
  'Depósito',
  'Estacionamento',
  'Carga e descarga',
  'Acessibilidade'
] as const;

export function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value);
}

export function isLandPropertyType(type: string) {
  return type === 'Terreno';
}

export function isCommercialPropertyType(type: string) {
  return type === 'Ponto comercial';
}

/** Imóveis com quartos, banheiros, pet e mobiliado. */
export function usesResidentialLayoutFields(type: string) {
  return !isLandPropertyType(type) && !isCommercialPropertyType(type);
}

export function allowsSeasonalTransaction(type: string) {
  return usesResidentialLayoutFields(type);
}
