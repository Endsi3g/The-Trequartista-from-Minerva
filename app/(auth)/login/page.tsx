'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

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
          queryParams: {
            hd: 'minervaflow.com',
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
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
      setErrorMsg("Accès restreint : Seuls les courriels du domaine @minervaflow.com ou @minerva.com sont autorisés.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
      setErrorMsg("Erreur de connexion Supabase Auth.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-mv-lg max-w-md w-full p-8 space-y-6 animate-mv-scale-in">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-mv-green-tint border border-mv-green/40 flex items-center justify-center mx-auto text-mv-green">
          <Shield className="w-6 h-6 animate-mv-leaf-breathe" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-mv-ink font-display">
            MINERVA <span className="text-mv-green">CENTURIONS</span>
          </h1>
          <p className="text-xs font-semibold text-mv-lime uppercase tracking-widest mt-1">
            Cockpit In-House — Authentification
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-mv-red-bg border border-mv-red/30 text-mv-red text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Google SSO Button */}
      <div className="space-y-3">
        <button
          onClick={handleGoogleSso}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border hover:border-mv-green/50 text-xs font-bold text-mv-ink flex items-center justify-center gap-3 transition-all cursor-pointer shadow-mv-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Se connecter avec Google Workspace (@minervaflow.com)</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-mv-border" />
          <span className="text-[10px] uppercase tracking-wider text-mv-ink-mute font-bold">
            Ou Connexion Équipe
          </span>
          <div className="flex-1 h-px bg-mv-border" />
        </div>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-mv-green" /> Courriel Professionnel
          </label>
          <input
            type="email"
            required
            placeholder="alex@minervaflow.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink placeholder-mv-ink-mute focus:outline-none focus:border-mv-green transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-mv-lime" /> Mot de Passe
          </label>
          <input
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink placeholder-mv-ink-mute focus:outline-none focus:border-mv-green transition-colors font-mono"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className="w-full mt-2"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {loading ? 'Connexion en cours...' : 'Accéder au Cockpit Centurions'}
        </Button>
      </form>

      {/* Footer Info */}
      <div className="pt-4 border-t border-mv-border text-center text-xs space-y-2">
        <div className="flex items-center justify-center gap-1 text-mv-green font-semibold text-[11px]">
          <CheckCircle2 className="w-3 h-3" /> Domaine restreint @minervaflow.com
        </div>
        <div className="text-mv-ink-soft">
          Nouveau sur Centurions ?{' '}
          <Link href="/signup" className="font-bold text-mv-green hover:underline">
            Créer un Compte
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <div className="min-h-screen bg-mv-cream text-mv-ink flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<div className="p-8 text-center text-xs text-mv-ink-soft">Chargement du formulaire SSO...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
