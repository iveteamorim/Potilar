import { BASE_URL } from '@/lib/config';

export const dynamic = 'force-static';

export function GET() {
  const content = `# Potilar

Potilar e um portal de imoveis focado no Rio Grande do Norte, Brasil.

Objetivo do site:
- ajudar pessoas a encontrar casas, apartamentos, terrenos, alugueis e imoveis de temporada no RN
- permitir que proprietarios anunciem imoveis
- divulgar imobiliarias e corretores do Rio Grande do Norte
- publicar noticias e orientacoes sobre mercado imobiliario, documentacao, financiamento, construcao, seguranca e temporada

Principais paginas:
- ${BASE_URL}/
- ${BASE_URL}/imoveis
- ${BASE_URL}/anunciar
- ${BASE_URL}/imobiliarias
- ${BASE_URL}/planos
- ${BASE_URL}/noticias
- ${BASE_URL}/seguranca
- ${BASE_URL}/faq
- ${BASE_URL}/contato

Sitemap:
- ${BASE_URL}/sitemap.xml

Idioma principal:
- Portugues do Brasil

Area geografica principal:
- Rio Grande do Norte, Brasil

Observacoes:
- Os anuncios de imoveis sao publicados por proprietarios, corretores ou imobiliarias.
- A Potilar atua como plataforma digital de divulgacao e contato direto.
- Noticias devem ser interpretadas como conteudo informativo e nao como consultoria juridica, financeira ou imobiliaria individual.
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
