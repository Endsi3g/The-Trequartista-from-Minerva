import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SupabaseRealtimeProvider } from '@/components/providers/SupabaseRealtimeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';

export const metadata: Metadata = {
  title: 'The Trequartista from Minerva',
  description: 'Plateforme opérationnelle de Minerva pour le suivi client, la qualité et la gestion d’équipe.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-512.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'The Trequartista from Minerva',
    description: 'Plateforme opérationnelle de Minerva pour le suivi client, la qualité et la gestion d’équipe.',
    url: 'https://minervaflow.com',
    siteName: 'The Trequartista from Minerva',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'The Trequartista from Minerva',
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
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    reg.update();
                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New version detected! Reloading...');
                            window.location.reload();
                          }
                        });
                      }
                    });
                  }).catch(function() {});

                  var refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (!refreshing) {
                      refreshing = true;
                      window.location.reload();
                    }
                  });
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

