import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/login-form';
import { Logo } from '@/components/shell/Logo';
import { HalftoneImage } from '@/components/ui/halftone-image';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex text-mv-ink bg-mv-cream">
      {/* Left: halftone portrait panel (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-mv-green-darker overflow-hidden">
        <HalftoneImage
          src="/images/login-portrait.jpg"
          dotColor="#fafaf9"
          backgroundColor="#0f261a"
          dotSpacing={6}
          className="absolute inset-0"
        />
        {/* Scrims -- guarantee text legibility regardless of the dot texture underneath */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: '11rem', background: 'linear-gradient(to bottom, #0f261a 0%, #0f261a 35%, transparent 100%)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: '24rem', background: 'linear-gradient(to top, #0f261a 0%, #0f261a 45%, transparent 100%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full h-full">
          <Link href="/" className="drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
            <Logo variant="light" size={30} />
          </Link>
          <div className="max-w-sm drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
            <p className="text-white text-2xl xl:text-3xl font-extrabold font-display tracking-tight leading-tight">
              L&apos;outil interne qui garde l&apos;agence alignée.
            </p>
            <p className="text-sm mt-3" style={{ color: 'rgba(250, 250, 249, 0.85)' }}>
              Clients, leads, projets et contenu — le tout au même endroit pour l&apos;équipe Minerva.
            </p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-6 sm:px-12 flex items-center justify-between shrink-0">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <Logo size={26} />
          </Link>
          <div className="lg:ml-auto text-xs text-mv-ink-soft">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-extrabold text-mv-ink underline hover:text-mv-green ml-1">
              Créer un compte
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
