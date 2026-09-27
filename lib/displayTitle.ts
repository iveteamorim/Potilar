import type { Property } from '@/data/properties';

const CARD_TITLE_PARTICLES = new Set([
  'a',
  'as',
  'o',
  'os',
  'um',
  'uma',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'por',
  'pelo',
  'pela',
  'para',
  'pra',
  'com',
  'sem',
  'e',
  'ou'
]);

const CARD_TITLE_ACRONYMS = new Set([
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
  'BR',
  'EUA',
  'USA',
  'IPTU',
  'FGTS',
  'MCMV',
  'CEF',
  'CPF',
  'CNPJ',
  'RGI',
  'WC',
  'II',
  'III',
  'IV'
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isEffectivelyAllCaps(title: string) {
  const letters = title.match(/\p{L}/gu);
  if (!letters || letters.length === 0) {
    return false;
  }

  let hasCasedUpper = false;
  for (const letter of letters) {
    const lower = letter.toLocaleLowerCase('pt-BR');
    const upper = letter.toLocaleUpperCase('pt-BR');
    if (lower === upper) {
      continue;
    }
    if (letter !== upper) {
      return false;
    }
    hasCasedUpper = true;
  }

  return hasCasedUpper;
}

function titleCaseLetterRun(part: string) {
  const chars = [...part];
  return `${chars[0].toLocaleUpperCase('pt-BR')}${chars.slice(1).join('').toLocaleLowerCase('pt-BR')}`;
}

function formatCardTitleToken(token: string, isFirstWord: boolean) {
  const letterCore = (token.match(/\p{L}+/gu) ?? []).join('');
  if (!letterCore) {
    return token;
  }

  const lowerCore = letterCore.toLocaleLowerCase('pt-BR');
  const upperCore = letterCore.toLocaleUpperCase('pt-BR');

  if (CARD_TITLE_ACRONYMS.has(upperCore) && !CARD_TITLE_PARTICLES.has(lowerCore)) {
    return token.replace(/\p{L}+/gu, (part) => part.toLocaleUpperCase('pt-BR'));
  }

  if (!isFirstWord && CARD_TITLE_PARTICLES.has(lowerCore)) {
    return token.replace(/\p{L}+/gu, (part) => part.toLocaleLowerCase('pt-BR'));
  }

  return token.replace(/\p{L}+/gu, titleCaseLetterRun);
}

/** Presentation-only: soften ALL CAPS card titles. Leaves mixed/normal casing untouched. */
export function formatPropertyCardTitle(title: string) {
  if (!isEffectivelyAllCaps(title)) {
    return title;
  }

  let isFirstWord = true;
  return title.replace(/[^\s]+/gu, (token) => {
    const formatted = formatCardTitleToken(token, isFirstWord);
    if (/\p{L}/u.test(token)) {
      isFirstWord = false;
    }
    return formatted;
  });
}

export function getCleanPropertyTitle(property: Pick<Property, 'title' | 'location' | 'neighborhood' | 'community'>) {
  let title = property.title.trim();
  const repeatedPlaces = [property.neighborhood, property.community]
    .filter(Boolean)
    .map((value) => escapeRegExp(String(value).trim()))
    .filter(Boolean);

  for (let index = 0; index < 4; index += 1) {
    for (const place of repeatedPlaces) {
      title = title.replace(new RegExp(`,?\\s*${place}\\s*$`, 'i'), '');
    }

    if (property.location) {
      const location = escapeRegExp(property.location.trim());
      title = title.replace(new RegExp(`,?\\s*${location}\\s*$`, 'i'), '');
    }
  }

  title = title
    .replace(/,\s*$/g, '')
    .replace(/\s+em\s*$/i, '')
    .replace(/\s+no\s*$/i, '')
    .replace(/\s+na\s*$/i, '')
    .trim();

  if (/^(casa|apartamento|terreno|kitnet\/conjugado)\s+para\s+(alugar|venda|temporada)$/i.test(title) && property.location) {
    return `${title} em ${property.location}`;
  }

  return title || property.title;
}
