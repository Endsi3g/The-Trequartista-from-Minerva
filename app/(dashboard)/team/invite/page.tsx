'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ShieldAlert, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createClient } from '@/lib/supabase/client';
import { createTeamInvite, fetchTeamInvites, revokeTeamInvite } from '@/lib/services/supabase-data';
import { TeamInvite } from '@/lib/types';

export default function TeamInvitePage() {
  const { role: currentUserRole, loading: userLoading } = useCurrentUser();
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [department, setDepartment] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadInvites = async () => {
    setLoadingInvites(true);
    setInvites(await fetchTeamInvites());
    setLoadingInvites(false);
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setGenerating(false);
      return;
    }
    const invite = await createTeamInvite(role, department.trim() || null, user.id);
    setGenerating(false);
    if (invite) {
      await handleCopy(invite.token);
      await loadInvites();
    }
  };

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/team/join?token=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevoke = async (invite: TeamInvite) => {
    if (!confirm("Révoquer ce lien d'invitation ? Il ne pourra plus être utilisé.")) return;
    setRevokingId(invite.id);
    await revokeTeamInvite(invite.id);
    await loadInvites();
    setRevokingId(null);
  };

  if (!userLoading && currentUserRole !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/team" className="text-xs text-mv-green hover:underline">Retour à l'équipe</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/team" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'équipe
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Inviter un Collaborateur</h1>
      <p className="text-sm text-mv-ink-soft -mt-4">
        Générez un lien valide 14 jours. La personne qui l'utilise obtient automatiquement le rôle et le département choisis ici.
      </p>

      <Card>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Rôle attribué</label>
            <div className="flex items-center gap-2">
              {(['member', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    role === r
                      ? 'bg-mv-green text-white border-mv-green shadow-mv-sm'
                      : 'bg-mv-cream-soft text-mv-ink-soft border-mv-border hover:text-mv-ink'
                  }`}
                >
                  {r === 'admin' ? 'Admin' : 'Membre'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="department" className="block text-xs font-bold text-mv-ink">
              Département (optionnel)
            </label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Design & UX Studio"
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink placeholder-mv-ink-mute focus:outline-none focus:border-mv-green"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={generating}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            {generating ? 'Génération…' : 'Générer et copier le lien'}
          </Button>
        </div>
      </Card>

      <Card
        header={
          <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
            Invitations Générées ({invites.length})
          </h3>
        }
      >
        {loadingInvites ? (
          <p className="text-xs text-mv-ink-faint py-6 text-center">Chargement…</p>
        ) : invites.length === 0 ? (
          <p className="text-xs text-mv-ink-faint py-6 text-center">Aucune invitation générée pour le moment.</p>
        ) : (
          <div className="space-y-2.5">
            {invites.map((inv) => {
              const expired = new Date(inv.expires_at) < new Date();
              const status = inv.used_at ? 'used' : expired ? 'expired' : 'active';
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={inv.role === 'admin' ? 'amber' : 'neutral'}>{inv.role === 'admin' ? 'Admin' : 'Membre'}</Badge>
                    {inv.department && <span className="text-mv-ink-soft">{inv.department}</span>}
                    <span className="text-mv-ink-faint">
                      {new Date(inv.created_at).toLocaleDateString('fr-CA')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={status === 'used' ? 'green' : status === 'expired' ? 'red' : 'amber'}>
                      {status === 'used' ? 'Utilisée' : status === 'expired' ? 'Expirée' : 'Active'}
                    </Badge>
                    {status === 'active' && (
                      <>
                        <button
                          onClick={() => handleCopy(inv.token)}
                          className="p-1.5 rounded-lg bg-mv-surface hover:bg-mv-green-tint border border-mv-border text-mv-green transition-all cursor-pointer"
                          title="Copier le lien"
                        >
                          {copiedToken === inv.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleRevoke(inv)}
                          disabled={revokingId === inv.id}
                          className="p-1.5 rounded-lg bg-mv-surface hover:bg-mv-red-bg border border-mv-border text-mv-red transition-all cursor-pointer disabled:opacity-50"
                          title="Révoquer ce lien"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
