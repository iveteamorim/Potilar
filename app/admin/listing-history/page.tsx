import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Historico de anuncios | Admin PotiLar' };

const eventLabels: Record<string, string> = {
  created: 'Criado', deleted: 'Excluido', status_changed: 'Status alterado', expiration_changed: 'Prazo alterado'
};
const statusLabels: Record<string, string> = {
  approved: 'Publicado', pending: 'Em analise', paused: 'Pausado',
  needs_renewal: 'Requer renovacao', rejected: 'Rejeitado', draft: 'Rascunho'
};
function date(value: string | null) {
  return value ? new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Fortaleza'
  }).format(new Date(value)) : '-';
}

export default async function ListingHistoryPage({ searchParams }: {
  searchParams?: { page?: string; event?: string; listing?: string }
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/listing-history');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const page = Math.max(1, Math.min(100000, Math.floor(Number(searchParams?.page) || 1)));
  const event = Object.hasOwn(eventLabels, searchParams?.event ?? '') ? searchParams!.event! : '';
  const listing = searchParams?.listing?.trim() ?? '';
  const validListing = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listing);
  let query = supabase.from('listing_audit_events')
    .select('*', { count: 'exact' }).order('occurred_at', { ascending: false }).order('id', { ascending: false });
  if (event) query = query.eq('event_type', event);
  if (validListing) query = query.eq('listing_id', listing);
  const { data, error, count } = await query.range((page - 1) * 50, page * 50 - 1);
  function pageHref(nextPage: number) {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (event) params.set('event', event);
    if (validListing) params.set('listing', listing);
    return `/admin/listing-history?${params}`;
  }

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-7xl space-y-5">
        <Link href="/admin" className="text-sm font-semibold text-ocean-700">Voltar ao admin</Link>
        <h1 className="text-2xl font-semibold">Historico de anuncios</h1>
        <form className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Evento
            <select name="event" defaultValue={event} className="ml-2 rounded-lg border p-2 dark:bg-slate-900">
              <option value="">Todos</option>
              {Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm">ID do anuncio
            <input name="listing" defaultValue={listing} className="ml-2 max-w-full rounded-lg border p-2 dark:bg-slate-900" />
          </label>
          <button className="rounded-lg bg-ocean-700 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
        </form>
        {listing && !validListing && <p role="alert" className="text-sm text-red-700">ID do anuncio invalido.</p>}
        {error ? <p role="alert" className="text-sm text-red-700">Historico indisponivel. Verifique a migracao listing_audit.sql e as permissoes.</p> : (
          <>
            <p className="text-sm text-slate-500">{count ?? 0} eventos · Horario de Brasilia</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b">
                  {['Quando', 'Anuncio', 'Evento', 'Status', 'Vencimento', 'Responsavel'].map(label => <th key={label} className="px-3 py-3">{label}</th>)}
                </tr></thead>
                <tbody>{(data ?? []).map(row => <tr key={row.id} className="border-b align-top">
                  <td className="whitespace-nowrap px-3 py-3">{date(row.occurred_at)}</td>
                  <td className="max-w-xs break-words px-3 py-3"><p>{row.listing_title || 'Sem titulo'}</p><p className="mt-1 break-all text-xs text-slate-500">{row.listing_id}</p><p className="mt-1 break-all text-xs text-slate-500">Proprietario: {row.owner_id ?? '-'}</p></td>
                  <td className="px-3 py-3">{eventLabels[row.event_type] ?? row.event_type}</td>
                  <td className="px-3 py-3">{statusLabels[row.old_status] ?? row.old_status ?? '-'} → {statusLabels[row.new_status] ?? row.new_status ?? '-'}</td>
                  <td className="whitespace-nowrap px-3 py-3">{date(row.old_expires_at)}<br />→ {date(row.new_expires_at)}</td>
                  <td className="max-w-xs break-all px-3 py-3">{row.actor_id ?? 'Processo sem usuario'}<p className="text-xs text-slate-500">{row.actor_role}</p></td>
                </tr>)}</tbody>
              </table>
              {!data?.length && <p className="py-6 text-sm text-slate-500">Nenhum evento registrado.</p>}
            </div>
            <nav className="flex gap-5 text-sm font-semibold">
              {page > 1 && <Link href={pageHref(page - 1)}>Anterior</Link>}
              {page * 50 < (count ?? 0) && <Link href={pageHref(page + 1)}>Proxima</Link>}
            </nav>
          </>
        )}
      </div>
    </main>
  );
}
