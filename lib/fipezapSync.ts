import * as XLSX from 'xlsx';

export const FIPEZAP_XLSX_URL = 'https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx';

export type FipeZapCityRow = {
  cityKey: string;
  city: string;
  state: string;
  saleSqm: number;
  rentSqm: number;
  referenceDate: string;
  referencePeriod: string;
  source: string;
};

const FIPE_SOURCE = 'Indice FipeZAP (Zap, Viva Real, OLX)';

function excelSerialToIso(serial: number) {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().slice(0, 10);
}

function formatReferencePeriod(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const month = date.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${month}/${year}`;
}

function cityKey(city: string, state: string) {
  return `${city}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function parseResumoSheet(buffer: ArrayBuffer, filterState = 'RN'): FipeZapCityRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets.Resumo;
  if (!sheet) {
    throw new Error('Planilha FipeZAP sem aba Resumo.');
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  const referenceSerial = Number(rows[5]?.[3] ?? 0);
  const referenceDate = referenceSerial > 0 ? excelSerialToIso(referenceSerial) : new Date().toISOString().slice(0, 10);
  const referencePeriod = formatReferencePeriod(referenceDate);
  const results: FipeZapCityRow[] = [];

  for (const row of rows.slice(7)) {
    if (!Array.isArray(row)) continue;

    const city = String(row[0] ?? '').trim();
    const state = String(row[2] ?? '').trim();
    const saleSqm = Number(row[6]);
    const rentSqm = Number(row[10]);

    if (!city || state !== filterState) continue;
    if (!Number.isFinite(saleSqm) || !Number.isFinite(rentSqm) || saleSqm <= 0 || rentSqm <= 0) continue;

    results.push({
      cityKey: cityKey(city, state),
      city,
      state,
      saleSqm: Math.round(saleSqm),
      rentSqm: Math.round(rentSqm * 100) / 100,
      referenceDate,
      referencePeriod,
      source: FIPE_SOURCE
    });
  }

  return results;
}

export async function fetchFipeZapCityRows(filterState = 'RN'): Promise<FipeZapCityRow[]> {
  const response = await fetch(FIPEZAP_XLSX_URL, {
    headers: { 'User-Agent': 'Potilar/1.0 (FipeZAP sync; potilar.com.br)' },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar planilha FipeZAP (${response.status}).`);
  }

  const buffer = await response.arrayBuffer();
  const rows = parseResumoSheet(buffer, filterState);

  if (rows.length === 0) {
    throw new Error('Nenhuma cidade do RN encontrada na planilha FipeZAP.');
  }

  return rows;
}
