'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ShieldAlert, Ban, Users, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/lib/services/supabase-data';
import { TeamInvite, Client } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';

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
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Client Invite State
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [generatingClientInvite, setGeneratingClientInvite] = useState(false);

  const loadData = async () => {
    setLoadingInvites(true);
    const [teamData, clientData] = await Promise.all([
      fetchTeamInvites(),
      fetchClients(),
    ]);
    setInvites(teamData);
    setClients(clientData);
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
    const invite = await createTeamInvite(role, department.trim() || null, user.id);
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link href="/team" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l&apos;équipe
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
          Générer une invitation
        </h1>
        <p className="text-sm text-mv-ink-soft mt-1">
          Crée un lien sécurisé valide 14 jours pour intégrer un membre de l&apos;équipe ou inviter un client sur son portail dédié.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-mv-cream-soft border border-mv-border w-fit">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-mv-green text-white shadow-mv-sm'
              : 'text-mv-ink-soft hover:text-mv-ink'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Collaborateur interne</span>
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'client'
              ? 'bg-mv-green text-white shadow-mv-sm'
              : 'text-mv-ink-soft hover:text-mv-ink'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Client (portail)</span>
        </button>
      </div>

      {/* TAB 1: TEAM INVITES */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Nouveau lien collaborateur</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Rôle attribué</label>
              <div className="flex items-center gap-2">
                {(['member', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === r
                        ? 'bg-mv-ink text-white border-mv-ink shadow-mv-sm'
                        : 'bg-mv-cream-soft text-mv-ink-soft border-mv-border hover:text-mv-ink'
                    }`}
                  >
                    {r === 'admin' ? 'Admin (accès complet)' : 'Membre (opérations & suivi)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="department" className="block text-xs font-bold text-mv-ink mb-1.5">
                Département de rattachement
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Tech & IA, Marketing, Ventes…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateTeam}
              disabled={generating}
              icon={<Copy className="w-3.5 h-3.5" />}
              className="w-full"
            >
              {generating ? 'Génération…' : 'Générer et copier le lien collaborateur'}
            </Button>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-mv-sm overflow-hidden">
            <div className="px-6 pt-6">
              <SectionLabel>Liens collaborateurs actifs ({invites.length})</SectionLabel>
            </div>
            {loadingInvites ? (
              <div className="p-8 text-center text-xs text-mv-ink-soft">Chargement des invitations…</div>
            ) : invites.length === 0 ? (
              <div className="p-8 text-center text-xs text-mv-ink-soft">Aucun lien d&apos;invitation actif.</div>
            ) : (
              <div className="divide-y divide-mv-border px-6 pb-2">
                {invites.map((inv) => {
                  const isCopied = copiedToken === inv.token;
                  return (
                    <div key={inv.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-mv-ink font-bold">{inv.token.slice(0, 16)}…</span>
                          <Badge variant={inv.role === 'admin' ? 'green' : 'neutral'}>{inv.role}</Badge>
                          {inv.department && (
                            <span className="text-[11px] text-mv-ink-soft">· {inv.department}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-mv-ink-faint">
                          Expire le {new Date(inv.expires_at).toLocaleDateString('fr-CA')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopy(inv.token, 'team')}
                          className="px-3 py-1.5 rounded-lg border border-mv-border bg-mv-surface hover:bg-mv-cream-soft text-xs font-semibold text-mv-ink flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-mv-green" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copié !' : 'Copier'}</span>
                        </button>

                        <button
                          onClick={() => handleRevoke(inv)}
                          disabled={revokingId === inv.id}
                          className="p-1.5 text-mv-ink-faint hover:text-mv-red transition-colors cursor-pointer"
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
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Inviter un client sur son portail</SectionLabel>
          <div>
            <label className="block text-xs font-bold text-mv-ink mb-1.5">
              Sélectionner l&apos;entreprise cliente
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.industry} ({c.contact_name || c.contact_email})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-mv-green-tint border border-mv-green/30 text-xs text-mv-ink space-y-1">
            <div className="font-bold text-mv-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-mv-green" />
              <span>Garantie de rôle et d&apos;isolation client</span>
            </div>
            <p className="text-mv-ink-soft">
              Le lien généré associe automatiquement le client à son compte, lui attribue le rôle <strong className="text-mv-ink">Client</strong> et le redirige directement vers son portail personnalisé.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleGenerateClient}
            disabled={generatingClientInvite || !selectedClientId}
            icon={<Copy className="w-3.5 h-3.5" />}
            className="w-full"
          >
            {generatingClientInvite ? 'Génération…' : 'Générer et copier le lien portail client'}
          </Button>
        </div>
      )}
    </div>
  );
}
