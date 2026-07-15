import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getNewsImageUrl } from '@/data/news';
import { generateNewsDrafts, updateNewsArticle, updateNewsStatus } from './actions';
import SubmitButton from '@/components/SubmitButton';

export const metadata: Metadata = {
  title: 'Noticias | Admin Potilar'
};

export const maxDuration = 60;

type NewsAdminRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  status: string;
  ai_generated: boolean;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado'
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  if (status === 'published') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'archived') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-sun-50 text-slate-800 border-sun-200';
}

export default async function AdminNewsPage({
  searchParams
}: {
  searchParams?: { error?: string; success?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin/news');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/admin');

  const { data, error } = await supabase
    .from('news_articles')
    .select('id,title,slug,category,excerpt,content,image_url,status,ai_generated,source_name,source_url,published_at,updated_at,created_at')
    .order('created_at', { ascending: false })
    .limit(40);

  const articles = error ? [] : ((data ?? []) as NewsAdminRow[]);
  const counts = articles.reduce(
    (acc, article) => {
      acc[article.status] = (acc[article.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const latestGenerated = articles.find((article) => article.ai_generated)?.created_at ?? null;
  const latestPublished = articles.find((article) => article.status === 'published')?.published_at ?? null;

  return (
    <main className="section-padding">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-bold text-ocean-700">
              Admin
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Notícias</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Crie rascunhos, revise fontes e publique notícias na Potilar.
            </p>
          </div>
          <a href="/noticias" className="text-sm font-bold text-ocean-700">
            Ver notícias públicas
          </a>
        </div>

        {searchParams?.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Erro: {searchParams.error}
          </div>
        )}
        {searchParams?.success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {searchParams.success === 'generated'
              ? 'Notícias novas geradas como rascunho. Revise e publique para aparecerem no site.'
              : searchParams.success === 'status'
                ? 'Status da notícia atualizado com sucesso.'
                : searchParams.success === 'saved'
                  ? 'Notícia atualizada com sucesso.'
                : 'Ação concluída com sucesso.'}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-sun-200 bg-sun-50 px-4 py-3 text-sm font-semibold text-slate-800">
            A tabela de notícias ainda não existe. Aplique o SQL de `supabase/schema.sql` no Supabase.
          </div>
        )}

        <section className="border border-ocean-200 bg-ocean-50 p-6 dark:border-ocean-900 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Busca assistida por IA</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Arquiva os rascunhos antigos gerados por IA, busca notícias recentes em fontes externas e cria novas
                notícias prontas para revisão com link da fonte. Nada é publicado automaticamente.
              </p>
            </div>
            <form action={generateNewsDrafts}>
              <SubmitButton pendingText="Gerando notícias...">Regenerar notícias com IA</SubmitButton>
            </form>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Publicadas</p>
              <p className="mt-1 text-2xl font-semibold text-green-700">{counts.published ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rascunhos</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{counts.draft ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Última IA</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatDateTime(latestGenerated)}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Última publicação</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatDateTime(latestPublished)}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Notícias no admin</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Somente notícias com status Publicado aparecem em /noticias e na home.
            </p>
          </div>
          {articles.map((article) => (
            <article key={article.id} className="overflow-hidden border border-sand-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
                <div className="relative min-h-52 bg-sand-100 dark:bg-slate-800">
                  <img
                    src={getNewsImageUrl(article.category, article.image_url, article.slug)}
                    alt=""
                    className="h-full min-h-52 w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-ocean-50 px-2.5 py-1 text-ocean-700">{article.category}</span>
                    <span className={`rounded-full border px-2.5 py-1 ${getStatusClass(article.status)}`}>
                      {getStatusLabel(article.status)}
                    </span>
                    {article.ai_generated && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">IA</span>}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{article.title}</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{article.excerpt}</p>
                  <div className="mt-3 grid gap-1 text-xs font-semibold text-slate-500 sm:grid-cols-3">
                    <p>Criada: {formatDateTime(article.created_at)}</p>
                    <p>Atualizada: {formatDateTime(article.updated_at)}</p>
                    <p>Publicada: {formatDateTime(article.published_at)}</p>
                  </div>
                  {article.source_url && (
                    <a href={article.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-ocean-700">
                      Fonte: {article.source_name || article.source_url}
                    </a>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/noticias/${article.slug}`} className="rounded-2xl border border-ocean-200 px-4 py-2 text-xs font-semibold text-ocean-700">
                      Previsualizar
                    </Link>
                    {article.status !== 'published' && (
                      <form action={updateNewsStatus}>
                        <input type="hidden" name="id" value={article.id} />
                        <input type="hidden" name="status" value="published" />
                        <button className="rounded-2xl bg-green-600 px-4 py-2 text-xs font-semibold text-white">
                          Publicar
                        </button>
                      </form>
                    )}
                    {article.status === 'published' && (
                      <form action={updateNewsStatus}>
                        <input type="hidden" name="id" value={article.id} />
                        <input type="hidden" name="status" value="draft" />
                        <button className="rounded-2xl border border-sand-300 px-4 py-2 text-xs font-semibold text-slate-700">
                          Não publicar
                        </button>
                      </form>
                    )}
                    {article.status !== 'archived' && (
                      <form action={updateNewsStatus}>
                        <input type="hidden" name="id" value={article.id} />
                        <input type="hidden" name="status" value="archived" />
                        <button className="rounded-2xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700">
                          Arquivar
                        </button>
                      </form>
                    )}
                  </div>

                  <details className="mt-5 border-t border-sand-100 pt-4 dark:border-slate-800">
                    <summary className="cursor-pointer text-sm font-bold text-ocean-700">
                      Editar noticia e imagem
                    </summary>
                    <form action={updateNewsArticle} className="mt-4 grid gap-3">
                      <input type="hidden" name="id" value={article.id} />
                      <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Titulo
                        <input name="title" defaultValue={article.title} className="h-11 border border-sand-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Categoria
                        <input name="category" defaultValue={article.category} className="h-11 border border-sand-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Imagem
                        <input name="image_url" defaultValue={article.image_url ?? ''} placeholder="URL da imagem" className="h-11 border border-sand-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Resumo
                        <textarea name="excerpt" defaultValue={article.excerpt} rows={3} className="border border-sand-200 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Conteudo
                        <textarea name="content" defaultValue={article.content} rows={7} className="border border-sand-200 px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Nome da fonte
                          <input name="source_name" defaultValue={article.source_name ?? ''} className="h-11 border border-sand-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-950" />
                        </label>
                        <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Link da fonte
                          <input name="source_url" defaultValue={article.source_url ?? ''} className="h-11 border border-sand-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-950" />
                        </label>
                      </div>
                      <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-ocean-700 px-5 text-sm font-bold text-white md:w-fit">
                        Salvar alteracoes
                      </button>
                    </form>
                  </details>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
