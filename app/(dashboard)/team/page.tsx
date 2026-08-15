'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, ExternalLink, Users, Shield, MoreHorizontal, Gauge, Download, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { StatusDot } from '@/components/ui/status-dot';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
}

const ROLE_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'admin', label: 'Admins' },
  { key: 'member', label: 'Membres' },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleTab, setRoleTab] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { role: currentUserRole } = useCurrentUser();
  const isAdmin = currentUserRole === 'admin';
  const { toastSuccess, toastError } = useToast();

  const loadTeam = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, avatar_url, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: true });
      setMembers(data || []);
    } catch {
      // Fallback: show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const getAvatarSrc = (member: TeamMember) => {
    if (member.avatar_url) return member.avatar_url;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.full_name || member.email || 'MV')}&backgroundColor=1E4B33&fontColor=ffffff`;
  };

  const filteredMembers = useMemo(() => {
    let list = members;
    if (roleTab !== 'all') list = list.filter((m) => m.role === roleTab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((m) => m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
    }
    return list;
  }, [members, query, roleTab]);

  const allVisibleSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selected.has(m.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredMembers.forEach((m) => next.delete(m.id));
        return next;
      }
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.add(m.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSelected = () => {
    const rows = members.filter((m) => selected.has(m.id));
    const headers = ['Nom', 'Courriel', 'Rôle', 'Département', 'Membre depuis'];
    const csvRows = rows.map((m) => [
      `"${m.full_name || ''}"`,
      m.email || '',
      m.role,
      `"${m.department || ''}"`,
      new Date(m.created_at).toLocaleDateString('fr-CA'),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `equipe-minerva-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRoleChange = async (member: TeamMember, newRole: 'admin' | 'member') => {
    if (newRole === member.role) return;
    setChangingRoleId(member.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', member.id);
      if (error) {
        toastError('Erreur', "Impossible de modifier le rôle.");
        return;
      }
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
      toastSuccess('Rôle mis à jour', `${member.full_name || member.email} est maintenant ${newRole === 'admin' ? 'admin' : 'membre'}.`);
    } finally {
      setChangingRoleId(null);
      setOpenMenuId(null);
    }
  };

  return (
    <PageFadeIn className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Membres de l&apos;équipe
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Gère les accès de l&apos;équipe et les niveaux de permission de chacun.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/team/workload">
              <Button variant="outline" size="sm" icon={<Gauge className="w-4 h-4" />}>
                Charge de travail
              </Button>
            </Link>
            <Link href="/team/invite">
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                Inviter un membre
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Card
        header={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Répertoire d&apos;équipe</h3>
            <div className="flex items-center gap-1 bg-mv-cream-soft border border-mv-border rounded-xl p-1">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRoleTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs font-bold cursor-pointer ${
                    roleTab === tab.key ? 'bg-mv-surface text-mv-ink shadow-mv-sm border border-mv-border' : 'text-mv-ink-soft hover:text-mv-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un membre…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>
          <span className="text-xs font-bold text-mv-ink-soft shrink-0">
            {loading ? '—' : `${filteredMembers.length} membre${filteredMembers.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 -mx-6 mb-3 px-6 py-2.5 bg-mv-green-tint border-y border-mv-green/20">
            <span className="text-xs font-bold text-mv-green">
              {selected.size} membre{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportSelected} className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Exporter CSV
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1.5 rounded-lg text-mv-ink-faint hover:bg-mv-surface hover:text-mv-ink transition-colors cursor-pointer"
                title="Désélectionner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-mv-cream-soft animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-mv-green-tint border border-mv-green/20 flex items-center justify-center text-mv-green">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-mv-ink">Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 pl-6 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2">Membre</th>
                  <th className="py-3 px-2">Statut</th>
                  <th className="py-3 px-2">Rôle</th>
                  <th className="py-3 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border-soft">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className={`transition-colors ${selected.has(member.id) ? 'bg-mv-green-tint/40' : 'hover:bg-mv-cream-soft/40'}`}>
                    <td className="py-3 pl-6 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(member.id)}
                        onChange={() => toggleOne(member.id)}
                        className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarSrc(member)}
                          alt={member.full_name || member.email || 'Membre'}
                          className="w-9 h-9 rounded-full object-cover border border-mv-border shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.full_name || member.email || 'MV')}&backgroundColor=1E4B33&fontColor=ffffff`;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-mv-ink truncate">{member.full_name || 'Membre Minerva'}</div>
                          <div className="text-[11px] text-mv-ink-soft truncate">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1.5 font-bold text-mv-ink">
                        <StatusDot active />
                        Actif
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {isAdmin ? (
                        <select
                          value={member.role}
                          disabled={changingRoleId === member.id}
                          onChange={(e) => handleRoleChange(member, e.target.value as 'admin' | 'member')}
                          className="px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Membre</option>
                        </select>
                      ) : (
                        <Badge variant={member.role === 'admin' ? 'green' : 'neutral'}>
                          {member.role === 'admin' && <Shield className="w-2.5 h-2.5 inline mr-0.5" />}
                          {member.role === 'admin' ? 'Admin' : 'Membre'}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-6 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                          className="p-2 rounded-lg text-mv-ink-faint hover:bg-mv-cream-soft hover:text-mv-ink transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenuId === member.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg py-1 z-50 text-left">
                              <Link
                                href={`/team/${member.id}/performance`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-mv-ink hover:bg-mv-cream-soft transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Fiche 1-on-1
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageFadeIn>
  );
}
