'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { LogoMark } from '@/components/shell/Logo';
import { createClient } from '@/lib/supabase/client';
import { fetchTeamInviteByToken, redeemTeamInvite, fetchRoles } from '@/lib/services/supabase-data';

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', member: 'Membre' };
const WORKSPACE_LABELS: Record<string, string> = { prospection: 'Prospection', managing: 'Managing', tech: 'Tech & Ingénierie' };

// Where a freshly redeemed invite lands -- straight on the assigned
// workspace's daily-driver page instead of the generic /onboarding wizard,
// since role/department/workspace are already set by the invite itself.
function workspaceHomeRoute(workspace: string | null): string {
  if (workspace === 'prospection') return '/leads';
  if (workspace === 'managing') return '/tasks';
  if (workspace === 'tech') return '/tech';
  return '/overview';
}

function JoinForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [invite, setInvite] = useState<{ role: string; department: string | null; custom_role_id: string | null; workspace: string | null } | null>(null);
  const [customRoleName, setCustomRoleName] = useState<string | null>(null);
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
      const inv = await fetchTeamInviteByToken(token);
      if (!inv) {
        setInvalid(true);
      } else {
        setInvite({ role: inv.role, department: inv.department, custom_role_id: inv.custom_role_id, workspace: inv.workspace });
        if ((inv as any).custom_role_name) {
          setCustomRoleName((inv as any).custom_role_name);
        } else if (inv.custom_role_id) {
          const roles = await fetchRoles();
          setCustomRoleName(roles.find((r) => r.id === inv.custom_role_id)?.name || null);
        }
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
      options: { data: { full_name: fullName } },
    });

    if (error || !data.user) {
      setErrorMsg(error?.message || 'Erreur de création de compte.');
      setLoading(false);
      return;
    }

    const ok = await redeemTeamInvite(token, data.user.id);
    setLoading(false);

    if (!ok) {
      setErrorMsg("Compte créé, mais le rôle n'a pas pu être attribué. Contactez un administrateur.");
      return;
    }

    window.location.href = workspaceHomeRoute(invite?.workspace ?? null);
  };

  if (checking) {
    return <div className="text-center text-sm text-mv-ink-soft">Vérification de l'invitation…</div>;
  }

  if (invalid || !invite) {
    return (
      <div className="text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-mv-red mx-auto" />
        <p className="text-sm text-mv-ink-soft">Ce lien d'invitation est invalide ou a expiré.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <LogoMark size={40} className="mx-auto" />
        <h1 className="text-xl font-extrabold text-mv-ink text-center tracking-tight font-display mb-1">
          Rejoindre l'équipe Minerva
        </h1>
        <p className="text-xs text-mv-ink-soft">
          Rôle : <strong className="text-mv-ink">{ROLE_LABELS[invite.role] || invite.role}</strong>
          {customRoleName && <> · <strong className="text-mv-ink">{customRoleName}</strong></>}
          {invite.department && <> · {invite.department}</>}
          {invite.workspace && <> · Espace {WORKSPACE_LABELS[invite.workspace] || invite.workspace}</>}
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-mv-red-bg border border-mv-red/30 text-mv-red text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-md">
        <div className="space-y-1">
          <label className="text-xs font-bold text-mv-ink">Nom complet</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-mv-ink">Courriel</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-mv-ink">Mot de passe</label>
          <input
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Création du compte…' : 'Créer mon accès'}
        </button>
      </form>
    </div>
  );
}

export default function TeamJoinPage() {
  return (
    <div className="min-h-screen bg-mv-cream flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-mv-ink-soft">Chargement…</div>}>
        <JoinForm />
      </Suspense>
    </div>
  );
}
