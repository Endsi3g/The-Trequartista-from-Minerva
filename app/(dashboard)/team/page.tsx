'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  UserPlus,
  Upload,
  Calendar,
  FileSpreadsheet,
  Trash2,
  AlertCircle,
  CheckSquare,
  Phone,
  Instagram,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  fetchDepartments,
  addDepartment,
  deleteDepartment,
  fetchRoles,
  addRole,
  deleteRole,
  fetchCustomRolePermissions,
  setCustomRolePermissions,
  assignCustomRole,
  syncCustomRolePermissionsToAppPermissions,
} from '@/lib/services/supabase-data';
import type { Department, CustomRole, CustomRolePermission } from '@/lib/types';
import { ROLE_MODULE_ACTIONS, ROLE_MODULE_LABELS } from '@/lib/permissions';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  custom_role_id?: string | null;
  phone?: string | null;
  instagram_url?: string | null;
}

const VIEW_TABS = [
  { key: 'employees', label: 'Employés', icon: Users },
  { key: 'departments', label: 'Départements', icon: Building },
  { key: 'positions', label: 'Postes & Rôles', icon: Briefcase },
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
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTabKey>('employees');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const { role: currentUserRole } = useCurrentUser();
  const isAdmin = currentUserRole === 'admin';
  const { toastSuccess, toastError, toastInfo } = useToast();
  const confirmDialog = useConfirm();

  // Lets external links (e.g. "Créer un rôle" on /team/invite) deep-link
  // straight to a tab -- read once on mount, no next/navigation hook needed
  // (avoids the Suspense-boundary requirement useSearchParams() carries).
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && VIEW_TABS.some((t) => t.key === tab)) {
      setActiveTab(tab as ViewTabKey);
    }
  }, []);

  const loadTeam = async () => {
    try {
      const supabase = createClient();
      // `phone`/`instagram_url` ship in a migration that may not be
      // deployed yet -- fall back to the base column set rather than
      // 400ing the whole team directory until it lands.
      let { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, avatar_url, created_at, custom_role_id, phone, instagram_url')
        .eq('approved', true)
        .order('created_at', { ascending: true });
      if (error) {
        const fallback = await supabase
          .from('profiles')
          .select('id, full_name, email, role, department, avatar_url, created_at, custom_role_id')
          .eq('approved', true)
          .order('created_at', { ascending: true });
        data = fallback.data as typeof data;
        error = fallback.error;
      }

      if (data && data.length > 0) {
        setMembers(data);
      } else {
        // Fallback default team members
        setMembers([
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000001',
            full_name: 'Alex Tremblay',
            email: 'alex@minervaflow.com',
            role: 'admin',
            department: 'Tech & IA',
            avatar_url: null,
            created_at: '2026-01-15T00:00:00Z',
            custom_role_id: null,
          },
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000002',
            full_name: 'Sarah Bouchard',
            email: 'sarah@minervaflow.com',
            role: 'member',
            department: 'Operations',
            avatar_url: null,
            created_at: '2026-02-01T00:00:00Z',
            custom_role_id: null,
          },
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000003',
            full_name: 'Thomas Renaud',
            email: 'thomas@minervaflow.com',
            role: 'member',
            department: 'Engineering',
            avatar_url: null,
            created_at: '2026-03-10T00:00:00Z',
            custom_role_id: null,
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
    fetchDepartments().then(setDepartments);
    fetchRoles().then(setRoles);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const toggleAll = () => {
    if (selected.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleRoleChange = async (member: TeamMember, newRole: 'admin' | 'member') => {
    setChangingRoleId(member.id);
    try {
      const supabase = createClient();
      await supabase.from('profiles').update({ role: newRole }).eq('id', member.id);
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
      toastSuccess('Rôle mis à jour', `${member.full_name || member.email} est désormais ${newRole === 'admin' ? 'Administrateur' : 'Membre'}.`);
    } catch {
      toastError('Erreur', 'Impossible de modifier le rôle.');
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    const ok = await confirmDialog({
      title: 'Retirer ce membre de l’équipe ?',
      message: `« ${member.full_name || member.email} » perdra l’accès à l’espace Minerva.`,
      confirmLabel: 'Retirer',
      variant: 'danger',
    });
    if (!ok) return;

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(member.id);
      return next;
    });

    try {
      const supabase = createClient();
      await supabase.from('profiles').update({ approved: false }).eq('id', member.id);
      toastSuccess('Membre retiré', `${member.full_name || member.email} a été retiré.`);
    } catch {
      toastError('Erreur', 'Impossible de retirer le membre.');
      loadTeam();
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const count = selected.size;
    const ok = await confirmDialog({
      title: `Retirer ${count} membre${count > 1 ? 's' : ''} de l’équipe ?`,
      message: `Ces ${count} collaborateurs perdront l’accès à l’espace de travail Minerva.`,
      confirmLabel: `Retirer (${count})`,
      variant: 'danger',
    });
    if (!ok) return;

    setIsDeletingBulk(true);
    const idsToDelete = Array.from(selected);

    setMembers((prev) => prev.filter((m) => !selected.has(m.id)));
    setSelected(new Set());

    try {
      const supabase = createClient();
      await Promise.all(
        idsToDelete.map((id) =>
          supabase.from('profiles').update({ approved: false }).eq('id', id)
        )
      );
      toastSuccess('Membres retirés', `${count} collaborateur${count > 1 ? 's ont été retirés' : ' a été retiré'}.`);
    } catch {
      toastError('Erreur', 'Certains membres n’ont pas pu être retirés.');
      loadTeam();
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleExportSelected = () => {
    const selectedList = members.filter((m) => selected.has(m.id));
    if (selectedList.length === 0) return;

    const header = 'Nom,Email,Rôle,Département,Date Arrivée\n';
    const rows = selectedList
      .map(
        (m) =>
          `"${m.full_name || ''}","${m.email || ''}","${m.role}","${m.department || ''}","${m.created_at}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equipe-selection-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess('Export CSV', `${selectedList.length} membre(s) exporté(s).`);
  };

  const filteredMembers = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return members;
    return members.filter((m) => {
      const matchName = m.full_name?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchDept = m.department?.toLowerCase().includes(q);
      const matchRole = m.role?.toLowerCase().includes(q);
      return matchName || matchEmail || matchDept || matchRole;
    });
  }, [members, query]);

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Membres & Organisation
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({members.length} collaborateur{members.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              href="/team/workload"
              className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Gauge className="w-3.5 h-3.5 text-zinc-500" />
              <span>Charge de travail</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/team/invite"
              className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Inviter un membre"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Inviter un membre</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 2. View Tabs & Filter Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-2.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium transition-all cursor-pointer rounded-[4px] flex items-center gap-1.5 whitespace-nowrap',
                  active
                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-emerald-700' : 'text-zinc-400')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Search Input */}
        {activeTab === 'employees' && (
          <div className="relative shrink-0 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer les collaborateurs... (/)"
              className="w-full h-8 pl-8 pr-2.5 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Tab Contents ── */}
      {activeTab === 'employees' ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          {/* Bulk Actions Bar */}
          {selected.size > 0 && (
            <div className="px-3.5 py-2 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between text-xs animate-in fade-in">
              <span className="font-semibold text-rose-900">
                {selected.size} collaborateur(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSelected}
                  className="h-6 px-2 rounded bg-white border border-zinc-300 text-xs font-medium text-zinc-800 hover:bg-zinc-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Exporter CSV</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isDeletingBulk}
                    className="h-6 px-2.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Supprimer ({selected.size})</span>
                  </button>
                )}
                <button
                  onClick={() => setSelected(new Set())}
                  className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-xs text-zinc-400 text-center py-12 font-mono">Chargement des membres…</p>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  {isAdmin ? 'Aucun membre invité dans l’espace de travail.' : 'Aucun collaborateur trouvé.'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  {isAdmin
                    ? 'Ajoutez vos collaborateurs pour leur assigner des projets Framer, des leads et des accès SOPs.'
                    : 'Seuls les administrateurs peuvent inviter des membres dans l’espace Minerva.'}
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Link
                    href="/team/invite"
                    className="h-8 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Inviter un membre de l’équipe</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-[12px] border-collapse min-w-[720px]">
                <thead>
                  <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                    <th className="pl-3.5 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={selected.size === filteredMembers.length && filteredMembers.length > 0}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-2 text-left font-medium">Identifiant</th>
                    <th className="px-2 text-left font-medium">Collaborateur</th>
                    <th className="px-2 text-left font-medium">Département</th>
                    <th className="px-2 text-left font-medium">Courriel</th>
                    <th className="px-2 text-left font-medium">Rôle</th>
                    <th className="pr-3.5 pl-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredMembers.map((member, idx) => {
                    const empId = `EMP${String(idx + 1).padStart(3, '0')}`;
                    const dept = member.department || (member.role === 'admin' ? 'Tech & IA' : 'Operations');
                    const deptStyle = getDepartmentStyle(dept);
                    const isExpanded = expandedRows.has(member.id);
                    const isSelected = selected.has(member.id);

                    return (
                      <React.Fragment key={member.id}>
                        <tr
                          className={cn(
                            'h-10 transition-colors group',
                            isSelected ? 'bg-emerald-50/30' : 'hover:bg-black/[0.02]'
                          )}
                        >
                          <td className="pl-3.5 pr-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(member.id)}
                              className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-500" style={MONO}>
                            <button
                              onClick={() => toggleExpand(member.id)}
                              className="inline-flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer font-bold"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-zinc-400" />
                              )}
                              <span>{empId}</span>
                            </button>
                          </td>

                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar
                                src={member.avatar_url}
                                name={member.full_name}
                                email={member.email}
                                size="sm"
                                shape="circle"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-zinc-900 text-xs truncate">
                                  {member.full_name || 'Collaborateur Minerva'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-2 py-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold border',
                                deptStyle.bg,
                                deptStyle.text
                              )}
                            >
                              <span className={cn('w-1.5 h-1.5 rounded-full', deptStyle.dot)} />
                              {dept}
                            </span>
                          </td>

                          <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-500" style={MONO}>
                            {member.email}
                          </td>

                          <td className="px-2 py-1.5">
                            {isAdmin ? (
                              <select
                                value={member.role}
                                disabled={changingRoleId === member.id}
                                onChange={(e) =>
                                  handleRoleChange(member, e.target.value as 'admin' | 'member')
                                }
                                className="h-6 px-2 rounded bg-white border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                              >
                                <option value="admin">Administrateur</option>
                                <option value="member">Membre</option>
                              </select>
                            ) : (
                              <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                                {member.role === 'admin' ? 'Administrateur' : 'Membre'}
                              </span>
                            )}
                          </td>

                          <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap space-x-2">
                            <Link
                              href={`/team/${member.id}/performance`}
                              className="text-xs font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Fiche 1-on-1</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>

                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Retirer de l'équipe"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-zinc-50/50 border-b border-zinc-100">
                            <td colSpan={7} className="py-2.5 px-8 text-xs text-zinc-600 space-y-2">
                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                  <span className="text-[10px] uppercase text-zinc-400 font-mono" style={MONO}>
                                    Date d’arrivée :{' '}
                                  </span>
                                  <strong className="text-zinc-800">
                                    {new Date(member.created_at).toLocaleDateString('fr-CA', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-zinc-400 font-mono" style={MONO}>
                                    Poste :{' '}
                                  </span>
                                  <strong className="text-zinc-800">
                                    {member.role === 'admin' ? 'Direction & Lead IA' : 'Spécialiste Delivery & Growth'}
                                  </strong>
                                </div>
                                <Link
                                  href={`/team/${member.id}/performance`}
                                  className="text-xs font-semibold text-emerald-700 hover:underline"
                                >
                                  Voir les revues de performance →
                                </Link>
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                {member.phone ? (
                                  <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline font-medium">
                                    <Phone className="w-3 h-3" />
                                    <span>{member.phone}</span>
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Aucun numéro de téléphone</span>
                                  </span>
                                )}
                                {member.instagram_url && (
                                  <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline font-medium">
                                    <Instagram className="w-3 h-3" />
                                    <span>Instagram</span>
                                  </a>
                                )}
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
        </div>
      ) : activeTab === 'departments' ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Départements de l&apos;agence
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Structure active : Tech & IA, Operations, Engineering, Marketing, Ventes.
            </p>
          </div>
        </div>
      ) : activeTab === 'positions' ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Postes & Rôles
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Développeur Fullstack & Lead IA, Head of Growth, Spécialiste Framer.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Évaluations de Performance
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Suivi des revues trimestrielles et 1-on-1 des collaborateurs.
            </p>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
