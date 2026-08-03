import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, Inbox, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Leads e importacoes | Admin Potilar'
};

type AdvertiserLead = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  city: string;
  advertiser_type: string;
  property_type: string;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

function getWhatsappHref(phone: string, name: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const text = encodeURIComponent(`Olá, ${name}. Vi sua solicitação na Potilar e posso ajudar com a importação dos imóveis.`);
  return `https://wa.me/${normalized}?text=${text}`;
}

function extractUrl(message?: string | null) {
  return message?.match(/https?:\/\/\S+/i)?.[0]?.replace(/[).,;]+$/, '') ?? null;
}

export default async function AdminLeadsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin/leads');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/admin');

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('advertiser_leads')
    .select('id,name,whatsapp,email,city,advertiser_type,property_type,message,source,status,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const leads = (data ?? []) as AdvertiserLead[];
  const importRequests = leads.filter((lead) => lead.source === 'importar-carteira');
  const otherLeads = leads.filter((lead) => lead.source !== 'importar-carteira');

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
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Leads e importacoes</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Solicitações de anunciantes, importação por portal/CRM e contatos recebidos pela Potilar.
              </p>
            </div>
            <div className="rounded-2xl bg-ocean-50 px-4 py-3 text-sm font-semibold text-ocean-800">
              {leads.length} registros
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Nao foi possivel carregar leads: {error.message}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-ocean-700" />
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Pedidos de importacao</h2>
          </div>
          <div className="grid gap-4">
            {importRequests.map((lead) => {
              const whatsappHref = getWhatsappHref(lead.whatsapp, lead.name);
              const url = extractUrl(lead.message);

              return (
                <article key={lead.id} className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">{lead.source}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{lead.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(lead.created_at)} · {lead.advertiser_type} · {lead.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {whatsappHref && (
                        <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      )}
                      {url && (
                        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-ocean-200 px-3 py-2 text-xs font-semibold text-ocean-700">
                          <ExternalLink className="h-4 w-4" />
                          Abrir link
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-sand-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {lead.message || 'Sem mensagem.'}
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-semibold text-slate-500">Telefone</dt>
                      <dd className="mt-1 text-slate-900 dark:text-white">{lead.whatsapp}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">E-mail</dt>
                      <dd className="mt-1 text-slate-900 dark:text-white">{lead.email || 'Nao informado'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Cidade</dt>
                      <dd className="mt-1 text-slate-900 dark:text-white">{lead.city}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
            {importRequests.length === 0 && (
              <div className="rounded-3xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Nenhum pedido de importacao ainda.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Outros contatos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {otherLeads.map((lead) => (
              <article key={lead.id} className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-white">{lead.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(lead.created_at)} · {lead.source}</p>
                  </div>
                  {getWhatsappHref(lead.whatsapp, lead.name) && (
                    <a href={getWhatsappHref(lead.whatsapp, lead.name) ?? '#'} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                      WhatsApp
                    </a>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{lead.message || 'Sem mensagem.'}</p>
              </article>
            ))}
            {otherLeads.length === 0 && (
              <div className="rounded-3xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Nenhum outro contato ainda.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
