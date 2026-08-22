'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileDown, Table2, Upload } from 'lucide-react';
import type { importListingsFromCsv } from './actions';

const SPREADSHEET_PLACEHOLDER = `Cole aqui (Ctrl + V) a planilha copiada do Excel, Google Sheets ou CSV.

Exemplo

Titulo    Tipo         Operacao    Preco     Cidade       Quartos
Casa      Casa         Venda       350000    Natal        3
Apartamento Apartamento Aluguel    1800      Parnamirim   2`;

const EXAMPLE_FILE = `titulo;tipo;operacao;preco;cidade;bairro;quartos;banheiros;vagas;area;descricao;fotos
Casa com quintal;Casa;Venda;350000;Natal;Lagoa Nova;3;2;2;120;Casa ampla perto de servicos;https://site.com/foto1.jpg
Apartamento mobiliado;Apartamento;Aluguel;1800;Parnamirim;Nova Parnamirim;2;1;1;68;Apartamento pronto para morar;`;

type ImportListingsAction = typeof importListingsFromCsv;

function parseLine(line: string) {
  const separator = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  return line.split(separator).map((value) => value.trim().replace(/^"|"$/g, ''));
}

function buildPreview(rawValue: string) {
  const lines = rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dataLines = lines[0]?.toLowerCase().includes('titulo') ? lines.slice(1) : lines;
  const rows = dataLines.map((line, index) => {
    const [title, propertyType, transaction, price, city, neighborhood, bedrooms, bathrooms, parking, areaSqm, description] = parseLine(line);
    const missing = [
      !title ? 'titulo' : null,
      !city ? 'cidade' : null,
      !description ? 'descricao' : null
    ].filter(Boolean);

    return {
      id: `${index}-${line.slice(0, 12)}`,
      title: title || `Linha ${index + 1}`,
      detail: [propertyType, transaction, city, price ? `R$ ${price}` : null].filter(Boolean).join(' · '),
      summary: [bedrooms ? `${bedrooms} quartos` : null, bathrooms ? `${bathrooms} banheiros` : null, parking ? `${parking} vagas` : null, areaSqm ? `${areaSqm} m2` : null, neighborhood].filter(Boolean).join(' · '),
      valid: missing.length === 0,
      missing
    };
  });

  return {
    total: rows.length,
    valid: rows.filter((row) => row.valid).length,
    invalid: rows.filter((row) => !row.valid).length,
    rows: rows.slice(0, 5)
  };
}

export function SpreadsheetImportForm({
  action,
  disabled
}: {
  action: ImportListingsAction;
  disabled: boolean;
}) {
  const [value, setValue] = useState('');
  const preview = useMemo(() => buildPreview(value), [value]);
  const hasRows = preview.total > 0;

  return (
    <form action={action} className="mt-5 grid gap-4 lg:grid-cols-[250px_minmax(420px,680px)_180px] lg:items-end">
      <div className="rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/60 p-4 text-sm text-ocean-900 dark:border-ocean-900 dark:bg-ocean-950/30 dark:text-ocean-100">
        <Table2 className="h-7 w-7" />
        <p className="mt-3 font-semibold">Como importar</p>
        <ol className="mt-3 space-y-1.5 text-xs leading-5">
          <li>1. Abra sua planilha</li>
          <li>2. Selecione as linhas</li>
          <li>3. Copie com Ctrl + C</li>
          <li>4. Cole aqui com Ctrl + V</li>
        </ol>
        <div className="mt-3 rounded-xl bg-white/70 p-3 text-xs leading-5 text-ocean-800 dark:bg-slate-950/50 dark:text-ocean-100">
          <p className="font-semibold">Aceitamos</p>
          <p className="mt-1">Excel, Google Sheets, LibreOffice e CSV.</p>
        </div>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(EXAMPLE_FILE)}`}
          download="modelo-importacao-potilar.csv"
          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-ocean-800 underline-offset-4 hover:underline dark:text-ocean-100"
        >
          <FileDown className="h-4 w-4" />
          Baixar modelo CSV
        </a>
      </div>

      <div className="min-w-0">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="csv">
          Cole os dados da planilha
        </label>
        <textarea
          id="csv"
          name="csv"
          required
          rows={8}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={SPREADSHEET_PLACEHOLDER}
          className="mt-2 w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 font-mono text-xs text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-ocean-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
        />

        {hasRows && (
          <div className="mt-4 rounded-2xl border border-sand-200 bg-sand-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-900 dark:text-white">
              <span>Encontramos {preview.total} imovel{preview.total === 1 ? '' : 'is'}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                {preview.valid} valido{preview.valid === 1 ? '' : 's'}
              </span>
              {preview.invalid > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  {preview.invalid} com erro
                </span>
              )}
            </div>
            <div className="mt-3 divide-y divide-sand-200 overflow-hidden rounded-xl bg-white text-xs dark:divide-slate-800 dark:bg-slate-950">
              {preview.rows.map((row) => (
                <div key={row.id} className="grid gap-1 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
                    <p className="text-slate-500 dark:text-slate-400">{row.detail || row.summary || 'Dados pendentes'}</p>
                  </div>
                  <span className={row.valid ? 'font-semibold text-emerald-700 dark:text-emerald-200' : 'font-semibold text-amber-700 dark:text-amber-200'}>
                    {row.valid ? 'OK' : `Falta ${row.missing.join(', ')}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex lg:h-full lg:items-end">
        <button
          type="submit"
          disabled={disabled || !hasRows || preview.valid === 0}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          <Upload className="h-4 w-4" />
          {hasRows ? `Importar ${preview.valid || ''}`.trim() : 'Importar planilha'}
        </button>
      </div>
    </form>
  );
}
