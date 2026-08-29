'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Loader2,
  Users,
  Building2,
  Target,
  FolderKanban,
  ArrowRight,
  Copy,
  Check,
  Ban,
  CreditCard,
  Gauge,
  Rocket,
  Sparkles,
  UserPlus2,
  Zap,
  Award,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  fetchTeamInvites,
  revokeTeamInvite,
  createTeamInvite,
  fetchClientInvites,
  revokeClientInvite,
  fetchRoles,
} from '@/lib/services/supabase-data';
import type { TeamInvite, ClientInvite, CustomRole } from '@/lib/types';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

type SearchResult = { title: string; subtitle: string; category: string; href: string; icon: typeof Users };

type MergedInvite = {
  id: string;
  kind: 'team' | 'client';
  label: string;
  sublabel: string;
  status: 'active' | 'used' | 'expired';
  expiresAt: string;
  createdAt: string;
};

const HUB_LINKS = [
  { href: '/team', label: 'Équipe', desc: 'Employés, départements, postes & rôles', icon: Users },
  { href: '/team/invite', label: 'Inviter', desc: 'Liens collaborateur & portail client', icon: UserPlus2 },
  { href: '/team/workload', label: 'Charge de travail', desc: 'Répartition des tâches par membre', icon: Gauge },
  { href: '/settings/permissions', label: 'Permissions', desc: 'app_permissions par membre', icon: ShieldCheck },
  { href: '/settings/billing', label: 'Facturation', desc: 'Abonnements & liens de paiement', icon: CreditCard },
  { href: '/acquisition', label: 'Acquisition', desc: 'Leads entrants, SMS, audits IA', icon: Target },
  { href: '/produits', label: 'Produits Minerva', desc: 'Roadmap produit interne', icon: Rocket },
  { href: '/changelog', label: 'Nouveautés', desc: 'Publier une entrée de changelog', icon: Sparkles },
] as const;

function statusOf(usedAt: string | null, expiresAt: string | null | undefined): MergedInvite['status'] {
  if (usedAt) return 'used';
  if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
  return 'active';
}

const STATUS_BADGE: Record<MergedInvite['status'], { variant: 'green' | 'neutral' | 'red'; label: string }> = {
  active: { variant: 'green', label: 'Actif' },
  used: { variant: 'neutral', label: 'Utilisé' },
  expired: { variant: 'red', label: 'Expiré / révoqué' },
};

