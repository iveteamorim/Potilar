import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCapacitySnapshot,
  countCapacityActiveListings,
  extrasNeededToBeatPlan,
  getAvulsoOffer,
  getCoveredActiveLimit,
  getDashboardUsageLabel,
  getFreeActiveLimit,
  getImportableSlotCount,
  getRecommendedCapacityPlan,
  isAvulsoListing,
  isPlanAllowedForAccount,
  isTrustedPaidAvulso,
  listingCanOccupyExtraSlot,
  ownerPaymentWriteAllowed,
  resolveListingCapacity,
  resolvePlanRecommendation,
  selectListingsToKeepAfterPlanLoss
} from './listingCapacity';
import { PLANS } from './plans';

test('free limits by account type', () => {
  assert.equal(getFreeActiveLimit('particular'), 2);
  assert.equal(getFreeActiveLimit('corretor'), 3);
  assert.equal(getFreeActiveLimit('imobiliaria'), 10);
});

test('covered limits use plan when present without stacking free quota', () => {
  assert.equal(getCoveredActiveLimit('corretor', null), 3);
  assert.equal(getCoveredActiveLimit('corretor', 'corretor'), 10);
  assert.equal(getCoveredActiveLimit('imobiliaria', null), 10);
  assert.equal(getCoveredActiveLimit('imobiliaria', 'imobiliaria'), 30);
  assert.equal(getCoveredActiveLimit('imobiliaria', 'plus'), 75);
});

test('paused and needs_renewal do not consume capacity', () => {
  const count = countCapacityActiveListings([
    { id: '1', status: 'approved' },
    { id: '2', status: 'pending' },
    { id: '3', status: 'paused' },
    { id: '4', status: 'needs_renewal' }
  ]);
  assert.equal(count, 2);
});

test('proprietario third listing uses the shared avulso', () => {
  const first = resolveListingCapacity({ accountType: 'particular', activeCount: 0 });
  const third = resolveListingCapacity({ accountType: 'particular', activeCount: 2 });
  assert.equal(first.action, 'allow_free');
  assert.equal(third.action, 'require_avulso');
  if (third.action === 'require_avulso') {
    assert.equal(third.amount, 29.9);
    assert.equal(third.durationDays, 30);
  }
});

test('corretor can create account capacity without paying a plan', () => {
  const withinFree = resolveListingCapacity({ accountType: 'corretor', activeCount: 2 });
  const fourth = resolveListingCapacity({ accountType: 'corretor', activeCount: 3 });
  assert.equal(withinFree.action, 'allow_free');
  assert.equal(fourth.action, 'require_avulso');
  if (fourth.action === 'require_avulso') {
    assert.equal(fourth.amount, 29.9);
    assert.equal(fourth.durationDays, 30);
  }
});

test('corretor with plan covers 10 and then charges avulsos without changing account type', () => {
  const covered = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 6 });
  const tenth = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 9 });
  const eleventh = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 10 });
  const twelfth = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 11 });
  const fifteenth = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 14 });
  assert.equal(covered.action, 'allow_plan');
  assert.equal(tenth.action, 'allow_plan');
  assert.equal(eleventh.action, 'require_avulso');
  assert.equal(twelfth.action, 'require_avulso');
  assert.equal(fifteenth.action, 'require_avulso');
  if (eleventh.action === 'require_avulso') {
    assert.equal(eleventh.amount, 29.9);
    assert.equal(eleventh.durationDays, 30);
  }

  const snapshot = buildCapacitySnapshot({
    accountType: 'corretor',
    professionalPlan: 'corretor',
    activeCount: 12
  });
  assert.equal(snapshot.accountType, 'corretor');
  assert.equal(snapshot.extraActiveCount, 2);
  assert.equal(snapshot.avulsoCostAfterPublish, 3 * 29.9);
});

test('imobiliaria eleventh listing uses avulso and stays imobiliaria', () => {
  const tenth = resolveListingCapacity({ accountType: 'imobiliaria', activeCount: 9 });
  const eleventh = resolveListingCapacity({ accountType: 'imobiliaria', activeCount: 10 });
  assert.equal(tenth.action, 'allow_free');
  assert.equal(eleventh.action, 'require_avulso');
  if (eleventh.action === 'require_avulso') {
    assert.equal(eleventh.amount, 29.9);
    assert.equal(eleventh.durationDays, 30);
  }
});

test('imobiliaria plan and pro allow avulsos above the plan quota', () => {
  const needsExtra = resolveListingCapacity({
    accountType: 'imobiliaria',
    professionalPlan: 'imobiliaria',
    activeCount: 30
  });
  const proOk = resolveListingCapacity({
    accountType: 'imobiliaria',
    professionalPlan: 'plus',
    activeCount: 30
  });
  const proExtra = resolveListingCapacity({
    accountType: 'imobiliaria',
    professionalPlan: 'plus',
    activeCount: 75
  });
  assert.equal(needsExtra.action, 'require_avulso');
  assert.equal(proOk.action, 'allow_plan');
  assert.equal(proExtra.action, 'require_avulso');
  if (needsExtra.action === 'require_avulso') {
    assert.equal(needsExtra.amount, 29.9);
  }
});

