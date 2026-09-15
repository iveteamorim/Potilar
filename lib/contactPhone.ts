/** Keep digits only (for WhatsApp/tel links). */
export function cleanPhoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

function withBrazilCountryCode(digits: string) {
  if (digits.startsWith('55')) return digits;
  if (/^(?:[1-9]\d)(?:9\d{8}|\d{8})$/.test(digits)) return `55${digits}`;
  return digits;
}

/** Allow typing Brazilian numbers with or without +55. */
export function formatContactPhoneInput(value: string) {
  const raw = value.replace(/[^\d+]/g, '');
  const hasPlus = raw.startsWith('+');
  const digits = withBrazilCountryCode(cleanPhoneDigits(raw));

  if (digits.startsWith('55') && digits.length >= 4) {
    const areaCode = digits.slice(2, 4);
    const local = digits.slice(4, 13);
    const parts = ['+55'];

    if (areaCode) parts.push(areaCode);
    if (local.length > 5) {
      parts.push(`${local.slice(0, local.length - 4)}-${local.slice(-4)}`);
    } else if (local) {
      parts.push(local);
    }

    return parts.join(' ').slice(0, 20);
  }

  return `${hasPlus ? '+' : ''}${digits}`.slice(0, 20);
}

/**
 * Brazilian numbers must include DDD and be mobile (9 digits, starting with 9)
 * or landline (8 digits). Other international numbers keep a broad length check.
 */
export function isValidContactPhone(value: string) {
  const formatted = formatContactPhoneInput(value.trim());
  const digits = cleanPhoneDigits(formatted);
  if (!formatted.startsWith('+')) return false;

  if (digits.startsWith('55')) {
    const brazilNumber = digits.slice(2);
    return /^\d{2}(?:9\d{8}|\d{8})$/.test(brazilNumber);
  }

  return digits.length >= 8 && digits.length <= 15;
}

/** Normalize stored value: trim, collapse spaces, and format when possible. */
export function normalizeContactPhone(value: string) {
  return formatContactPhoneInput(value.trim().replace(/\s+/g, ' '));
}
