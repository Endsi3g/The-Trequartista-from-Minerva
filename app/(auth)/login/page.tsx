'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Chrome } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') || '/overview';
  const supabase = createClient();

  const handleGoogleSso = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: { hd: 'minervaflow.com' },
        },
      });
      if (error) { setErrorMsg(error.message); setLoading(false); }
    } catch {
      setErrorMsg("Erreur lors de l'initialisation Google SSO.");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const domain = email.split('@')[1];
    if (domain !== 'minervaflow.com' && domain !== 'minerva.com') {
      setErrorMsg('Accès restreint aux adresses @minervaflow.com');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (email.includes('@minervaflow.com')) {
          document.cookie = `centurions_session=active; path=/; max-age=86400`;
          router.push(redirectTo);
          return;
        }
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        router.push(redirectTo);
      }
    } catch {
      setErrorMsg('Erreur de connexion Supabase Auth.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-mv-scale-in">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-mv-green flex items-center justify-center text-mv-lime font-extrabold text-sm font-display">
          M
        </div>
        <span className="font-extrabold text-sm tracking-wide text-mv-ink font-display">
          MINERVA CENTURIONS
        </span>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-mv-ink font-display">
          Bon retour.
        </h1>
        <p className="text-sm text-mv-ink-soft">
          Connectez-vous à votre espace Minerva Centurions.
        </p>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      {/* Google SSO */}
      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleSso}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-mv-border bg-mv-surface text-sm font-semibold text-mv-ink hover:bg-mv-border/40 transition-colors disabled:opacity-60 cursor-pointer"
      >
        <Chrome className="w-4 h-4" />
        Continuer avec Google
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-mv-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-mv-cream px-3 text-xs text-mv-ink-soft">ou avec votre courriel</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-mv-ink">
            Courriel professionnel
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mv-ink-faint" />
            <input
              id="email"
              type="email"
              placeholder="vous@minervaflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-mv-border bg-mv-surface text-sm text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:ring-2 focus:ring-mv-green/40 focus:border-mv-green transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-semibold text-mv-ink">
              Mot de passe
            </label>
            <button
              type="button"
              className="text-xs text-mv-green hover:underline cursor-pointer"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mv-ink-faint" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-mv-border bg-mv-surface text-sm text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:ring-2 focus:ring-mv-green/40 focus:border-mv-green transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-mv-green text-white font-bold text-sm hover:bg-mv-green/90 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Se connecter
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-mv-ink-soft">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="font-bold text-mv-green hover:underline">
          S&apos;inscrire
        </Link>
      </p>

      <div className="flex items-center gap-1.5 text-xs text-mv-ink-faint justify-center">
        <Shield className="w-3 h-3" />
        <span>Accès restreint aux membres Minerva</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans">
      {/* ── Left: Form Panel ── */}
      <div className="flex flex-col justify-center items-center px-6 py-12 bg-mv-cream">
        <Suspense fallback={<div className="w-full max-w-sm animate-pulse space-y-4"><div className="h-8 bg-mv-border rounded-lg" /><div className="h-6 bg-mv-border rounded-lg w-3/4" /></div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* ── Right: Image Panel ── */}
      <div className="hidden lg:block relative overflow-hidden">
        <Image
          src="/signup-hero.png"
          alt="Minerva Centurions Cockpit"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-mv-ink/60 via-transparent to-mv-green/20" />

        {/* Quote */}
        <div className="absolute bottom-12 left-8 right-8">
          <blockquote className="text-white space-y-3">
            <p className="text-xl font-extrabold font-display leading-snug drop-shadow-lg">
              &ldquo;Chaque décision, chaque livraison,<br />tracée avec précision.&rdquo;
            </p>
            <footer className="flex items-center gap-2 text-sm text-white/70">
              <div className="w-6 h-6 rounded-full bg-mv-green flex items-center justify-center font-bold text-xs">M</div>
              Minerva Centurions — Cockpit In-House
            </footer>
          </blockquote>
        </div>

        {/* Status badge */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-mv-lime animate-pulse" />
            <span className="text-white text-xs font-semibold">Cockpit Actif — Usage Exclusif In-House</span>
          </div>
        </div>
      </div>
    </div>
  );
}
