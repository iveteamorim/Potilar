'use client';

type Props = {
  listingId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
};

export default function WhatsAppStatLink({ listingId, href, className, children }: Props) {
  function handleClick() {
    fetch(`/api/listings/${listingId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'whatsapp' })
    }).catch(() => {
      // Tracking is best-effort.
    });
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
