export type AiCreditPackageId = 'starter' | 'pro' | 'agency';

export type AiCreditPackage = {
  id: AiCreditPackageId;
  credits: number;
  price: number;
  label: string;
  description: string;
};

export const AI_CREDIT_PACKAGES: Record<AiCreditPackageId, AiCreditPackage> = {
  starter: {
    id: 'starter',
    credits: 10,
    price: 9.9,
    label: '10 creditos',
    description: 'Ideal para testar descricoes profissionais.'
  },
  pro: {
    id: 'pro',
    credits: 30,
    price: 24.9,
    label: '30 creditos',
    description: 'Para quem publica com frequencia.'
  },
  agency: {
    id: 'agency',
    credits: 100,
    price: 69.9,
    label: '100 creditos',
    description: 'Melhor custo para corretores e imobiliarias.'
  }
};

export const AI_CREDIT_ACTIONS = {
  professionalListing: {
    key: 'professional_listing',
    label: 'Gerar titulo + descricao profissional',
    credits: 1
  }
} as const;

export function getAiCreditPackage(packageId: string | null | undefined) {
  if (!packageId) return null;
  return AI_CREDIT_PACKAGES[packageId as AiCreditPackageId] ?? null;
}

export function formatCredits(value: number | null | undefined) {
  const credits = Number(value ?? 0);
  return `${credits} credito${credits === 1 ? '' : 's'}`;
}
