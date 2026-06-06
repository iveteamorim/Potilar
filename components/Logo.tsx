import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" className="relative block h-12 w-36 sm:h-14 sm:w-44" aria-label="Potilar">
      <Image
        src="/POTILAR-LOGO.png"
        alt="Potilar - Imoveis no Rio Grande do Norte"
        fill
        priority
        sizes="(min-width: 640px) 176px, 144px"
        className="object-contain object-left"
      />
    </Link>
  );
}
