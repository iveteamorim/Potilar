/**
 * Presentation-only card title casing.
 * Usage: node --experimental-strip-types scripts/test-display-title.mjs
 */
import assert from 'node:assert/strict';
import { formatPropertyCardTitle, getCleanPropertyTitle } from '../lib/displayTitle.ts';

assert.equal(
  formatPropertyCardTitle('COBERTURA DUPLEX SMILE VILLAGE'),
  'Cobertura Duplex Smile Village'
);

assert.equal(
  formatPropertyCardTitle('CASA A VENDA – SÃO GONÇALO DO AMARANTE'),
  'Casa a Venda – São Gonçalo do Amarante'
);

const mixed = 'Casa 3 dormitórios, cozinha integrada';
assert.equal(formatPropertyCardTitle(mixed), mixed);

const alreadyLower = 'casa a venda em pipa';
assert.equal(formatPropertyCardTitle(alreadyLower), alreadyLower);

assert.equal(
  formatPropertyCardTitle('APARTAMENTO EM PIPA RN'),
  'Apartamento em Pipa RN'
);

assert.equal(
  formatPropertyCardTitle('TERRENO PARA VENDA'),
  'Terreno para Venda'
);

assert.equal(
  formatPropertyCardTitle('CASA DOS FLAMBOYANTS'),
  'Casa dos Flamboyants'
);

assert.equal(
  formatPropertyCardTitle('APARTAMENTO COM IPTU INCLUSO'),
  'Apartamento com IPTU Incluso'
);

assert.equal(
  formatPropertyCardTitle('CASA  NO  CONDOMÍNIO'),
  'Casa  no  Condomínio'
);

assert.equal(formatPropertyCardTitle('123 – 45'), '123 – 45');
assert.equal(formatPropertyCardTitle(''), '');

assert.equal(
  formatPropertyCardTitle('COBERTURA D’ÁVILA'),
  'Cobertura D’Ávila'
);

const cleaned = getCleanPropertyTitle({
  title: 'COBERTURA DUPLEX SMILE VILLAGE, Pipa',
  location: 'Pipa',
  neighborhood: '',
  community: ''
});
assert.equal(cleaned, 'COBERTURA DUPLEX SMILE VILLAGE');
assert.equal(formatPropertyCardTitle(cleaned), 'Cobertura Duplex Smile Village');

console.log('test-display-title: ok');
