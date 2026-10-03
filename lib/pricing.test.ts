import assert from 'node:assert/strict';
import test from 'node:test';
import { formatMapMarkerPrice, formatPrice } from './pricing';

test('map pin keeps exact price below 10 thousand', () => {
  assert.equal(formatMapMarkerPrice({ price: 1500, transaction: 'Aluguel' }), formatPrice(1500));
  assert.equal(formatMapMarkerPrice({ price: 9999, transaction: 'Aluguel' }), formatPrice(9999));
  assert.equal(formatMapMarkerPrice({ price: 800, transaction: 'Aluguel' }), formatPrice(800));
});

test('map pin uses mil only from 10 thousand', () => {
  assert.equal(formatMapMarkerPrice({ price: 10000, transaction: 'Compra' }), 'R$ 10 mil');
  assert.equal(formatMapMarkerPrice({ price: 15499, transaction: 'Compra' }), 'R$ 15 mil');
});

test('map pin uses mi from 1 million', () => {
  assert.equal(formatMapMarkerPrice({ price: 1_500_000, transaction: 'Compra' }), 'R$ 1,5 mi');
});
