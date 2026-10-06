import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { QR_CARD_CONTENT, recordQrScanFromHeaders } from '@/lib/qrScans';

const VALID_REFERRALS = new Set(['arthur', 'isis']);

export default async function ReferralPage({ params }: { params: { ref: string } }) {
  const referralCode = params.ref.trim().toLowerCase();

  if (referralCode === 'cartao-anunciar') {
    await recordQrScanFromHeaders(headers(), QR_CARD_CONTENT.anunciar);
    redirect('/anunciar');
  }

  if (referralCode === 'cartao-imoveis') {
    await recordQrScanFromHeaders(headers(), QR_CARD_CONTENT.imoveis);
    redirect('/imoveis');
  }

  if (!VALID_REFERRALS.has(referralCode)) {
    redirect('/anunciar');
  }

  redirect(`/anunciar?ref=${referralCode}`);
}
