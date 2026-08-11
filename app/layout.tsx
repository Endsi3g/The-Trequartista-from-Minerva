import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SupabaseRealtimeProvider } from '@/components/providers/SupabaseRealtimeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';

export const metadata: Metadata = {
  title: 'Minerva Centurions — Cockpit Client',
  description: 'Command center de Minerva pour la livraison client, le suivi du ROI, la qualité et le management équipe.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Minerva Centurions — Cockpit Client',
    description: 'Command center de Minerva pour la livraison client, le suivi du ROI, la qualité et le management équipe.',
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#167f5b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Anti-flash: read theme from localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('mv-theme');
                if (t === 'dark') document.documentElement.classList.add('dark');
              } catch(e) {}
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>

      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            <SupabaseRealtimeProvider>
              {children}
            </SupabaseRealtimeProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>

    </html>
  );
}

