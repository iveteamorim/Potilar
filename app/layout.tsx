import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { BASE_URL } from '@/lib/config';
import { Manrope, Sora } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap'
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Potilar | Imoveis no Rio Grande do Norte',
    template: '%s | Potilar'
  },
  description:
    'Compre, alugue, anuncie e encontre casas, apartamentos, terrenos e imoveis de temporada no Rio Grande do Norte.',
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
    title: 'Potilar | Imoveis no RN',
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
    title: 'Potilar | Imoveis no RN',
    description: 'Anuncios de casas, terrenos e alugueis com contato direto no Rio Grande do Norte.',
    images: [`${BASE_URL}/POTILAR-LOGO.png`]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Potilar',
    url: BASE_URL,
    logo: `${BASE_URL}/POTILAR-LOGO.png`,
    description: 'Portal de imoveis no Rio Grande do Norte.'
  };
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Potilar',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/imoveis?busca={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang="pt-BR" className={`${manrope.variable} ${sora.variable}`}>
      <body className="font-sans">
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
          {children}
          <Footer />
          <ChatWidget />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
