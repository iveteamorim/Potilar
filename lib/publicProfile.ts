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

export function getPublicProfilePath(slug: string) {
  return `/anunciante/${slug}`;
}

export function getAccountTypeLabel(accountType: PublicProfile['accountType']) {
  return accountType === 'imobiliaria' ? 'Imobiliária' : 'Corretor';
}
