import { redirect } from 'next/navigation';

const VALID_REFERRALS = new Set(['arthur', 'isis']);

export default function ReferralPage({ params }: { params: { ref: string } }) {
  const referralCode = params.ref.trim().toLowerCase();

  if (!VALID_REFERRALS.has(referralCode)) {
    redirect('/anunciar');
  }

  redirect(`/anunciar?ref=${referralCode}`);
}
