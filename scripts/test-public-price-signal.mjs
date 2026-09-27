/**
 * Public vs owner access contract for Preço Justo RN.
 * Usage: node --experimental-strip-types scripts/test-public-price-signal.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const {
  PRECO_JUSTO_UNAUTHORIZED_BODY,
  PRECO_JUSTO_UNAUTHORIZED_STATUS,
  canAccessPrecoJustoAdvisorApi,
  getPrecoJustoAdvisorApiAuthRejection,
  getPrecoJustoSerializedPayload,
  getPublicPrecoJustoDomStrings,
  getSensitiveKeysInPublicPayload,
  resolvePrecoJustoViewer,
  selectPrecoJustoPresentation,
  toPublicPriceSignal
} = await import('../lib/publicPriceSignal.ts');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function makeInsight(overrides = {}) {
  return {
    verdict: 'fair',
    listingPrice: 890000,
    medianPrice: 949750,
    minPrice: 835780,
    maxPrice: 1063720,
    percentVsMedian: -6,
    scope: 'neighborhood',
    scopeLabel: 'Lagoa Nova',
    pricePerSqm: 7598,
    estimatedAreaSqm: 125,
    source: 'FipeZAP Natal + ajuste de bairro',
    referencePeriod: 'agosto/2026',
    isApproximate: false,
    priceUnit: 'sale',
    dataTier: 'fipezap_neighborhood',
    sampleCount: 0,
    title: 'Preço alinhado ao índice FipeZAP',
    summary: 'Você pede R$ 890.000, próximo da referência no bairro Lagoa Nova.',
    tip: 'Valor competitivo frente a referências publicadas.',
    estimatedValue: 949750,
    confidenceScore: 57,
    pillars: [
      { key: 'geo', label: 'Geolocalização', weight: 0.2, summary: 'Localização com leve prêmio regional.', signal: '+2%' },
      { key: 'property', label: 'Imóvel e mídia', weight: 0.2, summary: 'Qualidade do anúncio.', signal: '68/100' }
    ],
    ...overrides
  };
}

const SENSITIVE_LEAK_PATTERNS = [
  /890000/,
  /890\.000/,
  /949750/,
  /949\.750/,
  /835780/,
  /1063720/,
  /7598/,
  /percentVsMedian/,
  /confidenceScore/,
  /estimatedValue/,
  /medianPrice/,
  /listingPrice/,
  /pricePerSqm/,
  /pillars/,
  /Você pede/,
  /Seu preço/,
  /Confiança da estimativa/,
  /Geolocalização/,
  /Imóvel e mídia/,
  /Como calculamos/,
  /R\$\s*890/,
  /\+2%/,
  /68\/100/,
  /-6%/
];

function assertNoSensitiveLeak(label, value) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  for (const pattern of SENSITIVE_LEAK_PATTERNS) {
    assert.equal(pattern.test(serialized), false, `${label} leaked ${pattern}`);
  }
  if (typeof value === 'object' && value) {
    assert.deepEqual(getSensitiveKeysInPublicPayload(value), [], `${label} still has seller-only keys`);
    if ('signal' in value) {
      assert.deepEqual(getSensitiveKeysInPublicPayload(value.signal), [], `${label}.signal still has seller-only keys`);
    }
    if ('props' in value && value.props?.signal) {
      assert.deepEqual(getSensitiveKeysInPublicPayload(value.props.signal), [], `${label}.props.signal still has seller-only keys`);
      assert.equal('insight' in value.props, false, `${label} must not serialize insight`);
    }
  }
}

const insight = makeInsight();

const unauthenticated = selectPrecoJustoPresentation(null, 'owner-1', insight);
const authenticatedNonOwner = selectPrecoJustoPresentation('buyer-1', 'owner-1', insight);
const authenticatedOwner = selectPrecoJustoPresentation('owner-1', 'owner-1', insight);

assert.equal(unauthenticated.kind, 'public');
assert.equal(authenticatedNonOwner.kind, 'public');
assert.equal(authenticatedOwner.kind, 'owner');
assert.deepEqual(unauthenticated.signal, authenticatedNonOwner.signal);

for (const [label, presentation] of [
  ['unauthenticated public visitor', unauthenticated],
  ['authenticated non-owner', authenticatedNonOwner]
]) {
  const payload = getPrecoJustoSerializedPayload(presentation);
  assert.equal(payload.component, 'PublicPrecoJustoSignal');
  assert.equal(payload.props.signal.title, 'Preço dentro da faixa da região');
  assertNoSensitiveLeak(`${label} payload`, payload);
  assertNoSensitiveLeak(`${label} signal`, payload.props.signal);
  const dom = getPublicPrecoJustoDomStrings(payload.props.signal);
  assertNoSensitiveLeak(`${label} DOM strings`, dom.join(' | '));
  assert.match(dom.join(' '), /Não é uma avaliação oficial/);
}

const ownerPayload = getPrecoJustoSerializedPayload(authenticatedOwner);
assert.equal(ownerPayload.component, 'PrecoJustoRNCard');
assert.equal(ownerPayload.props.insight.medianPrice, 949750);
assert.equal(ownerPayload.props.insight.percentVsMedian, -6);
assert.equal(ownerPayload.props.insight.confidenceScore, 57);
assert.equal(ownerPayload.props.insight.pillars.length, 2);
assert.equal(ownerPayload.props.insight.pricePerSqm, 7598);
assert.match(ownerPayload.props.insight.summary, /Você pede/);

assert.equal(resolvePrecoJustoViewer(undefined, 'owner-1'), 'public');
assert.equal(resolvePrecoJustoViewer('', 'owner-1'), 'public');
assert.equal(resolvePrecoJustoViewer('owner-1', ''), 'public');
assert.equal(resolvePrecoJustoViewer('owner-1', 'owner-1'), 'owner');
assert.equal(
  selectPrecoJustoPresentation('buyer-1', 'owner-1', insight, { viewer: 'owner', fromQuery: 'owner' }).kind,
  'public',
  'extra client-like args cannot promote a non-owner'
);

const below = toPublicPriceSignal(makeInsight({ listingPrice: 700000, minPrice: 835780, maxPrice: 1063720, verdict: 'below' }));
assert.equal(below?.title, 'Preço abaixo da faixa da região');
assertNoSensitiveLeak('below-range signal', below);

const above = toPublicPriceSignal(makeInsight({ listingPrice: 1200000, minPrice: 835780, maxPrice: 1063720, verdict: 'above' }));
assert.equal(above?.title, 'Preço acima da faixa da região');
assertNoSensitiveLeak('above-range signal', above);

assert.equal(selectPrecoJustoPresentation(null, 'owner-1', makeInsight({ verdict: 'insufficient_data', medianPrice: 0 })).kind, 'none');

const sectionSource = readFileSync(join(root, 'components/ListingPrecoJustoSection.tsx'), 'utf8');
assert.match(sectionSource, /supabase\.auth\.getUser\(\)/);
assert.match(sectionSource, /selectPrecoJustoPresentation\(userId, property\.ownerId, insight\)/);
assert.equal(/searchParams/.test(sectionSource), false);
assert.equal(/audience/.test(sectionSource), false);
assert.equal(/viewer=/.test(sectionSource), false);

const pageSource = readFileSync(join(root, 'app/imoveis/[slug]/page.tsx'), 'utf8');
assert.match(pageSource, /<ListingPrecoJustoSection property=\{property\} \/>/);
assert.match(pageSource, /owner_id: data\.owner_id/);
assert.equal(/audience=/.test(pageSource), false);

const publicUiSource = readFileSync(join(root, 'components/PublicPrecoJustoSignal.tsx'), 'utf8');
assert.equal(/use client/.test(publicUiSource), false);
assert.equal(/data-/.test(publicUiSource), false);
assert.equal(/dangerouslySetInnerHTML/.test(publicUiSource), false);
assert.equal(/JSON\.stringify/.test(publicUiSource), false);
assert.equal(/insight/.test(publicUiSource), false);
assert.equal(/medianPrice|percentVsMedian|confidenceScore|pillars/.test(publicUiSource), false);

assert.equal(canAccessPrecoJustoAdvisorApi(null), false);
assert.equal(canAccessPrecoJustoAdvisorApi(undefined), false);
assert.equal(canAccessPrecoJustoAdvisorApi({}), false);
assert.equal(canAccessPrecoJustoAdvisorApi({ id: '' }), false);
assert.equal(canAccessPrecoJustoAdvisorApi({ id: 'user-1' }), true);

const anonymousApi = getPrecoJustoAdvisorApiAuthRejection(null);
assert.ok(anonymousApi);
assert.equal(anonymousApi.status, PRECO_JUSTO_UNAUTHORIZED_STATUS);
assert.equal(anonymousApi.status, 401);
assert.deepEqual(anonymousApi.body, PRECO_JUSTO_UNAUTHORIZED_BODY);
assert.equal('insight' in anonymousApi.body, false);
assertNoSensitiveLeak('anonymous API rejection', anonymousApi.body);
assert.deepEqual(getSensitiveKeysInPublicPayload(anonymousApi.body), []);

assert.equal(getPrecoJustoAdvisorApiAuthRejection({ id: 'advertiser-1' }), null);

const apiSource = readFileSync(join(root, 'app/api/preco-justo/route.ts'), 'utf8');
const authIndex = apiSource.indexOf('getPrecoJustoAdvisorApiAuthRejection(user)');
const calcIndex = apiSource.indexOf('await buildPriceInsight(insightInput)');
const insightResponseIndex = apiSource.indexOf('NextResponse.json({ insight })');
assert.ok(authIndex >= 0, 'API must use the shared auth rejection helper');
assert.ok(apiSource.includes("supabase.auth.getUser()"), 'API must use Supabase getUser()');
assert.ok(apiSource.includes("createClient()"), 'API must use the app server Supabase client');
assert.ok(calcIndex > authIndex, 'API must reject anonymous callers before calculating PriceInsight');
assert.ok(apiSource.indexOf('await request.json()') > authIndex, 'API must reject anonymous callers before reading listing inputs');
assert.ok(insightResponseIndex > calcIndex, 'authenticated advisor contract still returns { insight }');
assert.equal(/get_public_approved_listing|owner_id ===/.test(apiSource), false);
assert.equal(/view=public|PublicPriceSignal/.test(apiSource), false);

const ownerCardSource = readFileSync(join(root, 'components/PrecoJustoRNCard.tsx'), 'utf8');
assert.match(ownerCardSource, /Seu preço/);
assert.match(ownerCardSource, /Confiança da estimativa/);
assert.match(ownerCardSource, /insight\.pillars/);
assert.match(ownerCardSource, /Como calculamos/);
assert.match(ownerCardSource, /insight\.percentVsMedian/);
assert.equal(/audience/.test(ownerCardSource), false);
assert.equal(/isPublic/.test(ownerCardSource), false);

console.log('test-public-price-signal: ok');
