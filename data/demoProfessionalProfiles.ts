import type { Property } from '@/data/properties';
import { slugify } from '@/lib/slugify';

export type DemoProfessionalProfile = {
  id: string;
  full_name: string;
  company_name: string | null;
  bio: string;
  phone: string;
  languages?: string[];
  account_type: 'corretor' | 'imobiliaria';
  professional_plan: 'corretor' | 'imobiliaria' | 'plus';
  public_slug: string;
  creci: string;
  creci_verified: boolean;
  profile_image_url: string;
  banner_image_url: string;
};

export const demoProfessionalProfiles: DemoProfessionalProfile[] = [
  {
    id: 'demo-corretor-joao-medeiros',
    full_name: 'Joao Medeiros',
    company_name: null,
    bio: 'Corretor com atuacao em Natal, Parnamirim e litoral sul, focado em compra, aluguel e atendimento direto ao cliente.',
    phone: '84999990001',
    languages: ['Português', 'Espanhol'],
    account_type: 'corretor',
    professional_plan: 'corretor',
    public_slug: 'joao-medeiros-corretor-demo',
    creci: 'CRECI-RN 4821-F',
    creci_verified: true,
    profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=320&h=320&q=85',
    banner_image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80'
  },
  {
    id: 'demo-imobiliaria-praia-sul',
    full_name: 'Praia Sul Imoveis',
    company_name: 'Praia Sul Imoveis',
    bio: 'Imobiliaria especializada em casas de praia, temporada e oportunidades no litoral sul do Rio Grande do Norte.',
    phone: '84999990002',
    languages: ['Português', 'Espanhol', 'English'],
    account_type: 'imobiliaria',
    professional_plan: 'imobiliaria',
    public_slug: 'praia-sul-imoveis-demo',
    creci: 'CRECI-RN 1120-J',
    creci_verified: true,
    profile_image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80',
    banner_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80'
  },
  {
    id: 'demo-imobiliaria-natal-prime',
    full_name: 'Natal Prime Imobiliaria',
    company_name: 'Natal Prime Imobiliaria',
    bio: 'Carteira selecionada de apartamentos, casas e investimentos em Natal, Parnamirim e Grande Natal.',
    phone: '84999990003',
    languages: ['Português', 'Espanhol', 'English', 'Italiano'],
    account_type: 'imobiliaria',
    professional_plan: 'plus',
    public_slug: 'natal-prime-imobiliaria-demo',
    creci: 'CRECI-RN 2088-J',
    creci_verified: true,
    profile_image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    banner_image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80'
  }
];

function buildDemoProperty(property: Omit<Property, 'slug'>): Property {
  const ownerProfile = demoProfessionalProfiles.find((profile) => profile.id === property.ownerId);

  return {
    ...property,
    slug: slugify(`${property.title}-${property.location}-${property.id}`),
    advertiserAccountType: property.advertiserAccountType ?? 'corretor',
    advertiserCreciVerified: true,
    advertiserPublicSlug: ownerProfile?.public_slug,
    advertiserDisplayName: ownerProfile?.company_name || ownerProfile?.full_name,
    advertiserImageUrl: ownerProfile?.profile_image_url,
    createdAt: property.createdAt ?? '2026-07-01T12:00:00.000Z',
    updatedAt: property.updatedAt ?? '2026-07-08T12:00:00.000Z'
  };
}

