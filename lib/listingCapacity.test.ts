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
  assert.equal(getFreeActiveLimit('corretor'), 5);
  assert.equal(getFreeActiveLimit('imobiliaria'), 10);
});

test('covered limits use plan when present without stacking free quota', () => {
  assert.equal(getCoveredActiveLimit('corretor', null), 5);
  assert.equal(getCoveredActiveLimit('corretor', 'corretor'), 15);
  assert.equal(getCoveredActiveLimit('imobiliaria', null), 10);
  assert.equal(getCoveredActiveLimit('imobiliaria', 'imobiliaria'), 40);
  assert.equal(getCoveredActiveLimit('imobiliaria', 'plus'), 80);
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
  const withinFree = resolveListingCapacity({ accountType: 'corretor', activeCount: 4 });
  const sixth = resolveListingCapacity({ accountType: 'corretor', activeCount: 5 });
  assert.equal(withinFree.action, 'allow_free');
  assert.equal(sixth.action, 'require_avulso');
  if (sixth.action === 'require_avulso') {
    assert.equal(sixth.amount, 29.9);
    assert.equal(sixth.durationDays, 30);
  }
});

test('corretor with plan covers 15 and then charges avulsos without changing account type', () => {
  const covered = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 6 });
  const fifteenth = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 14 });
  const sixteenth = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 15 });
  const seventeenth = resolveListingCapacity({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 16 });
  assert.equal(covered.action, 'allow_plan');
  assert.equal(fifteenth.action, 'allow_plan');
  assert.equal(sixteenth.action, 'require_avulso');
  assert.equal(seventeenth.action, 'require_avulso');
  if (sixteenth.action === 'require_avulso') {
    assert.equal(sixteenth.amount, 29.9);
    assert.equal(sixteenth.durationDays, 30);
  }

  const snapshot = buildCapacitySnapshot({
    accountType: 'corretor',
    professionalPlan: 'corretor',
    activeCount: 17
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
    activeCount: 40
  });
  const proOk = resolveListingCapacity({
    accountType: 'imobiliaria',
    professionalPlan: 'plus',
    activeCount: 40
  });
  const proExtra = resolveListingCapacity({
    accountType: 'imobiliaria',
    professionalPlan: 'plus',
    activeCount: 80
  });
  assert.equal(needsExtra.action, 'require_avulso');
  assert.equal(proOk.action, 'allow_plan');
  assert.equal(proExtra.action, 'require_avulso');
  if (needsExtra.action === 'require_avulso') {
    assert.equal(needsExtra.amount, 29.9);
  }
});

test('import never opens paid slots', () => {
  assert.equal(getImportableSlotCount({ accountType: 'corretor', activeCount: 1 }), 4);
  assert.equal(getImportableSlotCount({ accountType: 'corretor', activeCount: 5 }), 0);
  assert.equal(getImportableSlotCount({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 5 }), 10);
  assert.equal(getImportableSlotCount({ accountType: 'imobiliaria', activeCount: 10 }), 0);
  assert.equal(getImportableSlotCount({ accountType: 'imobiliaria', professionalPlan: 'imobiliaria', activeCount: 10 }), 30);
  assert.equal(getImportableSlotCount({ accountType: 'corretor', professionalPlan: 'corretor', activeCount: 15 }), 0);
});

test('plan recommendation is derived from avulso total versus plan price', () => {
  assert.equal(getRecommendedCapacityPlan('corretor', null), 'corretor');
  assert.equal(getRecommendedCapacityPlan('imobiliaria', null), 'imobiliaria');
  assert.equal(getRecommendedCapacityPlan('corretor', 'corretor'), null);
  assert.equal(extrasNeededToBeatPlan(PLANS.professional.corretor.price), 7);
  assert.equal(extrasNeededToBeatPlan(PLANS.professional.imobiliaria.price), 12);

  const eleventh = buildCapacitySnapshot({ accountType: 'corretor', activeCount: 10 });
  const twelfth = buildCapacitySnapshot({ accountType: 'corretor', activeCount: 11 });
  assert.equal(eleventh.avulsoCostAfterPublish, 6 * 29.9);
  assert.equal(eleventh.nearPlan, true);
  assert.equal(eleventh.highlightPlan, false);
  assert.equal(eleventh.recommendPlan, true);
  assert.equal(twelfth.avulsoCostAfterPublish, 7 * 29.9);
  assert.equal(twelfth.highlightPlan, true);
  assert.equal(twelfth.nearPlan, false);
  assert.equal(twelfth.recommendPlan, true);

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
      freeLimit: 5,
      avulsoActiveCount: 0,
      extraActiveCount: 0,
      coveredLimit: 5
    }),
    '2 de 5 imóveis grátis utilizados'
  );
  assert.equal(
    getDashboardUsageLabel({
      hasPlan: false,
      activeCount: 7,
      paidLimit: null,
      freeUsed: 5,
      freeLimit: 5,
      avulsoActiveCount: 2,
      extraActiveCount: 2,
      coveredLimit: 5
    }),
    '5 grátis + 2 anúncios avulsos ativos'
  );
  assert.equal(
    getDashboardUsageLabel({
      hasPlan: true,
      activeCount: 7,
      paidLimit: 15,
      freeUsed: 5,
      freeLimit: 5,
      avulsoActiveCount: 0,
      extraActiveCount: 0,
      coveredLimit: 15
    }),
    '7 de 15 imóveis utilizados'
  );
  assert.equal(
    getDashboardUsageLabel({
      hasPlan: true,
      activeCount: 17,
      paidLimit: 15,
      freeUsed: 5,
      freeLimit: 5,
      avulsoActiveCount: 2,
      extraActiveCount: 2,
      coveredLimit: 15
    }),
    '15 do plano + 2 anúncios avulsos ativos'
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
