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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
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
  custom_role_id: string | null;
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
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTabKey>('employees');
  const [showChanges, setShowChanges] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentColor, setNewDepartmentColor] = useState('Operations');
  const [performancePickerOpen, setPerformancePickerOpen] = useState(false);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [addingRole, setAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [rolePermissionsByRole, setCustomRolePermissionsByRole] = useState<Record<string, CustomRolePermission[]>>({});
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const { role: currentUserRole } = useCurrentUser();
  const isAdmin = currentUserRole === 'admin';
  const { toastSuccess, toastError } = useToast();

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
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, avatar_url, created_at, custom_role_id')
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
    fetchDepartments().then(setDepartments);
    fetchRoles().then(setRoles);
  }, []);

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const role = await addRole({ name: newRoleName.trim(), description: newRoleDescription.trim() || null, created_by: user.id });
    if (role) {
      setRoles((prev) => [...prev, role].sort((a, b) => a.name.localeCompare(b.name)));
      setNewRoleName('');
      setNewRoleDescription('');
      setAddingRole(false);
      toastSuccess('Rôle créé', `« ${role.name} » est maintenant disponible.`);
    } else {
      toastError('Erreur', 'Impossible de créer ce rôle.');
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    if (expandedRoleId === role.id) setExpandedRoleId(null);
    const ok = await deleteRole(role.id);
    if (!ok) {
      toastError('Erreur', 'Impossible de supprimer ce rôle.');
      setRoles((prev) => [...prev, role].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleExpandRole = async (roleId: string) => {
    if (expandedRoleId === roleId) {
      setExpandedRoleId(null);
      return;
    }
    setExpandedRoleId(roleId);
    if (!rolePermissionsByRole[roleId]) {
      const perms = await fetchCustomRolePermissions(roleId);
      setCustomRolePermissionsByRole((prev) => ({ ...prev, [roleId]: perms }));
    }
  };

  const togglePermission = (roleId: string, moduleKey: string, action: CustomRolePermission['action']) => {
    setCustomRolePermissionsByRole((prev) => {
      const current = prev[roleId] || [];
      const has = current.some((p) => p.module === moduleKey && p.action === action);
      const next = has
        ? current.filter((p) => !(p.module === moduleKey && p.action === action))
        : [...current, { id: `draft-${moduleKey}-${action}`, role_id: roleId, module: moduleKey, action }];
      return { ...prev, [roleId]: next };
    });
  };

  const handleSavePermissions = async (roleId: string) => {
    setSavingRoleId(roleId);
    const perms = rolePermissionsByRole[roleId] || [];
    const ok = await setCustomRolePermissions(roleId, perms.map((p) => ({ module: p.module, action: p.action })));
    if (ok) {
      const affectedMembers = members.filter((m) => m.custom_role_id === roleId);
      await Promise.all(affectedMembers.map((m) => syncCustomRolePermissionsToAppPermissions(m.id)));
      toastSuccess('Permissions enregistrées', affectedMembers.length > 0 ? `${affectedMembers.length} membre(s) mis à jour.` : undefined);
    } else {
      toastError('Erreur', "Impossible d'enregistrer les permissions.");
    }
    setSavingRoleId(null);
  };

  const handleAssignRole = async (member: TeamMember, roleId: string | null) => {
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, custom_role_id: roleId } : m)));
    const ok = await assignCustomRole(member.id, roleId);
    if (ok) {
      await syncCustomRolePermissionsToAppPermissions(member.id);
    } else {
      toastError('Erreur', "Impossible d'assigner ce rôle.");
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, custom_role_id: member.custom_role_id } : m)));
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dept = await addDepartment({ name: newDepartmentName.trim(), color: newDepartmentColor, created_by: user.id });
    if (dept) {
      setDepartments((prev) => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)));
      setNewDepartmentName('');
      setAddingDepartment(false);
      toastSuccess('Département créé', `« ${dept.name} » est maintenant disponible.`);
    } else {
      toastError('Erreur', 'Impossible de créer ce département.');
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    const ok = await deleteDepartment(dept.id);
    if (!ok) {
      toastError('Erreur', 'Impossible de supprimer ce département.');
      setDepartments((prev) => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  // Keyboard shortcut: 'A' then 'M' or 'I' to invite
  useEffect(() => {
    let keyBuffer = '';
    let timer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      keyBuffer += e.key.toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(() => {
        keyBuffer = '';
      }, 800);

      if (keyBuffer.includes('am') || e.key.toLowerCase() === 'i') {
        if (isAdmin) {
          e.preventDefault();
          router.push('/team/invite');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isAdmin, router]);

  const handleRoleChange = async (member: TeamMember, newRole: 'admin' | 'member') => {
    if (!isAdmin) return;
    setChangingRoleId(member.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', member.id);
      if (error) throw error;
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
      toastSuccess('Rôle modifié', `${member.full_name || 'Le membre'} est maintenant ${newRole === 'admin' ? 'Administrateur' : 'Membre'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toastError('Erreur', msg);
    } finally {
      setChangingRoleId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredMembers = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    );
  }, [members, query]);

  const toggleAll = () => {
    if (selected.size === filteredMembers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMembers.map((m) => m.id)));
    }
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
    const selectedList = members.filter((m) => selected.has(m.id));
    const header = 'ID,Nom,Email,Rôle,Département,Date\n';
    const rows = selectedList
      .map((m, idx) => `EMP${String(idx + 1).padStart(3, '0')},"${m.full_name || ''}","${m.email || ''}",${m.role},"${m.department || ''}",${m.created_at}`)
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
              title="Inviter un membre (Raccourci: A puis M)"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Inviter un membre</span>
              <kbd className="hidden sm:inline text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">A then M</kbd>
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

      {/* ── 3. Tab Contents with Admin vs Member Proactive Empty States ── */}
      {activeTab === 'employees' ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          {/* Bulk Actions Bar */}
          {selected.size > 0 && (
            <div className="px-3.5 py-2 bg-emerald-50/60 border-b border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800">{selected.size} collaborateur(s) sélectionné(s)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSelected}
                  className="h-6 px-2 rounded bg-white border border-emerald-300 text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Exporter CSV</span>
                </button>
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
            /* ── Proactive Empty State : Membres de l'équipe ── */
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
                    <kbd className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">A then M</kbd>
                  </Link>
                  <Link
                    href="/team/invite"
                    className="h-8 px-3 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Importer une liste CSV</span>
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
                    <th className="px-2 text-left font-medium">Département</th>
                    <th className="px-2 text-left font-medium">Courriel</th>
                    <th className="px-2 text-left font-medium">Prénom & Nom</th>
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

                    return (
                      <React.Fragment key={member.id}>
                        <tr className="h-9 hover:bg-black/[0.02] transition-colors group">
                          <td className="pl-3.5 pr-2 py-1">
                            <input
                              type="checkbox"
                              checked={selected.has(member.id)}
                              onChange={() => toggleOne(member.id)}
                              className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          <td className="px-2 py-1 font-mono text-[11px] text-zinc-500" style={MONO}>
                            <button
                              onClick={() => toggleExpand(member.id)}
                              className="inline-flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer font-bold"
                            >
                              {isExpanded ? <ChevronDown className="w-3 h-3 text-zinc-400" /> : <ChevronRight className="w-3 h-3 text-zinc-400" />}
                              <span>{empId}</span>
                            </button>
                          </td>

                          <td className="px-2 py-1">
                            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold border', deptStyle.bg, deptStyle.text)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', deptStyle.dot)} />
                              {dept}
                            </span>
                          </td>

                          <td className="px-2 py-1 font-mono text-[11px] text-zinc-500" style={MONO}>
                            {member.email}
                          </td>

                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              <UserAvatar src={member.avatar_url} name={member.full_name} email={member.email} size="xs" shape="circle" />
                              <span className="font-semibold text-zinc-900 text-xs">
                                {member.full_name || 'Collaborateur Minerva'}
                              </span>
                            </div>
                          </td>

                          <td className="px-2 py-1">
                            {isAdmin ? (
                              <select
                                value={member.role}
                                disabled={changingRoleId === member.id}
                                onChange={(e) => handleRoleChange(member, e.target.value as 'admin' | 'member')}
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

                          <td className="pr-3.5 pl-2 py-1 text-right">
                            <Link
                              href={`/team/${member.id}/performance`}
                              className="text-xs font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Fiche 1-on-1</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-zinc-50/50 border-b border-zinc-100">
                            <td colSpan={7} className="py-2.5 px-8 text-xs text-zinc-600">
                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                  <span className="text-[10px] uppercase text-zinc-400 font-mono" style={MONO}>Date d’arrivée : </span>
                                  <strong className="text-zinc-800">
                                    {new Date(member.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-zinc-400 font-mono" style={MONO}>Poste : </span>
                                  <strong className="text-zinc-800">{member.role === 'admin' ? 'Direction & IA' : 'Spécialiste Delivery'}</strong>
                                </div>
                                <Link href={`/team/${member.id}/performance`} className="text-xs font-semibold text-emerald-700 hover:underline">
                                  Voir les revues de performance →
                                </Link>
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
        <div className="space-y-3">
          {departments.length === 0 && !addingDepartment ? (
            /* ── Empty State : Départements ── */
            <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  {isAdmin ? 'Aucun département configuré.' : 'Aucun département disponible.'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  {isAdmin
                    ? 'Structurez votre agence (ex: Design Framer, Growth & Prospection, IA & Systèmes).'
                    : 'Les départements de l’agence seront affichés ici dès leur configuration par un administrateur.'}
                </p>
              </div>
              {isAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => setAddingDepartment(true)}
                    className="h-8 px-3.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Créer un département</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-mv-surface border border-mv-border rounded-[6px] shadow-2xs divide-y divide-mv-border">
              {departments.map((dept) => {
                const memberCount = members.filter((m) => m.department === dept.name).length;
                const style = getDepartmentStyle(dept.color);
                return (
                  <div key={dept.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('w-2.5 h-2.5 rounded-full', style.dot)} />
                      <span className="text-sm font-semibold text-zinc-900">{dept.name}</span>
                      <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                        {memberCount} membre{memberCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteDepartment(dept)}
                        className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {isAdmin && !addingDepartment && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => setAddingDepartment(true)}
                    className="h-8 px-3.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Créer un département</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {isAdmin && addingDepartment && (
            <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Nom du département"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                className="flex-1 h-8 px-3 text-xs rounded-md border border-zinc-200 focus:outline-none focus:border-emerald-600"
              />
              <select
                value={newDepartmentColor}
                onChange={(e) => setNewDepartmentColor(e.target.value)}
                className="h-8 px-2 text-xs rounded-md border border-zinc-200 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {Object.keys(DEPARTMENT_COLORS).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setAddingDepartment(false); setNewDepartmentName(''); }}
                  className="h-8 px-3 rounded-md text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddDepartment}
                  disabled={!newDepartmentName.trim()}
                  className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  Créer
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'positions' ? (
        <div className="space-y-3">
          {roles.length === 0 && !addingRole ? (
            /* ── Empty State : Postes & Rôles ── */
            <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  {isAdmin ? 'Définissez les rôles personnalisés de l’agence.' : 'Aucun rôle configuré.'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  {isAdmin
                    ? 'Créez un rôle, cochez ses permissions par module, puis assignez-le à des membres.'
                    : 'Les rôles et permissions associées apparaîtront ici.'}
                </p>
              </div>
              {isAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => setAddingRole(true)}
                    className="h-8 px-3.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Créer un rôle</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-mv-surface border border-mv-border rounded-[6px] shadow-2xs divide-y divide-mv-border">
              {roles.map((role) => {
                const isExpanded = expandedRoleId === role.id;
                const perms = rolePermissionsByRole[role.id] || [];
                const memberCount = members.filter((m) => m.custom_role_id === role.id).length;
                return (
                  <div key={role.id}>
                    <button
                      onClick={() => handleExpandRole(role.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                        <span className="text-sm font-semibold text-zinc-900 truncate">{role.name}</span>
                        {role.description && <span className="text-[11px] text-zinc-400 truncate hidden sm:inline">{role.description}</span>}
                        <span className="text-[11px] text-zinc-400 font-mono shrink-0" style={MONO}>
                          {memberCount} membre{memberCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      {isAdmin && (
                        <span
                          onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                          className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer p-1 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 bg-zinc-50/60">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Permissions</p>
                          <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10.5px] uppercase tracking-wider text-zinc-400">
                                  <th className="text-left px-3 py-1.5 font-medium">Module</th>
                                  {(['view', 'create', 'edit', 'delete'] as const).map((action) => (
                                    <th key={action} className="text-center px-2 py-1.5 font-medium capitalize">{action}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(ROLE_MODULE_ACTIONS).map(([moduleKey, actions]) => (
                                  <tr key={moduleKey} className="border-b border-zinc-100 last:border-0">
                                    <td className="px-3 py-1.5 font-semibold text-zinc-800">{ROLE_MODULE_LABELS[moduleKey] || moduleKey}</td>
                                    {(['view', 'create', 'edit', 'delete'] as const).map((action) => {
                                      const supported = Boolean(actions[action]);
                                      const checked = perms.some((p) => p.module === moduleKey && p.action === action);
                                      return (
                                        <td key={action} className="text-center px-2 py-1.5">
                                          {supported ? (
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              disabled={!isAdmin}
                                              onChange={() => togglePermission(role.id, moduleKey, action)}
                                              className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer disabled:cursor-default"
                                            />
                                          ) : (
                                            <span className="text-zinc-300">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {isAdmin && (
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleSavePermissions(role.id)}
                                disabled={savingRoleId === role.id}
                                className="h-7 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium cursor-pointer disabled:opacity-50"
                              >
                                {savingRoleId === role.id ? 'Enregistrement…' : 'Enregistrer les permissions'}
                              </button>
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Membres assignés</p>
                            <div className="bg-white border border-zinc-200 rounded-md divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                              {members.filter((m) => m.role === 'member').map((m) => {
                                const has = m.custom_role_id === role.id;
                                return (
                                  <label key={m.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-zinc-50">
                                    <input
                                      type="checkbox"
                                      checked={has}
                                      onChange={() => handleAssignRole(m, has ? null : role.id)}
                                      className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                                    />
                                    <UserAvatar src={m.avatar_url} name={m.full_name || 'Membre'} size="xs" shape="circle" />
                                    <span className="text-xs font-medium text-zinc-900">{m.full_name || 'Membre'}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {isAdmin && !addingRole && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => setAddingRole(true)}
                    className="h-8 px-3.5 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Créer un rôle</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {isAdmin && addingRole && (
            <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Nom du rôle (ex: Responsable Prospection)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="flex-1 h-8 px-3 text-xs rounded-md border border-zinc-200 focus:outline-none focus:border-emerald-600"
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                className="flex-1 h-8 px-3 text-xs rounded-md border border-zinc-200 focus:outline-none focus:border-emerald-600"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setAddingRole(false); setNewRoleName(''); setNewRoleDescription(''); }}
                  className="h-8 px-3 rounded-md text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddRole}
                  disabled={!newRoleName.trim()}
                  className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  Créer
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Proactive Empty State : Évaluations de Performances ── */
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {isAdmin ? 'Aucune évaluation de performance planifiée.' : 'Aucune revue enregistrée.'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {isAdmin
                ? 'Configurez les revues mensuelles ou trimestrielles sur l’atteinte des KPIs et des livrables.'
                : 'Vos bilans et points d’étape 1-on-1 apparaîtront dans cet espace.'}
            </p>
          </div>
          {isAdmin && (
            <div className="pt-2">
              {!performancePickerOpen ? (
                <button
                  onClick={() => setPerformancePickerOpen(true)}
                  className="h-8 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Planifier une revue de performance</span>
                </button>
              ) : (
                <div className="max-w-xs mx-auto text-left space-y-1.5">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Choisir un membre</p>
                  <div className="bg-white border border-zinc-200 rounded-md divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => router.push(`/team/${m.id}/performance`)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 text-left cursor-pointer"
                      >
                        <UserAvatar src={m.avatar_url} name={m.full_name || 'Membre'} size="xs" shape="circle" />
                        <span className="text-xs font-medium text-zinc-900">{m.full_name || 'Membre'}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPerformancePickerOpen(false)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageFadeIn>
  );
}
