import Link from 'next/link';
import Image from 'next/image';
import { SignupForm } from '@/components/signup-form';
import { Logo } from '@/components/shell/Logo';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col justify-between relative overflow-hidden text-mv-ink">
      {/* Top Header Bar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between z-20 relative bg-white/60 backdrop-blur-sm border-b border-mv-border/40">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="text-xs text-mv-ink-soft">
          Already have an account?{' '}
          <Link href="/login" className="font-extrabold text-mv-ink underline hover:text-mv-green ml-1">
            Log in
          </Link>
        </div>
      </header>

      {/* Main Centered Signup Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-20 relative my-6">
        <SignupForm />
      </main>

      {/* Background Leaf Corner Illustrations (Image 3) */}
      <div className="fixed bottom-12 left-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-left.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>
      <div className="fixed bottom-12 right-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-right.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>

      {/* Dark Footer Bar (Image 3) */}
      <footer className="h-12 bg-[#242424] text-white px-6 sm:px-12 flex items-center justify-between text-xs z-20 relative">
        <div className="flex items-center gap-2 font-bold tracking-tight text-white">
          <span className="w-4 h-4 rounded bg-[#00a800] inline-block" />
          <span>Minerva Trequartista</span>
        </div>
        <div className="flex items-center gap-1.5 text-mv-ink-soft text-[11px]">
          <span>curated by</span>
          <span className="font-extrabold text-white tracking-tight flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Mobbin
          </span>
        </div>
      </footer>
    </div>
  );
}
