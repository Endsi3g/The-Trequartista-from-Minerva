import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import './globals.css';
import { SupabaseRealtimeProvider } from '@/components/providers/SupabaseRealtimeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';
import { CurrentUserProvider } from '@/components/providers/CurrentUserProvider';
import { AppPermissionsProvider } from '@/components/providers/AppPermissionsProvider';
import { NativeNotificationProvider } from '@/components/providers/NativeNotificationProvider';

// Mintlify Standard: Inter for everything — no display face override in the system.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
});

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
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
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

      <body className="antialiased font-sans">
        <ToastProvider>
          <ConfirmProvider>
            <CurrentUserProvider>
              <AppPermissionsProvider>
                <SupabaseRealtimeProvider>
                  <NativeNotificationProvider>
                    {children}
                  </NativeNotificationProvider>
                </SupabaseRealtimeProvider>
              </AppPermissionsProvider>
            </CurrentUserProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
