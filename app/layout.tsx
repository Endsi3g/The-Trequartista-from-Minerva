import type { Metadata } from 'next';
import { JetBrains_Mono, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { SupabaseRealtimeProvider } from '@/components/providers/SupabaseRealtimeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';
import { CurrentUserProvider } from '@/components/providers/CurrentUserProvider';
import { AppPermissionsProvider } from '@/components/providers/AppPermissionsProvider';

// v3 (2026-08-16): matched against Reach/Flow -- Playfair Display for
// headings (font-display), Inter for body/UI. Dark mode removed (see
// CLAUDE.md Couleurs -- no toggle exists anymore).

// Weight caps at 700 on purpose (2026-08-16, boldness pass): the app felt
// too heavy overall, and `font-extrabold`/`font-black` utilities are used
// pervasively across titles, labels and badges. Rather than hunting down
// every occurrence, capping the loaded weight at 700 makes the browser
// substitute the nearest available weight (700) for any 800/900 request,
// softening the whole app in one place. Don't add '800'/'900' back without
// deciding to re-introduce genuinely heavy type somewhere first.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['500', '600', '700'],
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
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}
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
                  {children}
                </SupabaseRealtimeProvider>
              </AppPermissionsProvider>
            </CurrentUserProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
