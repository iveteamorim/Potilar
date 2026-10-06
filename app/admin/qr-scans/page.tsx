import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, QrCode } from 'lucide-react';
import { QR_CARD_CAMPAIGN, QR_CARD_CONTENT } from '@/lib/qrScans';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'QR fisicos | Admin Potilar'
};

type QrScan = {
  id: number;
  campaign: string;
  content: string;
  created_at: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return 'Nenhum scan ainda';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

function formatDay(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
}

function getDayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });
}

function getContentLabel(content: string) {
  if (content === QR_CARD_CONTENT.anunciar) return 'Frente / anunciar';
  if (content === QR_CARD_CONTENT.imoveis) return 'Verso / imoveis';
  return content;
}

async function getQrScanData() {
  const supabase = createClient();
  let queryClient = supabase;

  try {
    queryClient = createAdminClient();
  } catch {
    // Fall back to the authenticated client when the service role is not available locally.
  }

  const [scansResult, totalResult, frontResult, backResult] = await Promise.all([
    queryClient
      .from('qr_scans')
      .select('id,campaign,content,created_at')
      .eq('campaign', QR_CARD_CAMPAIGN)
      .order('created_at', { ascending: false })
      .range(0, 9999),
    queryClient
      .from('qr_scans')
      .select('id', { count: 'exact', head: true })
      .eq('campaign', QR_CARD_CAMPAIGN),
    queryClient
      .from('qr_scans')
      .select('id', { count: 'exact', head: true })
      .eq('campaign', QR_CARD_CAMPAIGN)
      .eq('content', QR_CARD_CONTENT.anunciar),
    queryClient
      .from('qr_scans')
      .select('id', { count: 'exact', head: true })
      .eq('campaign', QR_CARD_CAMPAIGN)
      .eq('content', QR_CARD_CONTENT.imoveis)
  ]);

  return { scansResult, totalResult, frontResult, backResult };
}

export default async function AdminQrScansPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin/qr-scans');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/admin');

  const { scansResult, totalResult, frontResult, backResult } = await getQrScanData();
  const { data, error } = scansResult;
  const scans = (data ?? []) as QrScan[];
  const totalScans = totalResult.count ?? scans.length;
  const frontScans = frontResult.count ?? scans.filter((scan) => scan.content === QR_CARD_CONTENT.anunciar).length;
  const backScans = backResult.count ?? scans.filter((scan) => scan.content === QR_CARD_CONTENT.imoveis).length;
  const latestScan = scans[0] ?? null;
  const scansByDay = Array.from(
    scans.reduce((days, scan) => {
      const key = getDayKey(scan.created_at);
      if (!key) return days;
      days.set(key, (days.get(key) ?? 0) + 1);
      return days;
    }, new Map<string, number>())
  ).sort(([a], [b]) => b.localeCompare(a));

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-7">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao admin
        </Link>

        <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Admin</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">QR fisicos das tarjetas</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Contagem propria dos scans da campanha {QR_CARD_CAMPAIGN}, sem guardar dados pessoais.
              </p>
            </div>
            <div className="rounded-2xl bg-ocean-50 p-3 text-ocean-800">
              <QrCode className="h-7 w-7" />
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Nao foi possivel carregar os scans: {error.message}
            </div>
          )}
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {[
            ['Total de scans', totalScans],
            ['Frente / anunciar', frontScans],
            ['Verso / imoveis', backScans],
            ['Ultimo scan', latestScan ? formatDateTime(latestScan.created_at) : 'Nenhum']
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-sand-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Scans por dia</h2>
            <div className="mt-4 divide-y divide-sand-100 dark:divide-slate-800">
              {scansByDay.map(([day, count]) => (
                <div key={day} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDay(day)}</span>
                  <span className="rounded-full bg-ocean-50 px-3 py-1 font-semibold text-ocean-800">{count}</span>
                </div>
              ))}
              {scansByDay.length === 0 && (
                <p className="py-6 text-sm text-slate-500">Nenhum scan registrado ainda.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Ultimos scans</h2>
            <div className="mt-4 divide-y divide-sand-100 dark:divide-slate-800">
              {scans.slice(0, 10).map((scan) => (
                <div key={scan.id} className="py-3 text-sm">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{getContentLabel(scan.content)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(scan.created_at)}</p>
                </div>
              ))}
              {scans.length === 0 && (
                <p className="py-6 text-sm text-slate-500">Nenhum scan registrado ainda.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
