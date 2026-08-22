import Link from 'next/link';

export default function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-baseline leading-none"
      aria-label="Potilar - Imoveis no Rio Grande do Norte"
    >
      <span
        className="font-sans text-[2.35rem] font-black tracking-[-0.045em] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:text-[2.8rem]"
        style={{ color: '#07194A' }}
      >
        Poti
      </span>
      <span
        className="font-sans text-[2.35rem] font-black tracking-[-0.055em] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:text-[2.8rem]"
        style={{ color: '#44B536' }}
      >
        Lar
      </span>
    </Link>
  );
}
