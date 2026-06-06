import { notFound, redirect } from 'next/navigation';

const UUID_OR_PREFIX_PATTERN = /^[0-9a-f-]{4,}$/i;

export default function MaybeListingRedirectPage({ params }: { params: { maybeListing: string } }) {
  const maybeListing = decodeURIComponent(params.maybeListing);

  if (UUID_OR_PREFIX_PATTERN.test(maybeListing)) {
    redirect(`/a/${maybeListing.replace(/-/g, '').slice(0, 8)}`);
  }

  notFound();
}
