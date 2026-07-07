/**
 * Teste offline do Preco Justo RN (usa fallback estatico, sem Supabase).
 * Uso: node scripts/test-preco-justo.mjs
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Forca fallback estatico invalidando admin client via env vazio
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

const { buildPriceInsight } = await import('../lib/priceIntelligence.ts');

const cases = [
  {
    label: 'Natal apt 2q 68m aluguel R$2500',
    price: 2500,
    transaction: 'Aluguel',
    propertyType: 'Apartamento',
    location: 'Natal',
    neighborhood: 'Lagoa Nova',
    bedrooms: 2,
    areaSqm: 68
  },
  {
    label: 'Monte Alegre casa 2q 70m aluguel R$600',
    price: 600,
    transaction: 'Aluguel',
    propertyType: 'Casa',
    location: 'Monte Alegre',
    bedrooms: 2,
    areaSqm: 70
  },
  {
    label: 'Santana do Matos casa 2q 80m aluguel R$800',
    price: 800,
    transaction: 'Aluguel',
    propertyType: 'Casa',
    location: 'Santana do Matos',
    bedrooms: 2,
    areaSqm: 80
  },
  {
    label: 'Mossoro apt 2q 65m aluguel R$1200',
    price: 1200,
    transaction: 'Aluguel',
    propertyType: 'Apartamento',
    location: 'Mossoró',
    neighborhood: 'Centro',
    bedrooms: 2,
    areaSqm: 65
  },
  {
    label: 'Natal temporada R$150/dia 45m',
    price: 150,
    transaction: 'Temporada',
    propertyType: 'Apartamento',
    location: 'Natal',
    neighborhood: 'Ponta Negra',
    bedrooms: 1,
    areaSqm: 45
  },
  {
    label: 'Acari sem dados (bloqueado)',
    price: 500,
    transaction: 'Aluguel',
    propertyType: 'Casa',
    location: 'Acari',
    bedrooms: 2,
    areaSqm: 65
  }
];

for (const { label, ...input } of cases) {
  const r = await buildPriceInsight(input);
  console.log(`\n--- ${label}`);
  console.log(
    JSON.stringify(
      {
        verdict: r.verdict,
        dataTier: r.dataTier,
        listing: r.listingPrice,
        ref: r.medianPrice,
        title: r.title,
        source: r.source
      },
      null,
      2
    )
  );
}
