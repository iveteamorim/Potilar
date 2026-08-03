'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = {
  value: string;
  size?: number;
  className?: string;
  logoSrc?: string;
};

export default function ListingQrCode({
  value,
  size = 220,
  className = '',
  logoSrc = '/images/potilar-logo.png'
}: Props) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(value, {
      margin: 1,
      width: size,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#07142d',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc('');
      });

    return () => {
      active = false;
    };
  }, [size, value]);

  if (!src) {
    return (
      <div
        className={`grid h-full w-full place-items-center bg-white text-xs font-semibold text-slate-400 ${className}`}
        aria-hidden
      >
        QR
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      <img src={src} alt="QR code do anuncio" width={size} height={size} className="h-full w-full object-contain" />
      {logoSrc ? (
        <span className="poster-qr-logo" aria-hidden>
          <img src={logoSrc} alt="" />
        </span>
      ) : null}
    </div>
  );
}
