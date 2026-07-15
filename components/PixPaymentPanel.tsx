'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, MessageCircle, QrCode, ShieldCheck } from 'lucide-react';
import {
  PIX_KEY,
  buildPixCopiaECola,
  formatPixMoney,
  getPaymentCode,
  getPixPaymentKindLabel,
  getPixWhatsappLink,
  type PixPaymentKind
} from '@/lib/pix';

type CopyField = 'payload' | 'key' | 'code';

type Props = {
  listingId: string;
  amount: number;
  title: string;
  kind: PixPaymentKind;
  headline?: string;
  showSteps?: boolean;
};

export default function PixPaymentPanel({ listingId, amount, title, kind, headline, showSteps = true }: Props) {
  const paymentCode = getPaymentCode(listingId);
  const copiaECola = useMemo(
    () => buildPixCopiaECola({ amount, paymentCode }),
    [amount, paymentCode]
  );
  const whatsappHref = getPixWhatsappLink({ paymentCode, title, kind, amount });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState<CopyField | null>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(copiaECola, {
      margin: 2,
      width: 280,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then((url) => {
        if (active) {
          setQrDataUrl(url);
          setQrError(false);
        }
      })
      .catch(() => {
        if (active) setQrError(true);
      });

    return () => {
      active = false;
    };
  }, [copiaECola]);

  async function copyValue(value: string, field: CopyField) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      // Clipboard may be blocked on some mobile browsers.
    }
  }

  const panelHeadline = headline ?? `Pagamento Pix - ${getPixPaymentKindLabel(kind)}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-ocean-200 bg-gradient-to-br from-white via-ocean-50/60 to-white shadow-soft dark:border-ocean-900 dark:from-slate-950 dark:via-ocean-950/30 dark:to-slate-950">
      <div className="border-b border-ocean-100 bg-ocean-600 px-5 py-4 text-white dark:border-ocean-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-100">Potilar - Pix</p>
            <h3 className="mt-1 text-lg font-semibold">{panelHeadline}</h3>
            <p className="mt-1 text-sm text-ocean-100">{title}</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ocean-100">Total</p>
            <p className="text-2xl font-semibold">{formatPixMoney(amount)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center">
          <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-sand-200 bg-white p-3 shadow-inner dark:border-slate-800 dark:bg-slate-900">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Pix Potilar" className="h-full w-full rounded-xl" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <QrCode className="h-10 w-10 animate-pulse" aria-hidden="true" />
                <p className="text-xs font-semibold">{qrError ? 'Use o copia e cola abaixo' : 'Gerando QR...'}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Escaneie no app do seu banco
          </p>
        </div>

        <div className="space-y-4">
          {showSteps && (
            <ol className="grid gap-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex gap-2">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-800 dark:bg-ocean-900 dark:text-ocean-100">1</span>
                Escaneie o QR ou copie o codigo Pix abaixo.
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-800 dark:bg-ocean-900 dark:text-ocean-100">2</span>
                Confira o valor e pague em segundos.
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-800 dark:bg-ocean-900 dark:text-ocean-100">3</span>
                Envie o comprovante pelo WhatsApp com o codigo <strong>{paymentCode}</strong>.
              </li>
            </ol>
          )}

          <div className="space-y-3">
            <CopyRow
              label="Codigo do pagamento"
              value={paymentCode}
              copied={copied === 'code'}
              onCopy={() => copyValue(paymentCode, 'code')}
            />
            <CopyRow
              label="Pix copia e cola"
              value={copiaECola}
              copied={copied === 'payload'}
              onCopy={() => copyValue(copiaECola, 'payload')}
              mono
            />
            <CopyRow
              label="Chave Pix"
              value={PIX_KEY}
              copied={copied === 'key'}
              onCopy={() => copyValue(PIX_KEY, 'key')}
              mono
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Enviar comprovante no WhatsApp
            </a>
            <button
              type="button"
              onClick={() => copyValue(copiaECola, 'payload')}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-ocean-200 bg-white px-5 py-3.5 text-sm font-semibold text-ocean-800 dark:border-slate-700 dark:bg-slate-900 dark:text-ocean-100"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied === 'payload' ? 'Copiado!' : 'Copiar Pix'}
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <p>
              Pagamento direto para a Potilar. Após confirmação do Pix, seu anúncio é liberado em até{' '}
              <strong>24 horas úteis</strong>. Guarde o código <strong>{paymentCode}</strong> no comprovante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
  mono = false
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ocean-700 hover:bg-ocean-50 dark:text-ocean-200 dark:hover:bg-ocean-950/40"
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p className={`mt-2 break-all text-sm font-semibold text-slate-800 dark:text-slate-100 ${mono ? 'font-mono text-xs leading-6' : ''}`}>
        {value}
      </p>
    </div>
  );
}
