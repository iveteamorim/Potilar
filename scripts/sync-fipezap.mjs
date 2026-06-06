import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

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

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const FIPEZAP_XLSX_URL = 'https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx';
const FIPE_SOURCE = 'Indice FipeZAP (Zap, Viva Real, OLX)';

function excelSerialToIso(serial) {
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000).toISOString().slice(0, 10);
}

function formatReferencePeriod(isoDate) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const month = date.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' });
  return `${month}/${date.getUTCFullYear()}`;
}

function cityKey(city, state) {
  return `${city}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function parseResumo(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Resumo, { header: 1 });
  const referenceSerial = Number(rows[5]?.[3] ?? 0);
  const referenceDate = referenceSerial > 0 ? excelSerialToIso(referenceSerial) : new Date().toISOString().slice(0, 10);
  const referencePeriod = formatReferencePeriod(referenceDate);
  const results = [];

  for (const row of rows.slice(7)) {
    if (!Array.isArray(row)) continue;
    const city = String(row[0] ?? '').trim();
    const state = String(row[2] ?? '').trim();
    const saleSqm = Number(row[6]);
    const rentSqm = Number(row[10]);
    if (!city || state !== 'RN' || !Number.isFinite(saleSqm) || !Number.isFinite(rentSqm)) continue;

    results.push({
      city_key: cityKey(city, state),
      city,
      state,
      sale_sqm: Math.round(saleSqm),
      rent_sqm: Math.round(rentSqm * 100) / 100,
      source: FIPE_SOURCE,
      reference_period: referencePeriod,
      reference_date: referenceDate,
      synced_at: new Date().toISOString()
    });
  }

  return results;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const response = await fetch(FIPEZAP_XLSX_URL);
if (!response.ok) {
  console.error('Falha ao baixar planilha FipeZAP:', response.status);
  process.exit(1);
}

const rows = parseResumo(await response.arrayBuffer());
if (!rows.length) {
  console.error('Nenhuma cidade do RN encontrada na planilha.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const { error } = await supabase.from('market_city_benchmarks').upsert(rows, { onConflict: 'city_key' });

if (error) {
  console.error('Erro ao salvar no Supabase:', error.message);
  process.exit(1);
}

console.log('FipeZAP sincronizado:');
for (const row of rows) {
  console.log(`- ${row.city}: venda R$ ${row.sale_sqm}/m2 | locacao R$ ${row.rent_sqm}/m2 (${row.reference_period})`);
}
