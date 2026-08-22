import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Globe2, Link2, Pencil, PlugZap, ShieldCheck, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { importListingsFromCsv, importListingsFromPortal, importListingsFromXml } from './actions';
import { SpreadsheetImportForm } from './SpreadsheetImportForm';

export const metadata: Metadata = {
  title: 'Importar carteira | Potilar'
};

const options = [
  {
    title: 'XML do portal ou CRM',
    text: 'A forma mais rapida: cole o feed XML do seu site, portal ou CRM para importar a carteira.',
    Icon: Link2,
    active: true
  },
  {
    title: 'Excel ou CSV',
    text: 'Cole uma planilha exportada do Excel, Google Sheets ou sistema interno.',
    Icon: FileSpreadsheet,
    active: true
  },
  {
    title: 'Outro portal compativel',
    text: 'Cole a pagina publica da sua imobiliaria. A importacao depende dos dados que o portal permite ler.',
    Icon: Globe2,
    active: false
  },
  {
    title: 'Conectar CRM',
    text: 'Tecimob, Vista, Jetimob, Kenlo, InGaia e outros entram por XML, planilha ou integracao assistida.',
    Icon: PlugZap,
    active: false
  },
  {
    title: 'Criar manualmente',
    text: 'Continue cadastrando um anuncio por vez quando precisar de controle total.',
    Icon: Pencil,
    active: true,
    href: '/anunciar'
  }
];

const steps = [
  ['1. Escolha o metodo', 'Selecione a forma mais conveniente para importar seus imoveis.'],
  ['2. Envie os dados', 'Cole o XML, a planilha ou o link publico para verificacao.'],
  ['3. Revise antes de publicar', 'Os imoveis importados ficam pendentes para conferencia no painel.'],
  ['4. Publique com controle', 'Aprovamos todos de uma vez ou apenas os anuncios corretos.']
];

function getErrorMessage(error?: string, limit?: string, available?: string) {
  if (!error) return null;
  if (error === 'plan_required') return 'A importacao em lote faz parte dos planos profissionais ativos. Escolha um plano para liberar XML, planilha e portal.';
  if (error === 'import_limit') {
    const limitText = limit ? `Seu plano permite ate ${limit} anuncios ativos.` : 'Seu plano atingiu o limite de anuncios ativos.';
    const availableText = available === '0' ? ' Nao ha vagas disponiveis no momento.' : available ? ` Voce ainda pode importar ${available} anuncio(s) agora.` : '';
    return `${limitText}${availableText}`;
  }
  if (error === 'xml_url') return 'Informe uma URL XML publica e valida.';
  if (error === 'xml_fetch') return 'Nao conseguimos acessar essa URL XML. Verifique se o link esta publico e tente novamente.';
  if (error === 'xml_empty') return 'Nao encontramos imoveis reconheciveis nesse XML. Confirme se o feed contem anuncios ativos.';
  if (error === 'portal_url') return 'Informe uma URL publica valida de um portal compativel.';
  if (error === 'portal_fetch') return 'Nao conseguimos acessar esse portal automaticamente. Alguns portais bloqueiam leitura externa; neste caso use XML ou planilha.';
  if (error === 'portal_empty') return 'O portal abriu, mas nao trouxe dados suficientes para importar com seguranca. O melhor caminho e usar XML ou planilha.';
  if (error === 'empty') return 'Nao encontramos linhas validas na planilha. Verifique cabecalho, separadores e campos obrigatorios.';
  return 'Nao foi possivel importar. Revise os dados ou tente importar menos anuncios por vez.';
}

