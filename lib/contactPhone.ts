/** Keep digits only (for WhatsApp/tel links). */
export function cleanPhoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

/** Allow typing international numbers with DDI. */
export function formatContactPhoneInput(value: string) {
  return value.replace(/[^\d+ ()-]/g, '').slice(0, 20);
}

/**
 * International contact phone: must include DDI with leading "+".
 * Examples: +55 84 99999-9999, +34687153601
 */
export function isValidContactPhone(value: string) {
  const trimmed = value.trim();
  const digits = cleanPhoneDigits(trimmed);
  return trimmed.startsWith('+') && digits.length >= 8 && digits.length <= 15;
}

/** Normalize stored value: trim and collapse spaces. */
export function normalizeContactPhone(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}
