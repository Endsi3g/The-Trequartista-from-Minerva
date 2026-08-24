'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ShieldAlert, Ban, Users, Building2, Sparkles, UserPlus2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { createClient } from '@/lib/supabase/client';
import {
  createTeamInvite,
  fetchTeamInvites,
  revokeTeamInvite,
  fetchClients,
  createClientInvite,
  fetchRoles,
} from '@/lib/services/supabase-data';
import { TeamInvite, Client, CustomRole } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const WORKSPACES: { value: 'prospection' | 'managing' | null; label: string }[] = [
  { value: null, label: 'Aucun (tout voir)' },
  { value: 'prospection', label: 'Prospection' },
  { value: 'managing', label: 'Managing' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function TeamInvitePage() {
  const { role: currentUserRole, loading: userLoading } = useCurrentUser();
  const { toastSuccess, toastError } = useToast();
  const confirmDialog = useConfirm();

  const [activeTab, setActiveTab] = useState<'team' | 'client'>('team');

  // Team Invite State
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [department, setDepartment] = useState('');
  const [customRoleId, setCustomRoleId] = useState<string>('');
  const [workspace, setWorkspace] = useState<'prospection' | 'managing' | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Client Invite State
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [generatingClientInvite, setGeneratingClientInvite] = useState(false);

  const loadData = async () => {
    setLoadingInvites(true);
    const [teamData, clientData, rolesData] = await Promise.all([
      fetchTeamInvites(),
      fetchClients(),
      fetchRoles(),
    ]);
    setInvites(teamData);
    setClients(clientData);
    setRoles(rolesData);
    if (clientData.length > 0) {
      setSelectedClientId(clientData[0].id);
    }
    setLoadingInvites(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateTeam = async () => {
    setGenerating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setGenerating(false);
      return;
    }
    const invite = await createTeamInvite(role, department.trim() || null, user.id, customRoleId || null, workspace);
    setGenerating(false);
    if (invite) {
      await handleCopy(invite.token, 'team');
      toastSuccess('Lien collaborateur généré & copié', 'Valide 14 jours.');
      await loadData();
    }
  };

  const handleGenerateClient = async () => {
    if (!selectedClientId) return;
    setGeneratingClientInvite(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setGeneratingClientInvite(false);
      return;
    }

    const invite = await createClientInvite(selectedClientId, user.id);
    setGeneratingClientInvite(false);
    if (invite) {
      const url = `${window.location.origin}/portal/join?token=${invite.token}`;
      await navigator.clipboard.writeText(url);
      setCopiedToken(invite.token);
      toastSuccess('Lien portail client copié', 'Transmettez-le à votre client (accès direct au portail).');
      setTimeout(() => setCopiedToken(null), 2500);
    } else {
      toastError('Erreur', "Impossible de générer l'invitation client.");
    }
  };

  const handleCopy = async (token: string, type: 'team' | 'client') => {
    const path = type === 'team' ? '/team/join' : '/portal/join';
    const url = `${window.location.origin}${path}?token=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevoke = async (invite: TeamInvite) => {
    const ok = await confirmDialog({
      title: "Révoquer ce lien d'invitation ?",
      message: 'Il ne pourra plus être utilisé pour rejoindre l\'équipe.',
      confirmLabel: 'Révoquer',
      variant: 'danger',
    });
    if (!ok) return;
    setRevokingId(invite.id);
    await revokeTeamInvite(invite.id);
    await loadData();
    setRevokingId(null);
    toastSuccess('Lien révoqué');
  };

  if (!userLoading && currentUserRole !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/team" className="text-xs text-mv-green hover:underline">Retour à l&apos;équipe</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-16">
      <Link href="/team" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l&apos;équipe
      </Link>

      {/* ── Compact Header ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
          <UserPlus2 className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">Générer une invitation</h1>
          <p className="text-[11px] text-zinc-500">Lien sécurisé valide 14 jours — collaborateur interne ou client sur son portail.</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1 p-1 rounded-[6px] bg-zinc-100/80 border border-mv-border w-fit">
        <button
          onClick={() => setActiveTab('team')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold transition-all cursor-pointer',
            activeTab === 'team' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Collaborateur interne</span>
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold transition-all cursor-pointer',
            activeTab === 'client' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Client (portail)</span>
        </button>
      </div>

      {/* TAB 1: TEAM INVITES */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs space-y-4">
            <SectionLabel>Nouveau lien collaborateur</SectionLabel>

            <div>
              <label className="block text-[11px] font-bold text-mv-ink mb-1.5">Rôle attribué (accès réel)</label>
              <div className="flex items-center gap-2">
                {(['member', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold border transition-all cursor-pointer',
                      role === r ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border hover:text-zinc-900'
                    )}
                  >
                    {r === 'admin' ? 'Admin (accès complet)' : 'Membre (opérations & suivi)'}
                  </button>
                ))}
              </div>
              <p className="text-[10.5px] text-zinc-400 mt-1.5">
                Détermine les policies RLS réelles — indépendant du rôle personnalisé ci-dessous.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-mv-ink mb-1.5">Rôle personnalisé (optionnel)</label>
              {roles.length === 0 ? (
                <p className="text-[11px] text-zinc-400">
                  Aucun rôle personnalisé créé. <Link href="/team?tab=positions" className="text-mv-green hover:underline">En créer un</Link> pour affiner les permissions par module.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomRoleId('')}
                    className={cn(
                      'px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold border transition-all cursor-pointer',
                      customRoleId === '' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border hover:text-zinc-900'
                    )}
                  >
                    Aucun
                  </button>
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCustomRoleId(r.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold border transition-all cursor-pointer',
                        customRoleId === r.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border hover:text-zinc-900'
                      )}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-mv-ink mb-1.5">Espace de travail (filtre de navigation)</label>
              <div className="flex flex-wrap items-center gap-2">
                {WORKSPACES.map((w) => (
                  <button
                    key={w.label}
                    type="button"
                    onClick={() => setWorkspace(w.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold border transition-all cursor-pointer',
                      workspace === w.value ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border hover:text-zinc-900'
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
              <p className="text-[10.5px] text-zinc-400 mt-1.5">
                Filtre la navigation et le tableau de bord — n&apos;affecte jamais les données visibles (les admins voient toujours tout).
              </p>
            </div>

            <div>
              <label htmlFor="department" className="block text-[11px] font-bold text-mv-ink mb-1.5">
                Département de rattachement
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Tech & IA, Marketing, Ventes…"
                className="w-full h-8 px-3 rounded-[4px] bg-white border border-mv-border text-[11.5px] text-mv-ink placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateTeam}
              disabled={generating}
              className="w-full h-8 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{generating ? 'Génération…' : 'Générer et copier le lien collaborateur'}</span>
            </button>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-[6px] shadow-2xs overflow-hidden">
            <div className="px-3.5 pt-3.5">
              <SectionLabel>Liens collaborateurs actifs ({invites.length})</SectionLabel>
            </div>
            {loadingInvites ? (
              <div className="p-8 text-center text-[11px] text-zinc-400">Chargement des invitations…</div>
            ) : invites.length === 0 ? (
              <div className="p-8 text-center text-[11px] text-zinc-400">Aucun lien d&apos;invitation actif.</div>
            ) : (
              <div className="divide-y divide-mv-border px-3.5 pb-1">
                {invites.map((inv) => {
                  const isCopied = copiedToken === inv.token;
                  const invRole = roles.find((r) => r.id === inv.custom_role_id);
                  return (
                    <div key={inv.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-mv-ink font-bold text-[11px]" style={MONO}>{inv.token.slice(0, 14)}…</span>
                          <Badge variant={inv.role === 'admin' ? 'green' : 'neutral'}>{inv.role}</Badge>
                          {invRole && <Badge variant="purple">{invRole.name}</Badge>}
                          {inv.workspace && <Badge variant="blue">{inv.workspace === 'prospection' ? 'Prospection' : 'Managing'}</Badge>}
                          {inv.department && <span className="text-[11px] text-mv-ink-faint">· {inv.department}</span>}
                        </div>
                        <p className="text-[10.5px] text-zinc-400">
                          Expire le {new Date(inv.expires_at).toLocaleDateString('fr-CA')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopy(inv.token, 'team')}
                          className="px-2.5 py-1 rounded-[4px] border border-mv-border bg-white hover:bg-zinc-50 text-[11px] font-medium text-mv-ink flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-mv-green" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copié !' : 'Copier'}</span>
                        </button>

                        <button
                          onClick={() => handleRevoke(inv)}
                          disabled={revokingId === inv.id}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Révoquer le lien"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT PORTAL INVITES */}
      {activeTab === 'client' && (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs space-y-4">
          <SectionLabel>Inviter un client sur son portail</SectionLabel>
          <div>
            <label className="block text-[11px] font-bold text-mv-ink mb-1.5">
              Sélectionner l&apos;entreprise cliente
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full h-8 px-3 rounded-[4px] bg-white border border-mv-border text-[11.5px] text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.industry} ({c.contact_name || c.contact_email})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-[6px] bg-mv-green-tint border border-mv-green/30 text-xs text-mv-ink space-y-1">
            <div className="font-bold text-mv-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-mv-green" />
              <span>Garantie de rôle et d&apos;isolation client</span>
            </div>
            <p className="text-mv-ink-soft">
              Le lien généré associe automatiquement le client à son compte, lui attribue le rôle <strong className="text-mv-ink">Client</strong> et le redirige directement vers son portail personnalisé.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateClient}
            disabled={generatingClientInvite || !selectedClientId}
            className="w-full h-8 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{generatingClientInvite ? 'Génération…' : 'Générer et copier le lien portail client'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
