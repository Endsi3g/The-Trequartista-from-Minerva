import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minerva Centurions — Cockpit In-House',
  description: 'Command center interne de Minerva pour la livraison client, le suivi du ROI, la qualité et le management équipe.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Minerva Centurions — Cockpit In-House',
    description: 'Command center interne de Minerva pour la livraison client, le suivi du ROI, la qualité et le management équipe.',
    url: 'https://minervaflow.com',
    siteName: 'Minerva Centurions',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Minerva Centurions Cockpit',
      },
    ],
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased selection:bg-mv-lime selection:text-mv-cream">
        {children}
      </body>
    </html>
  );
}