test('import never opens paid slots', () => {
  assert.equal(getImportableSlotCount({ accountType: 'corretor', activeCount: 1 }), 2);
  assert.equal(getImportableSlotCount({ accountType: 'corretor', activeCount: 3 }), 0);
  assert.equal(getImportableSlotCount({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 3 }), 7);
  assert.equal(getImportableSlotCount({ accountType: 'imobiliaria', activeCount: 10 }), 0);
  assert.equal(getImportableSlotCount({ accountType: 'imobiliaria', professionalPlan: 'imobiliaria', activeCount: 10 }), 20);
  assert.equal(getImportableSlotCount({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 10 }), 0);
});

test('plan recommendation is derived from avulso total versus plan price', () => {
  assert.equal(getRecommendedCapacityPlan('corretor', null), 'corretor');
  assert.equal(getRecommendedCapacityPlan('imobiliaria', null), 'imobiliaria');
  assert.equal(getRecommendedCapacityPlan('corretor', 'corretor'), null);
  assert.equal(extrasNeededToBeatPlan(PLANS.professional.corretor.price), 7);
  assert.equal(extrasNeededToBeatPlan(PLANS.professional.imobiliaria.price), 12);

  const ninth = buildCapacitySnapshot({ accountType: 'corretor', activeCount: 8 });
  const tenth = buildCapacitySnapshot({ accountType: 'corretor', activeCount: 9 });
  assert.equal(ninth.avulsoCostAfterPublish, 6 * 29.9);
  assert.equal(ninth.nearPlan, true);
  assert.equal(ninth.highlightPlan, false);
  assert.equal(ninth.recommendPlan, true);
  assert.equal(tenth.avulsoCostAfterPublish, 7 * 29.9);
  assert.equal(tenth.highlightPlan, true);
  assert.equal(tenth.nearPlan, false);

  const imobiliariaNear = resolvePlanRecommendation({
    accountType: 'imobiliaria',
    extrasAfterPublish: 11
  });
  const imobiliariaBest = resolvePlanRecommendation({
    accountType: 'imobiliaria',
    extrasAfterPublish: 12
  });
  assert.equal(imobiliariaNear.nearPlan, true);
  assert.equal(imobiliariaNear.highlightPlan, false);
  assert.equal(imobiliariaBest.highlightPlan, true);
  assert.equal(12 * 29.9 >= PLANS.professional.imobiliaria.price, true);

  const proNear = resolvePlanRecommendation({
    accountType: 'imobiliaria',
    professionalPlan: 'imobiliaria',
    extrasAfterPublish: 8
  });
  const proBest = resolvePlanRecommendation({
    accountType: 'imobiliaria',
    professionalPlan: 'imobiliaria',
    extrasAfterPublish: 9
  });
  assert.equal(proNear.recommendedPlan, 'plus');
  assert.equal(proNear.nearPlan, true);
  assert.equal(proNear.highlightPlan, false);
  assert.equal(proBest.highlightPlan, true);
  assert.equal(9 * 29.9 >= PLANS.professional.plus.price - PLANS.professional.imobiliaria.price, true);
});

test('plan loss keeps the most recently updated active listings', () => {
  const keep = selectListingsToKeepAfterPlanLoss(
    [
      { id: 'old', status: 'approved', updated_at: '2026-01-01T00:00:00.000Z' },
      { id: 'mid', status: 'pending', updated_at: '2026-06-01T00:00:00.000Z' },
      { id: 'new', status: 'approved', updated_at: '2026-09-01T00:00:00.000Z' },
      { id: 'paused', status: 'paused', updated_at: '2026-10-01T00:00:00.000Z' }
    ],
    2
  );
  assert.deepEqual(
    keep.map((listing) => listing.id),
    ['new', 'mid']
  );
});

test('dashboard labels follow the commercial matrix', () => {
  assert.equal(
    getDashboardUsageLabel({
      hasPlan: false,
      activeCount: 2,
      paidLimit: null,
      freeUsed: 2,
      freeLimit: 3,
      avulsoActiveCount: 0,
      extraActiveCount: 0,
      coveredLimit: 3
    }),
    '2 de 3 imóveis grátis utilizados'
  );
  assert.equal(
    getDashboardUsageLabel({
      hasPlan: false,
      activeCount: 5,
      paidLimit: null,
      freeUsed: 3,
      freeLimit: 3,
      avulsoActiveCount: 2,
      extraActiveCount: 2,
      coveredLimit: 3
    }),
    '3 grátis + 2 anúncios avulsos ativos'
  );
  assert.equal(
    getDashboardUsageLabel({
      hasPlan: true,
      activeCount: 7,
      paidLimit: 10,
      freeUsed: 3,
      freeLimit: 3,
      avulsoActiveCount: 0,
      extraActiveCount: 0,
      coveredLimit: 10
    }),
    '7 de 10 imóveis utilizados'
  );
  assert.equal(
    getDashboardUsageLabel({
      hasPlan: true,
      activeCount: 12,
      paidLimit: 10,
      freeUsed: 3,
      freeLimit: 3,
      avulsoActiveCount: 2,
      extraActiveCount: 2,
      coveredLimit: 10
    }),
    '10 do plano + 2 anúncios avulsos ativos'
  );
});

