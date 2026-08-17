'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { LogoMark } from '@/components/shell/Logo';
import { createClient } from '@/lib/supabase/client';
import { fetchInviteByToken, redeemClientInvite } from '@/lib/services/supabase-data';
import { Button } from '@/components/ui/button';

function JoinForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [clientName, setClientName] = useState('');
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName, role: 'client' } },
    });

    if (error || !data.user) {
      setErrorMsg(error?.message || 'Erreur de création de compte.');
      setLoading(false);
      return;
    }

    const clientId = await redeemClientInvite(token, data.user.id);

    // Explicitly enforce role 'client' in profiles
    if (data.user.id) {
      await supabase.from('profiles').update({
        role: 'client',
        client_id: clientId,
        full_name: fullName,
      }).eq('id', data.user.id);
    }

    setLoading(false);

    if (!clientId) {
      setErrorMsg("Compte créé, mais le lien d'invitation n'a pas pu être associé. Contactez votre équipe Minerva.");
      return;
    }

    // Direct redirect to dedicated client portal
    window.location.href = '/portal';
  };

  if (checking) {
    return (
      <div className="text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 font-medium">Vérification du lien d&apos;accès…</p>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-neutral-900 font-display">Lien invalide ou expiré</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Cette invitation au portail client n&apos;est plus active. Veuillez contacter votre chef de projet Minerva pour recevoir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-sm">
          <LogoMark size={24} />
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-900 font-display tracking-tight">
          Rejoindre {clientName}
        </h1>
        <p className="text-xs text-neutral-500">
          Accédez à votre espace de suivi des leads, performances et agent vocal Minerva.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-900">Nom complet</label>
          <div className="relative">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alexandre Roy"
              className="w-full px-3.5 py-2.5 pl-10 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors font-medium"
            />
            <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-900">Courriel professionnel</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@entreprise.com"
              className="w-full px-3.5 py-2.5 pl-10 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors font-medium"
            />
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-900">Mot de passe</label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pl-10 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors font-mono"
            />
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[11px] text-neutral-400">Minimum 8 caractères</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Création de l\'accès…' : 'Créer mon compte client'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Accès direct et sécurisé au Portail Client Minerva</span>
        </div>
      </form>
    </div>
  );
}

export default function PortalJoinPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-6 font-sans">
      <Suspense fallback={<div className="text-sm text-neutral-500">Chargement…</div>}>
        <JoinForm />
      </Suspense>
    </div>
  );
}
