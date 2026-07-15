export type NewsArticle = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string[];
  imageUrl: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  publishedAt?: string | null;
};

const fallbackNewsImage =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80';

const newsImagesByCategory: Record<string, string[]> = {
  aluguel: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'
  ],
  construcao: [
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?auto=format&fit=crop&w=900&q=80'
  ],
  documentacao: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80'
  ],
  financiamento: [
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=900&q=80'
  ],
  legislacao: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80'
  ],
  mercado: [
    fallbackNewsImage,
    'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80'
  ],
  seguranca: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80'
  ],
  temporada: [
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80'
  ]
};

function getImageIndex(seed: string, total: number) {
  if (total <= 1) return 0;
  const value = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return value % total;
}

function getNewsImageCandidates(category: string) {
  const normalized = category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const match = Object.entries(newsImagesByCategory).find(([key]) => normalized.includes(key));
  return match?.[1] ?? newsImagesByCategory.mercado;
}

export function getNewsImageUrl(category: string, imageUrl?: string | null, seed = category) {
  if (imageUrl && imageUrl !== fallbackNewsImage) return imageUrl;

  const images = getNewsImageCandidates(category);
  return images[getImageIndex(seed, images.length)] ?? fallbackNewsImage;
}

export function withUniqueNewsImages<T extends NewsArticle>(articles: T[]) {
  const usedImages = new Set<string>();

  return articles.map((article, index) => {
    if (!usedImages.has(article.imageUrl)) {
      usedImages.add(article.imageUrl);
      return article;
    }

    const candidates = getNewsImageCandidates(article.category);
    const start = getImageIndex(`${article.slug}-${article.title}-${index}`, candidates.length);
    const replacement =
      candidates.find((_, offset) => !usedImages.has(candidates[(start + offset) % candidates.length])) ??
      newsImagesByCategory.mercado.find((image) => !usedImages.has(image)) ??
      article.imageUrl;

    usedImages.add(replacement);
    return { ...article, imageUrl: replacement };
  });
}

export function formatNewsDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

const newsTitleStopWords = new Set([
  'a',
  'as',
  'o',
  'os',
  'um',
  'uma',
  'de',
  'da',
  'das',
  'do',
  'dos',
  'e',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'para',
  'por',
  'com',
  'ao',
  'aos',
  'pelo',
  'pela',
  'pelos',
  'pelas'
]);

export function getNewsTitleFingerprint(title: string) {
  const words = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !newsTitleStopWords.has(word));

  return words.slice(0, 8).join('-');
}

export function dedupeNewsArticles<T extends Pick<NewsArticle, 'title' | 'sourceUrl'>>(articles: T[]) {
  const seenTitles = new Set<string>();
  const seenSources = new Set<string>();

  return articles.filter((article) => {
    const titleKey = getNewsTitleFingerprint(article.title);
    const sourceKey = article.sourceUrl?.trim();
    if (titleKey && seenTitles.has(titleKey)) return false;
    if (sourceKey && seenSources.has(sourceKey)) return false;

    if (titleKey) seenTitles.add(titleKey);
    if (sourceKey) seenSources.add(sourceKey);
    return true;
  });
}

export const fallbackNewsArticles: NewsArticle[] = [
  {
    slug: 'precos-imoveis-rn',
    category: 'Mercado imobiliário',
    title: 'Como acompanhar os preços de imóveis no Rio Grande do Norte',
    excerpt:
      'Entenda quais sinais observar para comparar anúncios, bairros, cidades e oportunidades antes de comprar, vender ou alugar.',
    imageUrl: fallbackNewsImage,
    content: [
      'O primeiro passo é olhar imóveis do mesmo tipo, na mesma cidade e com características semelhantes. Uma casa com garagem, quintal e boa localização não deve ser comparada diretamente com um imóvel menor ou em outro bairro.',
      'No RN, a procura pode variar muito entre cidades, praias, bairros centrais e áreas em crescimento. Imóveis bem localizados tendem a receber mais contatos e permitem uma leitura melhor do preço praticado.',
      'Anúncios antigos podem estar com preço defasado. Sempre que possível, compare anúncios atualizados recentemente e revise fotos, descrição e contato antes de tomar uma decisão.'
    ]
  },
  {
    slug: 'cuidados-negociar-imovel-online',
    category: 'Segurança',
    title: 'Cuidados antes de visitar ou negociar um imóvel anunciado online',
    excerpt:
      'Medidas simples para reduzir riscos em contatos, visitas, pagamentos e negociações iniciadas pela internet.',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    content: [
      'Antes de visitar ou enviar qualquer valor, confirme telefone, nome, localização e coerência das informações do anúncio. Desconfie de pressa excessiva ou ofertas muito abaixo do mercado.',
      'Não envie sinal, taxa ou reserva sem verificar a existência do imóvel e a legitimidade de quem está anunciando. Quando houver dúvida, procure orientação profissional.',
      'Combine visitas em horários seguros, avise alguém de confiança e prefira locais com endereço claro. A segurança vale tanto para interessados quanto para proprietários.'
    ]
  },
  {
    slug: 'documentos-vender-alugar-imovel',
    category: 'Documentação',
    title: 'Documentos importantes para vender ou alugar um imóvel',
    excerpt:
      'Uma visão geral do que proprietários costumam organizar antes de publicar um anúncio ou iniciar uma negociação.',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    content: [
      'Tenha em mãos metragem aproximada, endereço, cidade, bairro, número de quartos, vagas, fotos atuais e uma descrição clara. Isso evita perguntas repetidas e melhora a qualidade do anúncio.',
      'Para venda, documentos como matrícula, escritura, IPTU e dados do proprietário podem ser solicitados durante a negociação. Para aluguel, também podem entrar contrato e comprovantes.',
      'Se houver dúvidas sobre escritura, inventário, financiamento, dívidas ou contrato, o ideal é buscar apoio de corretor, imobiliária, advogado ou cartório antes de fechar negócio.'
    ]
  }
];
