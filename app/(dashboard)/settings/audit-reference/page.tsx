'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  fetchRoleHourlyRates,
  upsertRoleHourlyRate,
  fetchToolCompatibilityDictionary,
  upsertToolCompatibilityEntry,
} from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { RoleHourlyRate, ToolCompatibilityEntry } from '@/lib/types';

const FEASIBILITY_OPTIONS: ToolCompatibilityEntry['integration_feasibility'][] = ['unknown', 'low', 'medium', 'high'];

export default function AuditReferenceSettingsPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const { toastSuccess, toastError } = useToast();
  const [rates, setRates] = useState<RoleHourlyRate[]>([]);
  const [tools, setTools] = useState<ToolCompatibilityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleRate, setNewRoleRate] = useState(35);
  const [newToolName, setNewToolName] = useState('');

  const load = async () => {
    setLoading(true);
    const [r, t] = await Promise.all([fetchRoleHourlyRates(), fetchToolCompatibilityDictionary()]);
    setRates(r);
    setTools(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/audits" className="text-xs text-mv-green hover:underline">Retour aux audits</Link>
      </div>
    );
  }

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const success = await upsertRoleHourlyRate(newRoleName.trim(), Number(newRoleRate), user?.id || '');
    if (!success) {
      toastError('Erreur', "Impossible d'enregistrer ce taux.");
      return;
    }
    toastSuccess('Taux enregistré');
    setNewRoleName('');
    load();
  };

  const handleUpdateRate = async (roleName: string, rate: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await upsertRoleHourlyRate(roleName, rate, user?.id || '');
  };

  const handleAddTool = async () => {
    if (!newToolName.trim()) return;
    const success = await upsertToolCompatibilityEntry({ tool_name: newToolName.trim(), integration_feasibility: 'unknown' });
    if (!success) {
      toastError('Erreur', "Impossible d'enregistrer cet outil.");
      return;
    }
    setNewToolName('');
    load();
  };

  const handleUpdateTool = async (toolName: string, feasibility: ToolCompatibilityEntry['integration_feasibility']) => {
    await upsertToolCompatibilityEntry({ tool_name: toolName, integration_feasibility: feasibility });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/audits" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux audits
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Données de Référence des Audits</h1>
      <p className="text-sm text-mv-ink-soft -mt-4">
        Taux horaires par rôle et dictionnaire de compatibilité d'outils, utilisés par le calculateur de coûts cachés et l'évaluation du stack technologique. Modifiables sans redéploiement.
      </p>

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Taux Horaires par Rôle (CAD)</h3>}>
        {loading ? (
          <div className="p-4 text-center text-xs text-mv-ink-soft">Chargement…</div>
        ) : (
          <div className="space-y-2 text-xs">
            {rates.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border">
                <span className="font-bold text-mv-ink">{r.role_name}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    defaultValue={r.hourly_rate_cad}
                    onBlur={(e) => handleUpdateRate(r.role_name, Number(e.target.value))}
                    className="w-20 text-right bg-mv-surface border border-mv-border rounded px-2 py-1 font-mono"
                  />
                  <span className="text-mv-ink-soft">$/h</span>
                </div>
              </div>
            ))}
            {rates.length === 0 && <p className="text-mv-ink-soft text-center py-3">Aucun taux configuré.</p>}
            <div className="flex items-center gap-2 pt-2 border-t border-mv-border">
              <input type="text" placeholder="Nom du rôle (ex: Réceptionniste)" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="flex-1 bg-mv-cream-soft border border-mv-border rounded px-2.5 py-1.5" />
              <input type="number" value={newRoleRate} onChange={(e) => setNewRoleRate(Number(e.target.value))} className="w-20 text-right bg-mv-cream-soft border border-mv-border rounded px-2 py-1.5 font-mono" />
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddRole}>Ajouter</Button>
            </div>
          </div>
        )}
      </Card>

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Dictionnaire de Compatibilité des Outils</h3>}>
        {loading ? (
          <div className="p-4 text-center text-xs text-mv-ink-soft">Chargement…</div>
        ) : (
          <div className="space-y-2 text-xs">
            {tools.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border">
                <div>
                  <span className="font-bold text-mv-ink">{t.tool_name}</span>
                  {t.integration_feasibility === 'unknown' && <Badge variant="amber" className="ml-2">À évaluer</Badge>}
                </div>
                <select
                  defaultValue={t.integration_feasibility}
                  onChange={(e) => handleUpdateTool(t.tool_name, e.target.value as ToolCompatibilityEntry['integration_feasibility'])}
                  className="bg-mv-surface border border-mv-border rounded px-2 py-1 cursor-pointer"
                >
                  {FEASIBILITY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            ))}
            {tools.length === 0 && <p className="text-mv-ink-soft text-center py-3">Aucun outil configuré.</p>}
            <div className="flex items-center gap-2 pt-2 border-t border-mv-border">
              <input type="text" placeholder="Nom de l'outil (ex: Lightspeed)" value={newToolName} onChange={(e) => setNewToolName(e.target.value)} className="flex-1 bg-mv-cream-soft border border-mv-border rounded px-2.5 py-1.5" />
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddTool}>Ajouter</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
