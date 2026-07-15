export const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY ?? 'f208fc34-8166-49e7-bc9e-d3faa4921b1e';
export const PIX_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_PIX_WHATSAPP ?? '5521969724141';
export const PIX_MERCHANT_NAME = 'POTILAR';
export const PIX_MERCHANT_CITY = 'NATAL';

export type PixPaymentKind = 'listing' | 'seasonal' | 'highlight' | 'renewal';

const PAYMENT_KIND_LABELS: Record<PixPaymentKind, string> = {
  listing: 'Anuncio adicional',
  seasonal: 'Anuncio de temporada',
  highlight: 'Destaque do anúncio',
  renewal: 'Renovacao temporada'
};

export function getPaymentCode(listingId: string) {
  return `POT-${listingId.slice(0, 8).toUpperCase()}`;
}

export function getPixPaymentKindLabel(kind: PixPaymentKind) {
  return PAYMENT_KIND_LABELS[kind];
}

export function formatPixMoney(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function sanitizePixText(value: string, maxLength: number) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function emvField(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16ccitt(payload: string) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Gera Pix copia e cola (BR Code estatico com valor). */
export function buildPixCopiaECola(options: {
  amount: number;
  paymentCode: string;
  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
}) {
  const pixKey = options.pixKey ?? PIX_KEY;
  const merchantName = sanitizePixText(options.merchantName ?? PIX_MERCHANT_NAME, 25);
  const merchantCity = sanitizePixText(options.merchantCity ?? PIX_MERCHANT_CITY, 15);
  const amount = Math.max(0, options.amount).toFixed(2);
  const reference = sanitizePixText(options.paymentCode.replace(/[^a-zA-Z0-9]/g, ''), 25);

  const merchantAccount = emvField('00', 'br.gov.bcb.pix') + emvField('01', pixKey);
  const additionalData = emvField('05', reference);

  let payload =
    emvField('00', '01') +
    emvField('01', '12') +
    emvField('26', merchantAccount) +
    emvField('52', '0000') +
    emvField('53', '986') +
    emvField('54', amount) +
    emvField('58', 'BR') +
    emvField('59', merchantName) +
    emvField('60', merchantCity) +
    emvField('62', additionalData) +
    '6304';

  payload += crc16ccitt(payload);
  return payload;
}

export function getPixWhatsappLink(options: {
  paymentCode: string;
  title: string;
  kind: PixPaymentKind;
  amount: number;
}) {
  const message = [
    'Ola, vim pelo site Potilar e quero enviar o comprovante Pix.',
    `Codigo: ${options.paymentCode}`,
    `Tipo: ${getPixPaymentKindLabel(options.kind)}`,
    `Valor: ${formatPixMoney(options.amount)}`,
    `Anuncio: ${options.title}`
  ].join('\n');

  return `https://wa.me/${PIX_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
