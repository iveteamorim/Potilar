import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { BASE_URL } from '@/lib/config';
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/siteIdentity';
import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Header from '@/components/Header';
import RouteFooter from '@/components/RouteFooter';

const GOOGLE_ADS_ID = 'AW-18334944821';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap'
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Potilar | Portal de imóveis no Rio Grande do Norte',
    template: '%s | Potilar'
  },
  description:
    'Potilar é um portal de imóveis no Rio Grande do Norte. Encontre, alugue, compre e anuncie casas, apartamentos, terrenos e temporada no RN com contato direto.',
  alternates: {
    canonical: '/'
  },
  icons: {
    icon: [
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/favicon-192.png'
  },
  openGraph: {
    title: 'Potilar | Portal de imóveis no RN',
    description: 'Anuncios de casas, terrenos e alugueis com contato direto no Rio Grande do Norte.',
    url: BASE_URL,
    siteName: 'Potilar',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: `${BASE_URL}/POTILAR-LOGO.png`,
        alt: 'Potilar'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Potilar | Portal de imóveis no RN',
    description: 'Anuncios de casas, terrenos e alugueis com contato direto no Rio Grande do Norte.',
    images: [`${BASE_URL}/POTILAR-LOGO.png`]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = buildOrganizationJsonLd();
  const websiteJsonLd = buildWebsiteJsonLd();

  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${dmSerif.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ThemeProvider>
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <RouteFooter />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
