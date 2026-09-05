import Link from 'next/link';
import { SignupForm } from '@/components/signup-form';
import { Logo } from '@/components/shell/Logo';
import { AnimatedMeshBackground } from '@/components/ui/animated-mesh-background';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex text-mv-ink bg-mv-cream">
      {/* Left: halftone portrait panel (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-mv-green-darker overflow-hidden">
        <AnimatedMeshBackground />
        {/* Scrims -- guarantee text legibility regardless of the gradient motion underneath */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: '11rem', background: 'linear-gradient(to bottom, #065f46 0%, #065f46 35%, transparent 100%)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: '24rem', background: 'linear-gradient(to top, #065f46 0%, #065f46 45%, transparent 100%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full h-full">
          <Link href="/" className="drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
            <Logo variant="light" size={30} />
          </Link>
          <div className="max-w-sm drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
            <p className="text-white text-2xl xl:text-3xl font-extrabold font-display tracking-tight leading-tight">
              Rejoignez l&apos;espace de travail de l&apos;équipe.
            </p>
            <p className="text-sm mt-3" style={{ color: 'rgba(250, 250, 249, 0.85)' }}>
              Créez votre compte pour accéder aux clients, projets et outils internes de Minerva.
            </p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-12 flex items-center justify-between gap-3 shrink-0">
          <Link href="/" className="lg:hidden flex items-center gap-2 min-w-0 shrink-0">
            <Logo size={26} collapsed />
          </Link>
          <div className="lg:ml-auto text-xs text-mv-ink-soft text-right shrink-0">
            <span className="hidden sm:inline">Déjà un compte ? </span>
            <Link href="/login" className="font-extrabold text-mv-ink underline hover:text-mv-green">
              Se connecter
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <SignupForm />
        </main>
      </div>
    </div>
  );
}
