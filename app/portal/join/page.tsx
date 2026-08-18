'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchInviteByToken, redeemClientInvite } from '@/lib/services/supabase-data';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function JoinForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();

  const [clientName, setClientName] = useState('');
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setChecking(false);
      return;
    }
    (async () => {
      const invite = await fetchInviteByToken(token);
      if (!invite) {
        setInvalid(true);
      } else {
        setClientName(invite.client_name);
      }
      setChecking(false);
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setIsAlreadyRegistered(false);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName, role: 'client' } },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('existe déjà')) {
          setIsAlreadyRegistered(true);
          setErrorMsg('Compte déjà existant');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        await redeemClientInvite(token, data.user.id);
        router.push('/portal');
      }
    } catch {
      setErrorMsg('Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="text-center text-xs text-zinc-400 font-mono py-12">Vérification de l’invitation…</div>;
  }

  if (invalid) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-6 text-center space-y-3 shadow-sm max-w-[360px] mx-auto">
        <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-semibold text-zinc-900">Lien d’invitation invalide</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Ce lien est expiré ou a déjà été utilisé pour créer un accès client.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline pt-1"
        >
          <span>Se connecter au portail</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px] mx-auto">
      {/* ── 1. Compact Brand Header ── */}
      <div className="space-y-1 text-center mb-4">
        <div className="w-7 h-7 rounded-md bg-zinc-900 text-white font-mono text-xs font-bold flex items-center justify-center mx-auto shadow-sm">
          M
        </div>
        <h1 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
          Rejoindre {clientName || 'l’Espace Partenaire'}
        </h1>
        <p className="text-[11px] text-zinc-400 font-mono" style={MONO}>
          Portail Partenaire Minerva
        </p>
      </div>

      {/* ── 2. Compact Form Container ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Actionable Error Banner */}
        {isAlreadyRegistered ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2.5 flex items-center justify-between text-xs text-zinc-700 mb-3">
            <span className="font-medium">Compte déjà existant</span>
            <Link
              href={`/login?email=${encodeURIComponent(email)}`}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-0.5"
            >
              <span>Se connecter</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-md p-2.5 text-xs mb-3 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nom complet */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">
              Prénom & Nom
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ex: Marc Beauchemin"
              className="w-full h-8 text-xs px-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
            />
          </div>

          {/* Courriel */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">
              Adresse courriel
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@entreprise.com"
              className={cn(
                'w-full h-8 text-xs px-2.5 border border-zinc-200 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 font-mono text-[11.5px]',
                token ? 'bg-zinc-50 text-zinc-600' : 'bg-white text-zinc-900'
              )}
              style={MONO}
            />
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Mot de passe
              </label>
              <span className="font-mono text-[10px] text-zinc-400" style={MONO}>
                8+ car.
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-8 text-xs px-2.5 pr-8 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 font-mono"
                style={MONO}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={loading}
            className="h-8 w-full bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md shadow-sm flex items-center justify-center gap-1.5 mt-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Création du compte…' : 'Créer mon compte client (Entrée)'}</span>
          </button>
        </form>
      </div>

      {/* ── 3. Micro-Footer ── */}
      <p className="text-[10px] font-mono text-zinc-400 text-center mt-3" style={MONO}>
        🔒 Chiffré & sécurisé par Minerva Engine
      </p>
    </div>
  );
}

export default function PortalJoinPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-xs text-zinc-400 font-mono">Chargement…</div>}>
        <JoinForm />
      </Suspense>
    </div>
  );
}