export default function AdminPanelPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const confirmDialog = useConfirm();
  const { toastSuccess, toastError } = useToast();
  const isAdmin = role === 'admin';

  const [loading, setLoading] = useState(true);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [clientInvites, setClientInvites] = useState<(ClientInvite & { client_name: string })[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [kpi, setKpi] = useState({ members: 0, clients: 0 });
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Global search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Bulk quick-generate
  const [bulkRole, setBulkRole] = useState<'admin' | 'member'>('member');
  const [bulkCustomRoleId, setBulkCustomRoleId] = useState('');
  const [bulkWorkspace, setBulkWorkspace] = useState<'prospection' | 'managing' | null>(null);
  const [bulkQuantity, setBulkQuantity] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [team, client, rolesData, membersCount, clientsCount] = await Promise.all([
      fetchTeamInvites(),
      fetchClientInvites(),
      fetchRoles(),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('approved', true),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
    ]);
    setTeamInvites(team);
    setClientInvites(client);
    setRoles(rolesData);
    setKpi({ members: membersCount.count || 0, clients: clientsCount.count || 0 });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
    else if (!userLoading) setLoading(false);
  }, [isAdmin, userLoading, load]);

  // ── Global search: clients / leads / projects / members, in parallel ──
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const term = `%${query.trim()}%`;
      const [clients, leads, projects, members] = await Promise.all([
        supabase.from('clients').select('id, name, industry').ilike('name', term).limit(5),
        supabase.from('leads').select('id, contact_name, company_name').or(`contact_name.ilike.${term},company_name.ilike.${term}`).limit(5),
        supabase.from('projects').select('id, name, client_name').ilike('name', term).limit(5),
        supabase.from('profiles').select('id, full_name, email, role').or(`full_name.ilike.${term},email.ilike.${term}`).limit(5),
      ]);

      setResults([
        ...(clients.data || []).map((c) => ({ title: c.name, subtitle: c.industry || 'Client', category: 'Client', href: `/clients/${c.id}/roi-tracker`, icon: Building2 })),
        ...(leads.data || []).map((l) => ({ title: l.company_name || l.contact_name, subtitle: l.contact_name, category: 'Lead', href: '/leads', icon: Target })),
        ...(projects.data || []).map((p) => ({ title: p.name, subtitle: p.client_name || 'Projet', category: 'Projet', href: '/projects', icon: FolderKanban })),
        ...(members.data || []).map((m) => ({ title: m.full_name || m.email, subtitle: m.role === 'admin' ? 'Admin' : m.role === 'member' ? 'Membre' : 'Client', category: 'Membre', href: '/team', icon: Users })),
      ]);
      setSearching(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const mergedInvites: MergedInvite[] = useMemo(() => {
    const team: MergedInvite[] = teamInvites.map((inv) => ({
      id: inv.id,
      kind: 'team',
      label: `${inv.token.slice(0, 14)}…`,
      sublabel: `${inv.role === 'admin' ? 'Admin' : 'Membre'}${inv.department ? ` · ${inv.department}` : ''}${inv.workspace ? ` · ${inv.workspace === 'prospection' ? 'Prospection' : 'Managing'}` : ''}`,
      status: statusOf(inv.used_at, inv.expires_at),
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
    }));
    const client: MergedInvite[] = clientInvites.map((inv) => ({
      id: inv.id,
      kind: 'client',
      label: inv.client_name,
      sublabel: 'Portail client',
      status: statusOf(inv.used_at, inv.expires_at),
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
    }));
    return [...team, ...client].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [teamInvites, clientInvites]);

  const activeInviteCount = mergedInvites.filter((i) => i.status === 'active').length;

  const handleRevoke = async (inv: MergedInvite) => {
    const ok = await confirmDialog({
      title: 'Révoquer ce lien ?',
      message: `Le lien pour « ${inv.label} » ne pourra plus être utilisé.`,
      confirmLabel: 'Révoquer',
      variant: 'danger',
    });
    if (!ok) return;
    setRevokingId(inv.id);
    if (inv.kind === 'team') await revokeTeamInvite(inv.id);
    else await revokeClientInvite(inv.id);
    await load();
    setRevokingId(null);
    toastSuccess('Lien révoqué');
  };

  const handleBulkGenerate = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setGenerating(true);
    const count = Math.min(10, Math.max(1, bulkQuantity));
    const created = await Promise.all(
      Array.from({ length: count }, () => createTeamInvite(bulkRole, null, user.id, bulkCustomRoleId || null, bulkWorkspace))
    );
    const links = created
      .filter(Boolean)
      .map((inv) => `${window.location.origin}/team/join?token=${inv!.token}`);
    setGeneratedLinks(links);
    setGenerating(false);
    if (links.length > 0) {
      toastSuccess(`${links.length} lien${links.length > 1 ? 's' : ''} généré${links.length > 1 ? 's' : ''}`, 'Copiez-les ci-dessous.');
      await load();
    } else {
      toastError('Erreur', 'Aucun lien n\'a pu être généré.');
    }
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(generatedLinks.join('\n'));
    setCopiedAll(true);
    toastSuccess('Liens copiés');
    setTimeout(() => setCopiedAll(false), 2500);
  };

  if (!userLoading && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">Retour à l&apos;accueil</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-16">
      {/* ── Header ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">Panneau Admin</h1>
          <p className="text-[11px] text-zinc-500">Invitations, recherche globale et raccourcis vers les outils d&apos;administration.</p>
        </div>
      </div>

      {/* ── KPI Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Membres actifs', value: kpi.members, icon: Users },
          { label: 'Invitations actives', value: activeInviteCount, icon: UserPlus2 },
          { label: 'Rôles personnalisés', value: roles.length, icon: Award },
          { label: 'Clients', value: kpi.clients, icon: Building2 },
        ].map((k) => (
          <div key={k.label} className="bg-mv-surface border border-mv-border rounded-[6px] p-3 shadow-2xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-700 shrink-0">
              <k.icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-semibold text-zinc-900 font-mono" style={MONO}>{loading ? '—' : k.value}</div>
              <div className="text-[10.5px] text-zinc-500 truncate">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Global search ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs space-y-3">
        <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest">Recherche globale</h2>
        <div className="relative">
          {searching ? (
            <Loader2 className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un client, un lead, un projet ou un membre…"
            className="w-full h-8 pl-8 pr-2.5 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
          />
        </div>
        {query.trim() && (
          <div className="divide-y divide-mv-border border border-mv-border rounded-[4px] overflow-hidden">
            {results.length === 0 && !searching ? (
              <div className="p-4 text-center text-[11px] text-zinc-400">Aucun résultat pour « {query} ».</div>
            ) : (
              results.map((r, i) => (
                <Link key={i} href={r.href} className="flex items-center justify-between p-2.5 hover:bg-black/[0.02] transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-700 shrink-0">
                      <r.icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-semibold text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">{r.title}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{r.category} · {r.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Bulk generation ── */}
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs space-y-3">
          <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest">Génération de liens en masse</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10.5px] font-bold text-mv-ink mb-1">Rôle</label>
              <div className="flex items-center gap-1.5">
                {(['member', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setBulkRole(r)}
                    className={cn(
                      'px-2 py-1 rounded-[4px] text-[10.5px] font-semibold border transition-all cursor-pointer',
                      bulkRole === r ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border'
                    )}
                  >
                    {r === 'admin' ? 'Admin' : 'Membre'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10.5px] font-bold text-mv-ink mb-1">Quantité (max 10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(Number(e.target.value) || 1)}
                className="w-full h-7 px-2 rounded-[4px] border border-mv-border bg-white text-[11px] text-zinc-900 focus:outline-none focus:border-mv-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-mv-ink mb-1">Espace de travail</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[{ value: null, label: 'Aucun' }, { value: 'prospection' as const, label: 'Prospection' }, { value: 'managing' as const, label: 'Managing' }].map((w) => (
                <button
                  key={w.label}
                  type="button"
                  onClick={() => setBulkWorkspace(w.value)}
                  className={cn(
                    'px-2 py-1 rounded-[4px] text-[10.5px] font-semibold border transition-all cursor-pointer',
                    bulkWorkspace === w.value ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border'
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {roles.length > 0 && (
            <div>
              <label className="block text-[10.5px] font-bold text-mv-ink mb-1">Rôle personnalisé</label>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBulkCustomRoleId('')}
                  className={cn(
                    'px-2 py-1 rounded-[4px] text-[10.5px] font-semibold border transition-all cursor-pointer',
                    bulkCustomRoleId === '' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border'
                  )}
                >
                  Aucun
                </button>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setBulkCustomRoleId(r.id)}
                    className={cn(
                      'px-2 py-1 rounded-[4px] text-[10.5px] font-semibold border transition-all cursor-pointer',
                      bulkCustomRoleId === r.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-mv-border'
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleBulkGenerate}
            disabled={generating}
            className="w-full h-8 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            {generating ? 'Génération…' : `Générer ${bulkQuantity} lien${bulkQuantity > 1 ? 's' : ''}`}
          </button>

          {generatedLinks.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-zinc-500">{generatedLinks.length} lien(s) généré(s)</span>
                <button
                  onClick={handleCopyAll}
                  className="text-[10.5px] font-medium text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copier tout</span>
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[10px] text-zinc-500 bg-zinc-50 border border-mv-border rounded-[4px] p-2" style={MONO}>
                {generatedLinks.map((l) => <div key={l} className="truncate">{l}</div>)}
              </div>
            </div>
          )}
        </div>

        {/* ── Merged invitations management ── */}
        <div className="bg-mv-surface border border-mv-border rounded-[6px] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 pb-2">
            <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest">Invitations ({mergedInvites.length})</h2>
          </div>
          <div className="flex-1 max-h-[420px] overflow-y-auto divide-y divide-mv-border">
            {loading ? (
              <div className="p-6 text-center text-[11px] text-zinc-400">Chargement…</div>
            ) : mergedInvites.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-zinc-400">Aucune invitation générée.</div>
            ) : (
              mergedInvites.map((inv) => {
                const badge = STATUS_BADGE[inv.status];
                return (
                  <div key={`${inv.kind}-${inv.id}`} className="px-3.5 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={inv.kind === 'team' ? 'blue' : 'purple'}>{inv.kind === 'team' ? 'Équipe' : 'Client'}</Badge>
                        <span className="text-[11px] font-semibold text-zinc-900 truncate">{inv.label}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="text-[10.5px] text-zinc-400 truncate">{inv.sublabel}</p>
                    </div>
                    {inv.status === 'active' && (
                      <button
                        onClick={() => handleRevoke(inv)}
                        disabled={revokingId === inv.id}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                        title="Révoquer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Hub links ── */}
      <div className="space-y-2">
        <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest px-0.5">Raccourcis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {HUB_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-mv-surface border border-mv-border hover:border-zinc-300 rounded-[6px] p-3 shadow-2xs transition-all flex items-start gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-700 shrink-0 group-hover:border-emerald-600 group-hover:text-emerald-700 transition-colors">
                <link.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate">{link.label}</div>
                <div className="text-[10px] text-zinc-400 truncate">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