test('avulso offer is the same price for every account type', () => {
  for (const accountType of ['particular', 'corretor', 'imobiliaria'] as const) {
    const offer = getAvulsoOffer(accountType);
    assert.equal(offer.amount, 29.9);
    assert.equal(offer.durationDays, 30);
  }
});

test('plans stay bound to account type and never follow listing volume', () => {
  assert.equal(isPlanAllowedForAccount('corretor', 'corretor'), true);
  assert.equal(isPlanAllowedForAccount('corretor', 'imobiliaria'), false);
  assert.equal(isPlanAllowedForAccount('corretor', 'plus'), false);
  assert.equal(isPlanAllowedForAccount('imobiliaria', 'imobiliaria'), true);
  assert.equal(isPlanAllowedForAccount('imobiliaria', 'plus'), true);
  assert.equal(isPlanAllowedForAccount('imobiliaria', 'corretor'), false);
  assert.equal(isPlanAllowedForAccount('particular', 'corretor'), false);

  const corretorAtFifteen = buildCapacitySnapshot({
    accountType: 'corretor',
    professionalPlan: 'corretor',
    activeCount: 15
  });
  assert.equal(corretorAtFifteen.accountType, 'corretor');
  assert.equal(corretorAtFifteen.decision.action, 'require_avulso');
});

test('owner cannot forge payment_status confirmed on insert or update', () => {
  assert.equal(ownerPaymentWriteAllowed({ payment_status: 'pix_pending' }).ok, true);
  assert.equal(ownerPaymentWriteAllowed({ payment_status: 'not_required' }).ok, true);

  const forgedInsert = ownerPaymentWriteAllowed({ payment_status: 'confirmed' });
  assert.equal(forgedInsert.ok, false);
  if (!forgedInsert.ok) assert.equal(forgedInsert.reason, 'PAYMENT_CONFIRMATION_NOT_ALLOWED');

  const forgedUpdate = ownerPaymentWriteAllowed(
    { payment_status: 'confirmed', payment_confirmed_at: '2026-10-03T00:00:00.000Z' },
    { payment_status: 'pix_pending', payment_confirmed_at: null }
  );
  assert.equal(forgedUpdate.ok, false);
  if (!forgedUpdate.ok) assert.equal(forgedUpdate.reason, 'PAYMENT_CONFIRMATION_NOT_ALLOWED');
});

test('owner cannot forge payment evidence fields', () => {
  const insertWithEvidence = ownerPaymentWriteAllowed({
    payment_status: 'pix_pending',
    payment_confirmed_at: '2026-10-03T00:00:00.000Z',
    listing_expires_at: '2026-11-02T00:00:00.000Z'
  });
  assert.equal(insertWithEvidence.ok, false);
  if (!insertWithEvidence.ok) assert.equal(insertWithEvidence.reason, 'PAYMENT_EVIDENCE_NOT_ALLOWED');

  const updateExpires = ownerPaymentWriteAllowed(
    { payment_status: 'pix_pending', listing_expires_at: '2026-11-02T00:00:00.000Z' },
    { payment_status: 'pix_pending', listing_expires_at: null }
  );
  assert.equal(updateExpires.ok, false);

  const keepConfirmed = ownerPaymentWriteAllowed(
    {
      payment_status: 'confirmed',
      payment_confirmed_at: '2026-10-03T00:00:00.000Z',
      listing_expires_at: '2026-11-02T00:00:00.000Z'
    },
    {
      payment_status: 'confirmed',
      payment_confirmed_at: '2026-10-03T00:00:00.000Z',
      listing_expires_at: '2026-11-02T00:00:00.000Z'
    }
  );
  assert.equal(keepConfirmed.ok, true);
});

test('paid avulso requires server-side confirmation evidence', () => {
  assert.equal(
    isTrustedPaidAvulso({
      publication_kind: 'avulso',
      payment_status: 'confirmed'
    }),
    false
  );
  assert.equal(
    isAvulsoListing({
      publication_kind: 'avulso',
      payment_status: 'pix_pending'
    }),
    false
  );
  assert.equal(
    isTrustedPaidAvulso({
      payment_status: 'confirmed',
      payment_confirmed_at: '2026-10-03T00:00:00.000Z',
      listing_expires_at: '2026-11-02T00:00:00.000Z'
    }),
    true
  );
  assert.equal(listingCanOccupyExtraSlot({ payment_status: 'confirmed' }), false);
  assert.equal(
    listingCanOccupyExtraSlot({
      payment_status: 'confirmed',
      payment_confirmed_at: '2026-10-03T00:00:00.000Z'
    }),
    true
  );
  assert.equal(listingCanOccupyExtraSlot({ payment_status: 'pix_pending' }), true);
});