export default async function ImportarPage({
  searchParams
}: {
  searchParams?: { available?: string; error?: string; limit?: string; success?: string; request?: string; source?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta/importar');

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type,professional_plan')
    .eq('id', user.id)
    .single();

  if (!profile || !['corretor', 'imobiliaria'].includes(profile.account_type)) {
    redirect('/mi-cuenta');
  }

  const hasActiveProfessionalPlan = Boolean(profile.professional_plan);
  const errorMessage = getErrorMessage(searchParams?.error, searchParams?.limit, searchParams?.available);
  const portalImportNeedsFallback = searchParams?.error === 'portal_fetch' || searchParams?.error === 'portal_empty';

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/mi-cuenta" className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700">
          <ArrowLeft className="h-4 w-4" />
          Voltar para minha conta
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-sand-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-0 lg:grid-cols-[1fr_380px]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean-600">Importacao profissional</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 dark:text-white">
                Importe todos os seus imoveis em poucos minutos
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Traga sua carteira de imoveis para a Potilar sem precisar cadastrar um por um. XML e planilha sao os caminhos mais rapidos; portais e CRMs podem ser verificados quando disponibilizam dados publicos.
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                Todos os anuncios importados entram em revisao antes da publicacao, com controle para aprovar tudo ou selecionar apenas os imoveis corretos.
              </p>
              <div className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  <strong>Seguro e confiavel:</strong> seus dados ficam protegidos e sao usados apenas para importar sua carteira.
                </span>
              </div>
            </div>

            <div className="border-t border-sand-200 bg-ocean-50/70 p-6 dark:border-slate-800 dark:bg-ocean-950/30 lg:border-l lg:border-t-0 lg:p-8">
              <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-ocean-100 dark:bg-slate-950/70 dark:ring-ocean-900">
                <Upload className="h-10 w-10 text-ocean-700 dark:text-ocean-200" />
                <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">Ja anuncia em outro portal ou CRM?</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Nao perca horas cadastrando tudo novamente. A Potilar ajuda voce a importar, revisar e publicar sua carteira com mais controle.
                </p>
                <div className="mt-5 space-y-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {['XML e planilha para importacao rapida', 'Portais compativeis com verificacao', 'Revisao antes da publicacao'].map((item) => (
                    <p key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-ocean-700 dark:text-ocean-200" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-sand-200 bg-sand-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/30 sm:grid-cols-2 lg:grid-cols-5 lg:p-8">
            {options.map(({ title, text, Icon, active, href }) => {
              const content = (
                <div className="h-full rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ocean-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-2xl bg-ocean-50 p-3 text-ocean-700 dark:bg-ocean-950/40 dark:text-ocean-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    {title.startsWith('XML') && (
                      <span className="rounded-full bg-ocean-700 px-3 py-1 text-[11px] font-semibold text-white">Mais usado</span>
                    )}
                  </div>
                  <h2 className="mt-5 text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
                  <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200'}`}>
                    {active ? 'Disponivel' : 'Verificacao assistida'}
                  </p>
                </div>
              );

              return href ? (
                <Link key={title} href={href}>
                  {content}
                </Link>
              ) : (
                <div key={title}>{content}</div>
              );
            })}
          </div>

          <div className="space-y-4 px-6 pb-6 lg:px-8 lg:pb-8">
            {searchParams?.success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {searchParams.success} anuncios importados por {searchParams.source === 'xml' ? 'XML' : searchParams.source === 'portal' ? 'portal' : 'planilha'} e enviados para revisao.
              </div>
            )}

            {searchParams?.request && (
              <div className="rounded-2xl border border-ocean-200 bg-ocean-50 px-4 py-3 text-sm font-semibold text-ocean-800">
                Recebemos sua solicitacao. A equipe Potilar vai verificar a importacao.
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {!hasActiveProfessionalPlan && (
              <div className="rounded-2xl border border-ocean-200 bg-ocean-50 px-4 py-4 text-sm leading-6 text-ocean-900">
                <p className="font-semibold">Importacao em lote reservada para plano ativo.</p>
                <p className="mt-1">
                  A conta profissional pode ver o painel, mas XML, planilha e importacao por portal so ficam liberados depois da ativacao do plano.
                </p>
                <Link href="/planos" className="mt-3 inline-flex rounded-2xl bg-ocean-700 px-4 py-2 text-sm font-semibold text-white">
                  Ver planos
                </Link>
              </div>
            )}

            {portalImportNeedsFallback && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Importacao por portal pode depender do site de origem.</p>
                <p className="mt-1">
                  Para uma carga mais rapida e confiavel, solicite ao seu CRM ou portal a URL do XML, ou exporte os anuncios em Excel/CSV e cole na area de planilha.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-center text-2xl font-semibold text-slate-950 dark:text-white">Escolha uma opcao para comecar</h2>

          <form action={importListingsFromXml} className="grid gap-5 rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[1fr_280px_160px] lg:items-end lg:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-ocean-50 p-3 text-ocean-700 dark:bg-ocean-950/40 dark:text-ocean-200">
                <Link2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Importar por XML</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Cole a URL do XML gerado pelo site, portal ou CRM da imobiliaria. Esta e a opcao mais indicada para carregar muitos anuncios.
                </p>
                <label className="mt-5 block text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="xml_url">
                  URL do XML
                </label>
                <input
                  id="xml_url"
                  name="xml_url"
                  type="url"
                  required
                  placeholder="https://minhaimobiliaria.com.br/imoveis.xml"
                  className="mt-2 h-12 w-full rounded-2xl border border-sand-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-ocean-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="rounded-2xl bg-sand-50 p-4 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Exemplo</p>
              <p className="mt-1 break-all font-mono">https://imobiliaria.com.br/imoveis.xml</p>
            </div>
            <button type="submit" disabled={!hasActiveProfessionalPlan} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ocean-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
              <Upload className="h-4 w-4" />
              Importar XML
            </button>
          </form>

          <form action={importListingsFromPortal} className="grid gap-5 rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[1fr_280px_180px] lg:items-end lg:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                <Globe2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Importar de outro portal</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Cole o link da sua pagina em outro portal. A Potilar verificara se existem anuncios publicos que podem ser importados com seguranca.
                </p>
                <label className="mt-5 block text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="portal_url">
                  Link da pagina
                </label>
                <input
                  id="portal_url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://www.olx.com.br/perfil/seu-perfil"
                  className="mt-2 h-12 w-full rounded-2xl border border-sand-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-ocean-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <p className="rounded-2xl bg-violet-50 p-4 text-xs leading-5 text-violet-900 dark:bg-violet-950/40 dark:text-violet-100">
              Alguns portais bloqueiam leitura externa ou ocultam dados. Se isso acontecer, XML ou planilha continuam sendo as opcoes profissionais.
            </p>
            <button type="submit" disabled={!hasActiveProfessionalPlan} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
              <Upload className="h-4 w-4" />
              Verificar e importar
            </button>
          </form>

          <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Importar por Excel ou CSV</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Copie as linhas do Excel, Google Sheets, LibreOffice ou CSV e cole direto no campo abaixo.
                </p>
              </div>
            </div>

            <SpreadsheetImportForm action={importListingsFromCsv} disabled={!hasActiveProfessionalPlan} />
          </section>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {steps.map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
