import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/config';
import { Manrope, Sora } from 'next/font/google';
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
  title: 'RN Lar | Plataforma digital de divulgação imobiliária',
  description:
    'Divulgação de casas, lotes e aluguéis no Rio Grande do Norte. Plataforma digital com atendimento e suporte local.',
  icons: {
    icon: '/favicon.svg'
  },
  openGraph: {
    title: 'RN Lar | Divulgação imobiliária no RN',
    description:
      'Anúncios de casas, terrenos e aluguéis com atendimento digital e conexão local no RN.',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: `${BASE_URL}/og-home.svg`,
        alt: 'RN Lar'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RN Lar | Divulgação imobiliária no RN',
    description:
      'Anúncios de casas, terrenos e aluguéis com atendimento digital e conexão local no RN.',
    images: [`${BASE_URL}/og-home.svg`]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${sora.variable}`}>
      <body className="font-sans">
        <ThemeProvider>
          <Header />
          {children}
          <Footer />
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