export const demoProfessionalListings: Property[] = [
  buildDemoProperty({
    id: 'demo-corretor-001',
    ownerId: 'demo-corretor-joao-medeiros',
    title: 'Apartamento mobiliado em Ponta Negra',
    propertyType: 'Apartamento',
    transaction: 'Aluguel',
    price: 2400,
    pricePeriod: 'mes',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    areaSqm: 72,
    location: 'Natal, RN',
    neighborhood: 'Ponta Negra',
    lat: -5.8796,
    lng: -35.1712,
    isPetFriendly: true,
    isFurnished: true,
    condoFee: 420,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb'
    ],
    contactName: 'Joao Medeiros',
    contactWhatsapp: '5584999990001',
    contactPhone: '5584999990001',
    contactMethods: ['whatsapp', 'phone'],
    advertiserAccountType: 'corretor',
    description: 'Apartamento pronto para morar, mobiliado, com varanda e facil acesso a servicos em Ponta Negra.',
    features: ['Mobiliado', 'Varanda', 'Condominio com lazer', 'Proximo a praia']
  }),
  buildDemoProperty({
    id: 'demo-corretor-002',
    ownerId: 'demo-corretor-joao-medeiros',
    title: 'Casa em condominio em Parnamirim',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 420000,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    areaSqm: 118,
    location: 'Parnamirim, RN',
    neighborhood: 'Nova Parnamirim',
    lat: -5.9133,
    lng: -35.2104,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
    ],
    contactName: 'Joao Medeiros',
    contactWhatsapp: '5584999990001',
    contactMethods: ['whatsapp'],
    advertiserAccountType: 'corretor',
    description: 'Casa em condominio fechado com suite, area externa e seguranca para familia.',
    features: ['Condominio fechado', 'Suite', 'Garagem coberta', 'Area gourmet']
  }),
  buildDemoProperty({
    id: 'demo-corretor-003',
    ownerId: 'demo-corretor-joao-medeiros',
    title: 'Temporada perto da praia em Cotovelo',
    propertyType: 'Casa',
    transaction: 'Temporada',
    price: 390,
    pricePeriod: 'dia',
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    areaSqm: 160,
    location: 'Parnamirim, RN',
    neighborhood: 'Praia de Cotovelo',
    lat: -5.9652,
    lng: -35.1519,
    isPetFriendly: false,
    isFurnished: true,
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d'
    ],
    contactName: 'Joao Medeiros',
    contactWhatsapp: '5584999990001',
    contactMethods: ['whatsapp'],
    advertiserAccountType: 'corretor',
    description: 'Casa de temporada mobiliada, com espaco para familia e acesso rapido a praia.',
    features: ['Temporada', 'Mobiliada', 'Perto da praia', 'Area externa']
  }),
  buildDemoProperty({
    id: 'demo-praia-sul-001',
    ownerId: 'demo-imobiliaria-praia-sul',
    title: 'Casa de praia em Tabatinga',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 680000,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    areaSqm: 220,
    location: 'Nisia Floresta, RN',
    neighborhood: 'Tabatinga',
    lat: -6.0523,
    lng: -35.1071,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b'
    ],
    contactName: 'Praia Sul Imoveis',
    contactWhatsapp: '5584999990002',
    contactMethods: ['whatsapp'],
    advertiserAccountType: 'imobiliaria',
    description: 'Casa ampla no litoral sul, indicada para moradia, veraneio ou investimento.',
    features: ['Litoral sul', 'Quintal', 'Varanda', 'Garagem ampla']
  }),
  buildDemoProperty({
    id: 'demo-praia-sul-002',
    ownerId: 'demo-imobiliaria-praia-sul',
    title: 'Apartamento para temporada em Pipa',
    propertyType: 'Apartamento',
    transaction: 'Temporada',
    price: 310,
    pricePeriod: 'dia',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    areaSqm: 64,
    location: 'Tibau do Sul, RN',
    neighborhood: 'Pipa',
    lat: -6.2286,
    lng: -35.0491,
    isPetFriendly: false,
    isFurnished: true,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'
    ],
    contactName: 'Praia Sul Imoveis',
    contactWhatsapp: '5584999990002',
    contactMethods: ['whatsapp'],
    advertiserAccountType: 'imobiliaria',
    description: 'Apartamento mobiliado para temporada, com localizacao pratica para aproveitar Pipa.',
    features: ['Temporada', 'Mobiliado', 'Perto do centro', 'Varanda']
  }),
  buildDemoProperty({
    id: 'demo-natal-prime-001',
    ownerId: 'demo-imobiliaria-natal-prime',
    title: 'Apartamento alto padrao em Tirol',
    propertyType: 'Apartamento',
    transaction: 'Compra',
    price: 890000,
    bedrooms: 3,
    bathrooms: 4,
    parking: 2,
    areaSqm: 138,
    location: 'Natal, RN',
    neighborhood: 'Tirol',
    lat: -5.7945,
    lng: -35.2066,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154'
    ],
    isFeatured: true,
    featuredPlan: 'super_30_days',
    contactName: 'Natal Prime Imobiliaria',
    contactWhatsapp: '5584999990003',
    contactMethods: ['whatsapp'],
    advertiserAccountType: 'imobiliaria',
    description: 'Apartamento amplo em localizacao nobre, com planta confortavel e acabamento superior.',
    features: ['Alto padrao', 'Suite master', 'Lazer completo', 'Duas vagas']
  }),
  buildDemoProperty({
    id: 'demo-natal-prime-002',
    ownerId: 'demo-imobiliaria-natal-prime',
    title: 'Cobertura para aluguel em Lagoa Nova',
    propertyType: 'Apartamento',
    transaction: 'Aluguel',
    price: 5200,
    pricePeriod: 'mes',
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    areaSqm: 210,
    location: 'Natal, RN',
    neighborhood: 'Lagoa Nova',
    lat: -5.8254,
    lng: -35.2096,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d'
    ],
    contactName: 'Natal Prime Imobiliaria',
    contactWhatsapp: '5584999990003',
    contactMethods: ['whatsapp'],
    advertiserAccountType: 'imobiliaria',
    description: 'Cobertura ampla para aluguel, com espaco externo privativo e excelente localizacao.',
    features: ['Cobertura', 'Area privativa', 'Tres vagas', 'Vista aberta']
  })
];

export function getDemoProfessionalProfile(slug: string) {
  return demoProfessionalProfiles.find((profile) => profile.public_slug.toLowerCase() === slug.toLowerCase()) ?? null;
}

export function getDemoProfessionalListings(ownerId: string) {
  return demoProfessionalListings.filter((property) => property.ownerId === ownerId);
}
