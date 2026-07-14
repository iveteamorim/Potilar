import { slugify } from '@/lib/slugify';

export type PublicProfile = {
  id: string;
  fullName: string;
  companyName?: string;
  bio?: string;
  phone?: string;
  accountType: 'corretor' | 'imobiliaria';
  publicSlug: string;
  creci?: string;
  creciVerified?: boolean;
};

export function buildPublicProfileSlug(fullName: string, suffix?: string) {
  const base = slugify(fullName || 'anunciante');
  if (!suffix) return base;
  return `${base}-${suffix.slice(0, 6)}`;
}

export function buildProfessionalProfileSlug(
  profile: { company_name?: string | null; full_name?: string | null },
  userId: string
) {
  return buildPublicProfileSlug(profile.company_name || profile.full_name || 'anunciante', userId);
}

export function isProfessionalAccountType(accountType?: string | null) {
  return accountType === 'corretor' || accountType === 'imobiliaria';
}

export function getPublicProfilePath(slug: string) {
  return `/anunciante/${slug}`;
}

export function getAccountTypeLabel(accountType: PublicProfile['accountType']) {
  return accountType === 'imobiliaria' ? 'Imobiliária' : 'Corretor';
}
