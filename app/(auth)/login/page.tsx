import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { Logo } from '@/components/shell/Logo';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-mv-cream flex flex-col justify-between relative overflow-hidden text-mv-ink">
      {/* Top Header Bar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between z-20 relative bg-mv-surface/60 backdrop-blur-sm border-b border-mv-border/40">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="text-xs text-mv-ink-soft">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="font-extrabold text-mv-ink underline hover:text-mv-green ml-1">
            Créer un compte
          </Link>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-20 relative my-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Background Leaf Corner Illustrations */}
      <div className="fixed bottom-0 left-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-left.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>
      <div className="fixed bottom-0 right-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-right.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>
    </div>
  );
}
