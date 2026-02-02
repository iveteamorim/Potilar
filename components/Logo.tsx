import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="RN Lar">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ocean-700 text-white shadow-soft">
        <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
          <path
            d="M24 6c7.2 0 13 5.8 13 13 0 9.3-9.2 18.2-13 22.2C20.2 37.2 11 28.3 11 19 11 11.8 16.8 6 24 6Z"
            fill="currentColor"
            opacity="0.25"
          />
          <path
            d="M16 20.5 24 14l8 6.5V30a2 2 0 0 1-2 2h-3v-7h-6v7h-3a2 2 0 0 1-2-2V20.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <div className="leading-none">
        <span className="block font-display text-lg font-semibold tracking-tight text-ocean-900 dark:text-white">
          RN Lar
        </span>
      </div>
    </Link>
  );
}
