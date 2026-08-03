import { slugify } from '@/lib/slugify';
import type { PropertyType } from '@/lib/propertyTypes';

export type Property = {
  id: string;
  ownerId?: string;
  slug: string;
  title: string;
  propertyType: PropertyType;
  transaction: 'Aluguel' | 'Compra' | 'Temporada';
  price: number;
  pricePeriod?: 'dia' | 'semana' | 'mes';
  bedrooms: number;
  bathrooms: number;
  parking: number;
  areaSqm?: number;
  location: string;
  neighborhood?: string;
  community?: string;
  addressExtra?: string;
  lat: number;
  lng: number;
  isPetFriendly: boolean;
  isFurnished?: boolean;
  condoFee?: number;
  condoIncluded?: boolean;
  images: string[];
  videoUrl?: string;
  tourUrl?: string;
  isFeatured?: boolean;
  featuredPlan?: '7_days' | '15_days' | '30_days' | 'super_30_days';
  contactName?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  contactMethods?: string[];
  advertiserAccountType?: 'particular' | 'corretor' | 'imobiliaria' | string;
  advertiserCreciVerified?: boolean;
  advertiserPublicSlug?: string;
  advertiserDisplayName?: string;
  advertiserImageUrl?: string;
  description: string;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
};

const rawProperties: Omit<Property, 'slug'>[] = [
  {
    id: 'rn-001',
    title: 'Casa térrea com quintal amplo',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 185000,
    bedrooms: 2,
    bathrooms: 1,
    parking: 2,
    location: 'Monte Alegre, RN',
    lat: -6.0706,
    lng: -35.3285,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511'
    ],
    tourUrl: 'https://www.youtube.com/embed/7AzimJm0z9I',
    description:
      'Casa bem ventilada, com varanda, sala integrada e quintal ideal para família. Rua tranquila com fácil acesso ao centro.',
    features: ['Varanda coberta', 'Quintal arborizado', 'Rua calçada', 'Iluminação natural']
  },
  {
    id: 'rn-002',
    title: 'Lote plano próximo à BR',
    propertyType: 'Terreno',
    transaction: 'Compra',
    price: 52000,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    location: 'Macaíba, RN',
    lat: -5.8586,
    lng: -35.3525,
    isPetFriendly: false,
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      'https://images.unsplash.com/photo-1472224371017-08207f84aaae'
    ],
    description:
      'Loteamento com infraestrutura básica, ideal para investimento ou construção imediata. Documentação em dia.',
    features: ['Topografia plana', 'Acesso asfaltado', 'Iluminação pública']
  },
  {
    id: 'rn-003',
    title: 'Casa econômica com suíte',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 145000,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    location: 'Vera Cruz, RN',
    lat: -6.0438,
    lng: -35.4338,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511'
    ],
    tourUrl: 'https://www.youtube.com/embed/7AzimJm0z9I',
    description:
      'Imóvel compacto e funcional, com suíte e área de serviço coberta. Excelente custo-benefício.',
    features: ['Suíte', 'Área de serviço', 'Cozinha integrada']
  },
  {
    id: 'rn-004',
    title: 'Apartamento mobiliado para aluguel',
    propertyType: 'Apartamento',
    transaction: 'Aluguel',
    price: 980,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    location: 'Goianinha, RN',
    lat: -6.2664,
    lng: -35.2133,
    isPetFriendly: false,
    condoFee: 180,
    images: [
      'https://images.unsplash.com/photo-1502005097973-6a7082348e28',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb'
    ],
    description:
      'Apartamento mobiliado com varanda e vista aberta, próximo ao comércio local e com transporte fácil.',
    features: ['Mobiliado', 'Varanda', 'Próximo ao centro']
  },
  {
    id: 'rn-005',
    title: 'Casa com garagem dupla',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 210000,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    location: 'São José do Mipibu, RN',
    lat: -6.0778,
    lng: -35.2424,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858',
      'https://images.unsplash.com/photo-1494526585095-c41746248156'
    ],
    description:
      'Casa espaçosa com garagem dupla e quintal. Ideal para quem busca conforto e tranquilidade.',
    features: ['Garagem dupla', 'Sala ampla', 'Rua silenciosa']
  },
  {
    id: 'rn-006',
    title: 'Lote de esquina com vista',
    propertyType: 'Terreno',
    transaction: 'Compra',
    price: 68000,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    location: 'Lagoa Salgada, RN',
    lat: -6.1185,
    lng: -35.4867,
    isPetFriendly: false,
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      'https://images.unsplash.com/photo-1472224371017-08207f84aaae'
    ],
    description:
      'Lote de esquina com boa ventilação e vista aberta. Bairro em crescimento.',
    features: ['Lote de esquina', 'Vista aberta', 'Boa ventilação']
  },
  {
    id: 'rn-007',
    title: 'Casa compacta com área gourmet',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 172000,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    location: 'Arês, RN',
    lat: -6.1999,
    lng: -35.1603,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae'
    ],
    tourUrl: 'https://www.youtube.com/embed/7AzimJm0z9I',
    description:
      'Casa compacta com área gourmet e churrasqueira. Perfeita para reuniões em família.',
    features: ['Área gourmet', 'Churrasqueira', 'Boa iluminação']
  },
  {
    id: 'rn-008',
    title: 'Aluguel acessível perto da feira',
    propertyType: 'Casa',
    transaction: 'Aluguel',
    price: 750,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    location: 'Brejinho, RN',
    lat: -6.1898,
    lng: -35.3568,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1449844908441-8829872d2607',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511'
    ],
    description:
      'Imóvel simples e bem localizado, próximo à feira e serviços essenciais.',
    features: ['Localização central', 'Acesso rápido a serviços']
  },
  {
    id: 'rn-009',
    title: 'Casa com terreno estendido',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 235000,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    location: 'Senador Elói de Souza, RN',
    lat: -6.0361,
    lng: -35.6995,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb'
    ],
    description:
      'Terreno estendido com espaço para horta ou expansão. Casa confortável e ventilada.',
    features: ['Terreno amplo', 'Espaço para horta', 'Boa ventilação']
  },
  {
    id: 'rn-010',
    title: 'Lote econômico para primeira construção',
    propertyType: 'Terreno',
    transaction: 'Compra',
    price: 45000,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    location: 'Santo Antônio, RN',
    lat: -6.3119,
    lng: -35.4735,
    isPetFriendly: false,
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      'https://images.unsplash.com/photo-1472224371017-08207f84aaae'
    ],
    description:
      'Lote econômico com acesso por estrada principal. Ideal para primeira construção.',
    features: ['Preço acessível', 'Bairro em expansão']
  },
  {
    id: 'rn-011',
    title: 'Casa com varanda e jardim frontal',
    propertyType: 'Casa',
    transaction: 'Compra',
    price: 198000,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    location: 'Bento Fernandes, RN',
    lat: -5.7029,
    lng: -35.8323,
    isPetFriendly: true,
    images: [
      'https://images.unsplash.com/photo-1472224371017-08207f84aaae',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae'
    ],
    description:
      'Casa acolhedora com jardim frontal e varanda. Ótima ventilação cruzada.',
    features: ['Jardim frontal', 'Ventilação cruzada']
  },
  {
    id: 'rn-012',
    title: 'Apartamento compacto com vista',
    propertyType: 'Apartamento',
    transaction: 'Aluguel',
    price: 860,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    location: 'Ielmo Marinho, RN',
    lat: -5.8242,
    lng: -35.5535,
    isPetFriendly: false,
    condoFee: 140,
    images: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156',
      'https://images.unsplash.com/photo-1502005097973-6a7082348e28'
    ],
    description:
      'Apartamento compacto, com vista e boa iluminação. Próximo a escolas.',
    features: ['Vista aberta', 'Boa iluminação', 'Próximo a escolas']
  }
];

const demoPropertiesEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_PROPERTIES === 'true';

/** Imoveis de demonstracao (Unsplash). Desligados por padrao em producao. */
export const properties: Property[] = demoPropertiesEnabled
  ? rawProperties.map((property) => ({
      ...property,
      slug: slugify(`${property.title}-${property.location}-${property.id}`)
    }))
  : [];
