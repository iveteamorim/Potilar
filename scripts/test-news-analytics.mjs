/**
 * First-party news analytics contract.
 * Usage: node --experimental-strip-types scripts/test-news-analytics.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NEWS_SHARE_HELP_TEXT,
  aggregateNewsEvents,
  authorizeNewsTrack,
  buildNewsShareUrl,
  canTrackPublishedNewsArticle,
  emptyNewsArticleMetrics,
  isNativeShareAbortError,
  metricsFromRpcRow,
  normalizeNewsTrackEvent,
  parseNewsShareMarker,
  shareActionToKind,
  shouldCountCopy,
  shouldCountNativeShare
} from '../lib/newsAnalytics.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'view' }).ok, true);
assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'share_whatsapp', surface: 'article' }).ok, true);
assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'share_copy', surface: 'card' }).ok, true);
assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'share_native', surface: 'article' }).ok, true);

assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'share_completed' }).error, 'invalid_kind');
assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'click' }).error, 'invalid_kind');

assert.equal(
  normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'view', shareChannel: 'telegram' }).error,
  'invalid_share_channel'
);
assert.equal(
  normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'view', shareChannel: 'wa' }).error,
  'invalid_share_channel'
);

assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'view', surface: 'article' }).error, 'invalid_surface');
assert.equal(normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'share_whatsapp' }).error, 'invalid_surface');
assert.equal(
  normalizeNewsTrackEvent({ slug: 'cobertura-pipa', kind: 'share_copy', surface: 'home' }).error,
  'invalid_surface'
);

assert.equal(canTrackPublishedNewsArticle({ status: 'published' }), true);
assert.equal(canTrackPublishedNewsArticle({ status: 'draft' }), false);
assert.equal(canTrackPublishedNewsArticle({ status: 'archived' }), false);
assert.equal(canTrackPublishedNewsArticle(null), false);
assert.equal(
  authorizeNewsTrack({ slug: 'rascunho', kind: 'view' }, { status: 'draft' }).error,
  'unpublished'
);
assert.equal(
  authorizeNewsTrack({ slug: 'publicado', kind: 'view' }, { status: 'published' }).ok,
  true
);

const normalView = normalizeNewsTrackEvent({ slug: 'casa-pipa', kind: 'view' });
assert.equal(normalView.ok, true);
assert.equal(normalView.event.shareChannel, null);
assert.equal(normalView.event.surface, null);

assert.equal(parseNewsShareMarker('wa'), 'whatsapp');
assert.equal(parseNewsShareMarker('cp'), 'copy');
assert.equal(parseNewsShareMarker('ns'), 'native');
assert.equal(parseNewsShareMarker('whatsapp'), null);
assert.equal(parseNewsShareMarker('utm_source'), null);
assert.equal(parseNewsShareMarker('hack'), null);
assert.equal(parseNewsShareMarker(''), null);

const attributedView = normalizeNewsTrackEvent({
  slug: 'casa-pipa',
  kind: 'view',
  shareChannel: parseNewsShareMarker('wa')
});
assert.equal(attributedView.ok, true);
assert.equal(attributedView.event.kind, 'view');
assert.equal(attributedView.event.shareChannel, 'whatsapp');

const unmarkedView = normalizeNewsTrackEvent({
  slug: 'casa-pipa',
  kind: 'view',
  shareChannel: parseNewsShareMarker('facebook')
});
assert.equal(unmarkedView.ok, true);
assert.equal(unmarkedView.event.shareChannel, null);

assert.equal(shareActionToKind('whatsapp'), 'share_whatsapp');
assert.equal(shareActionToKind('copy'), 'share_copy');
assert.equal(shareActionToKind('native'), 'share_native');

assert.equal(shouldCountCopy(true), true);
assert.equal(shouldCountCopy(false), false);
assert.equal(shouldCountNativeShare('resolved'), true);
assert.equal(shouldCountNativeShare('rejected'), false);
assert.equal(isNativeShareAbortError({ name: 'AbortError' }), true);
assert.equal(isNativeShareAbortError({ name: 'NotAllowedError' }), false);
assert.equal(shouldCountNativeShare(isNativeShareAbortError({ name: 'AbortError' }) ? 'rejected' : 'resolved'), false);

const articleShare = normalizeNewsTrackEvent({ slug: 'casa-pipa', kind: 'share_whatsapp', surface: 'article' });
const cardShare = normalizeNewsTrackEvent({ slug: 'casa-pipa', kind: 'share_copy', surface: 'card' });
assert.equal(articleShare.event.surface, 'article');
assert.equal(cardShare.event.surface, 'card');
assert.equal(articleShare.event.shareChannel, null);

const metrics = aggregateNewsEvents([
  { kind: 'view', share_channel: null },
  { kind: 'view', share_channel: null },
  { kind: 'view', share_channel: 'whatsapp' },
  { kind: 'view', share_channel: 'copy' },
  { kind: 'share_whatsapp' },
  { kind: 'share_whatsapp' },
  { kind: 'share_copy' },
  { kind: 'share_native' }
]);
assert.deepEqual(metrics, {
  views: 4,
  shareActions: 4,
  shareWhatsapp: 2,
  shareCopy: 1,
  shareNative: 1,
  visitsFromShare: 2,
  visitsFromWhatsapp: 1,
  visitsFromCopy: 1,
  visitsFromNative: 0
});
assert.equal(metrics.views, 4);
assert.equal(metrics.visitsFromShare, 2);
assert.notEqual(metrics.views, metrics.visitsFromShare);

assert.deepEqual(emptyNewsArticleMetrics().views, 0);
assert.equal(metricsFromRpcRow({ views: '12', share_actions: 3 }).views, 12);
assert.equal(metricsFromRpcRow({ views: '12', share_actions: 3 }).shareActions, 3);

assert.match(
  buildNewsShareUrl('https://potilar.com.br/noticias/casa-pipa', 'whatsapp'),
  /[?&]s=wa\b/
);
assert.match(buildNewsShareUrl('https://potilar.com.br/noticias/casa-pipa', 'copy'), /[?&]s=cp\b/);
assert.match(buildNewsShareUrl('https://potilar.com.br/noticias/casa-pipa', 'native'), /[?&]s=ns\b/);
assert.equal(new URL(buildNewsShareUrl('https://potilar.com.br/noticias/casa-pipa', 'whatsapp')).pathname, '/noticias/casa-pipa');

const shareButtons = read('components/ShareButtons.tsx');
assert.match(shareButtons, /Olha este imóvel na Potilar: \$\{title\} \$\{url\}/);
assert.match(shareButtons, /await navigator\.clipboard\.writeText\(url\)/);
assert.match(shareButtons, /onShareAction\?\.\('whatsapp'\)/);
assert.match(shareButtons, /onShareAction\?\.\('copy'\)/);
assert.match(shareButtons, /onShareAction\?\.\('native'\)/);
assert.match(shareButtons, /shouldCountNativeShare\('resolved'\)/);
assert.match(shareButtons, /isNativeShareAbortError\(error\)/);
assert.match(shareButtons, /setMenuOpen\(\(open\) => !open\)/);
const menuToggleChunk = shareButtons.slice(
  shareButtons.indexOf('setMenuOpen((open) => !open)'),
  shareButtons.indexOf('setMenuOpen((open) => !open)') + 40
);
assert.equal(menuToggleChunk.includes('onShareAction'), false);
assert.match(shareButtons, /buildNewsShareUrl\(url, 'whatsapp'\)/);
const toolbarBlock = shareButtons.slice(shareButtons.indexOf('if (toolbar)'), shareButtons.indexOf('if (compact)'));
assert.match(toolbarBlock, /whatsappHref/);
assert.equal(toolbarBlock.includes('onShareAction'), false);
assert.equal(toolbarBlock.includes('copyNewsLink'), false);
assert.match(toolbarBlock, /onClick=\{copyLink\}/);

const listingPage = read('app/imoveis/[slug]/page.tsx');
assert.match(listingPage, /<ShareButtons title=\{displayTitle\} url=\{detailUrl\} toolbar \/>/);
assert.equal(listingPage.includes('onShareAction'), false);
assert.equal(listingPage.includes('attribution'), false);
assert.equal(listingPage.includes('NewsShareButtons'), false);
assert.equal(listingPage.includes('?s=wa'), false);

const articlePage = read('app/noticias/[slug]/page.tsx');
assert.match(articlePage, /canonical: `\/noticias\/\$\{params\.slug\}`/);
assert.match(articlePage, /const articleUrl = `https:\/\/potilar\.com\.br\/noticias\/\$\{article\.slug\}`/);
assert.match(articlePage, /parseNewsShareMarker\(searchParams\?\.s\)/);
assert.match(articlePage, /<NewsViewTracker slug=\{article\.slug\} shareChannel=\{shareChannel\} \/>/);
assert.match(articlePage, /surface="article"/);
assert.equal(articlePage.includes('view_from_share'), false);
assert.equal(/canonical: `\/noticias\/\$\{params\.slug\}\?s=/.test(articlePage), false);

const newsList = read('app/noticias/page.tsx');
assert.match(newsList, /surface="card"/);
assert.equal(newsList.includes('NewsViewTracker'), false);

const homePage = read('app/page.tsx');
assert.match(homePage, /surface="card"/);
assert.equal(homePage.includes('NewsViewTracker'), false);

const apiSource = read('app/api/news/stats/route.ts');
assert.match(apiSource, /normalizeNewsTrackEvent\(body\)/);
assert.match(apiSource, /track_news_event/);
assert.match(apiSource, /status: 400/);
assert.match(apiSource, /status: 404/);
assert.ok(apiSource.indexOf('normalizeNewsTrackEvent') < apiSource.indexOf("rpc('track_news_event'"));
assert.equal(apiSource.includes('.from(\'news_events\')'), false);

const sql = read('supabase/news_events.sql');
assert.match(sql, /create table if not exists public\.news_events/);
assert.match(sql, /created_at timestamptz/);
assert.match(sql, /status = 'published'/);
assert.match(sql, /revoke all on public\.news_events from anon/);
assert.match(sql, /grant select on public\.news_events to authenticated/);
assert.match(sql, /Admins can read news events/);
assert.match(sql, /profiles\.role = 'admin'/);
assert.match(sql, /grant execute on function public\.track_news_event/);
assert.match(sql, /grant execute on function public\.get_news_article_metrics/);
assert.equal(/grant insert on public\.news_events/.test(sql), false);
assert.equal(/user_agent|ip_address|user_id|auth\.uid\(\) as/.test(sql), false);
assert.match(sql, /if auth\.uid\(\) is null/);

const adminNews = read('app/admin/news/page.tsx');
assert.match(adminNews, /get_news_article_metrics/);
assert.match(adminNews, /Visualizações/);
assert.match(adminNews, /Ações de compartilhamento/);
assert.match(adminNews, /Visitas via compartilhamentos/);
assert.match(adminNews, /NEWS_SHARE_HELP_TEXT/);
assert.equal(
  NEWS_SHARE_HELP_TEXT,
  'Ações de compartilhamento registram a ação no PotiLar; não confirmam que o conteúdo foi enviado ao destinatário.'
);
assert.equal(adminNews.includes('ensureAdmin') || adminNews.includes("profile?.role !== 'admin'"), true);
assert.equal(adminNews.includes('.from(\'news_events\')'), false);

const viewTracker = read('components/NewsViewTracker.tsx');
assert.match(viewTracker, /kind: 'view'/);
assert.equal(viewTracker.includes('share_whatsapp'), false);

const newsShare = read('components/NewsShareButtons.tsx');
assert.match(newsShare, /shareActionToKind\(action\)/);
assert.match(newsShare, /attribution/);
assert.match(newsShare, /onShareAction/);

console.log('test-news-analytics: ok');
