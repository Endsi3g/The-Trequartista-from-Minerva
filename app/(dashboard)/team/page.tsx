'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  ExternalLink,
  Users,
  Shield,
  MoreHorizontal,
  Gauge,
  Download,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Building,
  Briefcase,
  Award,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { UserAvatar } from '@/components/ui/user-avatar';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
}

const VIEW_TABS = [
  { key: 'employees', label: 'Employés', icon: Users },
  { key: 'departments', label: 'Départements', icon: Building },
  { key: 'positions', label: 'Postes', icon: Briefcase },
  { key: 'performance', label: 'Évaluations de performance', icon: Award },
] as const;

type ViewTabKey = (typeof VIEW_TABS)[number]['key'];

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Finance: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  HR: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  'Ressources Humaines': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  Marketing: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
  Sales: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800', dot: 'bg-sky-500' },
  Ventes: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800', dot: 'bg-sky-500' },
  'Tech & IA': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  Engineering: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  Operations: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800', dot: 'bg-slate-500' },
};

function getDepartmentStyle(dept: string | null) {
  if (!dept) return { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' };
  return DEPARTMENT_COLORS[dept] || { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' };
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTabKey>('employees');
  const [showChanges, setShowChanges] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const filteredMembers = useMemo(() => {
    let list = members;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.department?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [members, query]);

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

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSelected = () => {
    const rows = members.filter((m) => selected.has(m.id));
    const headers = ['ID', 'Nom', 'Courriel', 'Département', 'Rôle', 'Statut', 'Date d\'embauche'];
    const csvRows = rows.map((m, idx) => [
      `"EMP${String(idx + 1).padStart(3, '0')}"`,
      `"${m.full_name || ''}"`,
      m.email || '',
      `"${m.department || 'Général'}"`,
      m.role,
      'Actif',
      new Date(m.created_at).toLocaleDateString('fr-CA'),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `membres-minerva-${new Date().toISOString().slice(0, 10)}.csv`);
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
      {/* Workspace Members Header (Inspiration v1 + v2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mv-ink-faint mb-1">
            <span>Accueil</span>
            <span>&gt;</span>
            <span className="font-semibold text-mv-ink">Gestion de l&apos;équipe & RH</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Membres de l&apos;espace de travail
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft mt-1">
            Ajoutez des coéquipiers pour collaborer ensemble sur vos projets et gérez leurs niveaux d&apos;accès.{' '}
            <Link href="/help" className="text-mv-green hover:underline font-semibold">
              Guide des permissions d&apos;équipe
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isAdmin && (
            <Link href="/team/workload">
              <Button variant="outline" size="sm" icon={<Gauge className="w-4 h-4" />}>
                Charge de travail
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link href="/team/invite">
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} className="bg-mv-ink hover:bg-black text-white">
                Inviter un membre
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Notion-style Database Section */}
      <Card className="p-0 overflow-hidden border border-mv-border shadow-mv-sm">
        {/* Database Controls Header */}
        <div className="p-4 sm:p-5 border-b border-mv-border bg-mv-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Notion Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-mv-cream-soft text-mv-ink border border-mv-border shadow-mv-sm font-bold'
                      : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-mv-green' : 'opacity-70'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Show Changes Switch */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-mv-ink-soft select-none cursor-pointer whitespace-nowrap">
              <span className="hidden sm:inline text-[11px] font-semibold">Afficher changements</span>
              <input
                type="checkbox"
                checked={showChanges}
                onChange={(e) => setShowChanges(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Count & Bulk Actions */}
        <div className="px-5 py-2.5 bg-mv-cream-soft/40 border-b border-mv-border/60 flex items-center justify-between text-xs text-mv-ink-soft">
          <span className="font-semibold text-[11px]">
            {loading ? 'Chargement...' : `${filteredMembers.length} membre${filteredMembers.length > 1 ? 's' : ''}`}
          </span>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-mv-green">{selected.size} sélectionné(s)</span>
              <button
                onClick={handleExportSelected}
                className="px-2.5 py-1 rounded-md bg-mv-surface border border-mv-border text-xs font-semibold text-mv-ink hover:text-mv-green transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Exporter CSV
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1 text-mv-ink-faint hover:text-mv-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Main Table */}
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-mv-cream-soft rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-xs text-mv-ink-soft">
            Aucun membre ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] font-extrabold tracking-wider bg-mv-cream-soft/20">
                  <th className="py-3 pl-5 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Employé</th>
                  <th className="py-3 px-3">Département</th>
                  <th className="py-3 px-3">Courriel</th>
                  <th className="py-3 px-3">Statut d&apos;emploi</th>
                  <th className="py-3 px-3">Prénom & Nom</th>
                  <th className="py-3 px-3">Rôle</th>
                  <th className="py-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border/60">
                {filteredMembers.map((member, idx) => {
                  const empId = `EMP${String(idx + 1).padStart(3, '0')}`;
                  const dept = member.department || (member.role === 'admin' ? 'Tech & IA' : 'Operations');
                  const deptStyle = getDepartmentStyle(dept);
                  const isExpanded = expandedRows.has(member.id);

                  return (
                    <React.Fragment key={member.id}>
                      <tr className={`transition-colors ${selected.has(member.id) ? 'bg-mv-green-tint/30' : 'hover:bg-mv-cream-soft/40'}`}>
                        <td className="py-3 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={selected.has(member.id)}
                            onChange={() => toggleOne(member.id)}
                            className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                          />
                        </td>

                        {/* EMP ID with collapse arrow */}
                        <td className="py-3 px-3">
                          <button
                            onClick={() => toggleExpand(member.id)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-mv-ink hover:text-mv-green transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-mv-ink-faint" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-mv-ink-faint" />
                            )}
                            <span>{empId}</span>
                          </button>
                        </td>

                        {/* Department colored pill */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${deptStyle.bg} ${deptStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${deptStyle.dot}`} />
                            {dept}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-3">
                          <span className="font-mono text-mv-ink-soft text-[11px] truncate block max-w-[180px]">
                            {member.email}
                          </span>
                        </td>

                        {/* Employment status */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Actif
                          </span>
                        </td>

                        {/* First Name & Avatar */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              src={member.avatar_url}
                              name={member.full_name}
                              email={member.email}
                              size="sm"
                              shape="circle"
                            />
                            <span className="font-bold text-mv-ink text-xs">
                              {member.full_name || 'Membre Minerva'}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-3">
                          {isAdmin ? (
                            <select
                              value={member.role}
                              disabled={changingRoleId === member.id}
                              onChange={(e) => handleRoleChange(member, e.target.value as 'admin' | 'member')}
                              className="px-2.5 py-1 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer disabled:opacity-50"
                            >
                              <option value="admin">Propriétaire / Admin</option>
                              <option value="member">Éditeur / Membre</option>
                            </select>
                          ) : (
                            <Badge variant={member.role === 'admin' ? 'green' : 'neutral'}>
                              {member.role === 'admin' ? 'Admin' : 'Membre'}
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 pr-5 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                              className="p-1.5 rounded-lg text-mv-ink-faint hover:bg-mv-cream-soft hover:text-mv-ink transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openMenuId === member.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg py-1 z-50 text-left">
                                  <Link
                                    href={`/team/${member.id}/performance`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-mv-ink hover:bg-mv-cream-soft transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-mv-green" /> Fiche 1-on-1
                                  </Link>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row details (Notion DB sub-row) */}
                      {isExpanded && (
                        <tr className="bg-mv-cream-soft/30 border-b border-mv-border/60">
                          <td colSpan={8} className="py-3 px-8 text-xs text-mv-ink-soft">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-mv-ink-faint block">Date d&apos;arrivée</span>
                                <span className="font-semibold text-mv-ink">
                                  {new Date(member.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase text-mv-ink-faint block">Poste de référence</span>
                                <span className="font-semibold text-mv-ink">{member.role === 'admin' ? 'Direction & Stratégie IA' : 'Spécialiste Opérations'}</span>
                              </div>
                              <div className="flex items-center justify-end">
                                <Link
                                  href={`/team/${member.id}/performance`}
                                  className="text-xs font-bold text-mv-green hover:underline inline-flex items-center gap-1"
                                >
                                  Voir performance 1-on-1 &gt;
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageFadeIn>
  );
}
