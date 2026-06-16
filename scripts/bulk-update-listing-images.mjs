/**
 * Atualiza fotos de todos os anuncios de uma vez (sem abrir um a um no admin).
 *
 * Uso:
 *   node scripts/bulk-update-listing-images.mjs --dry-run
 *   node scripts/bulk-update-listing-images.mjs
 *   node scripts/bulk-update-listing-images.mjs --status=approved
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY em .env.local
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const statusArg = args.find((arg) => arg.startsWith('--status='));
const statusFilter = statusArg ? statusArg.split('=')[1] : null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
  process.exit(1);
}

const pools = JSON.parse(readFileSync(resolve(process.cwd(), 'data/listingImagePools.json'), 'utf8'));

function pickImages(propertyType, transaction, index) {
  const typePool = pools[propertyType] ?? pools.Casa;
  const txPool = typePool?.[transaction] ?? typePool?.Aluguel ?? typePool?.Compra ?? Object.values(typePool)[0];
  if (!txPool?.length) {
    throw new Error(`Sem pool de imagens para ${propertyType} / ${transaction}`);
  }
  return txPool[index % txPool.length];
}

const supabase = createClient(url, serviceKey);

let query = supabase
  .from('listings')
  .select('id,title,property_type,transaction,location,images,status')
  .order('created_at', { ascending: true });

if (statusFilter) {
  query = query.eq('status', statusFilter);
}

const { data: listings, error } = await query;

if (error) {
  console.error('Erro ao listar anuncios:', error.message);
  process.exit(1);
}

if (!listings?.length) {
  console.log('Nenhum anuncio encontrado.');
  process.exit(0);
}

console.log(`${dryRun ? '[DRY RUN] ' : ''}Atualizando ${listings.length} anuncio(s)...`);

let updated = 0;

for (const [index, listing] of listings.entries()) {
  const newImages = pickImages(listing.property_type, listing.transaction, index);

  console.log(`- ${listing.title} (${listing.location}) -> ${newImages.length} fotos`);

  if (dryRun) {
    updated += 1;
    continue;
  }

  const { error: updateError } = await supabase
    .from('listings')
    .update({ images: newImages, updated_at: new Date().toISOString() })
    .eq('id', listing.id);

  if (updateError) {
    console.error(`  ERRO ${listing.id}:`, updateError.message);
    continue;
  }

  updated += 1;
}

console.log(`\nConcluido: ${updated}/${listings.length} anuncio(s) ${dryRun ? 'seriam atualizados' : 'atualizados'}.`);
console.log('Edite data/listingImagePools.json para trocar as URLs do lote.');
