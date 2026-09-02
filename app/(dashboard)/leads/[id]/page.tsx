'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, DollarSign, TrendingUp, MessageSquare, Trash2, Save, PhoneCall, StickyNote, Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchLead, updateLead, deleteLead } from '@/lib/services/supabase-data';
import type { Lead, LeadNote, LeadStage } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const STAGE_META: Record<LeadStage, { label: string; pct: number; badge: 'neutral' | 'blue' | 'amber' | 'purple' | 'green' | 'red' }> = {
  nouveau: { label: 'Nouveau', pct: 10, badge: 'neutral' },
  qualification: { label: 'Qualification', pct: 30, badge: 'blue' },
  proposition: { label: 'Proposition envoyée', pct: 60, badge: 'amber' },
  negociation: { label: 'Négociation', pct: 80, badge: 'purple' },
  gagne: { label: 'Gagné / Signé', pct: 100, badge: 'green' },
  perdu: { label: 'Perdu', pct: 0, badge: 'red' },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toastError, toastSuccess } = useToast();
  const confirmDialog = useConfirm();
  const { can } = useAppPermissions();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stage, setStage] = useState<LeadStage>('nouveau');
  const [mrrValue, setMrrValue] = useState<number>(0);
  const [oneTimeValue, setOneTimeValue] = useState<number>(0);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [entryType, setEntryType] = useState<'note' | 'call'>('note');
  const [callDuration, setCallDuration] = useState<number>(5);
  const [callOutcome, setCallOutcome] = useState('Répondu');

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      const data = await fetchLead(rawId);
      setLead(data);
      if (data) {
        setStage(data.stage || 'nouveau');
        setMrrValue(data.mrr_value || 0);
        setOneTimeValue(data.one_time_value || 0);
        setNotes(data.notes || []);
      }
      setLoading(false);
    })();
  }, [rawId]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-6">
        <div className="h-14 bg-mv-surface border border-mv-border rounded-[6px] animate-pulse" />
        <div className="h-16 bg-mv-surface border border-mv-border rounded-[6px] animate-pulse" />
        <div className="h-48 bg-mv-surface border border-mv-border rounded-[6px] animate-pulse" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Link href="/leads" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux leads
        </Link>
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-8 text-center space-y-1">
          <p className="text-sm font-semibold text-mv-ink">Ce prospect est introuvable.</p>
        </div>
      </div>
    );
  }

  const stageMeta = STAGE_META[stage];
  const pipelineValue = mrrValue * 3.5 + oneTimeValue;

  const handleSaveLead = async () => {
    setIsSaving(true);
    let statusText: Lead['status'] = 'Nouveau';
    if (stage === 'qualification') statusText = 'Contacté';
    if (stage === 'proposition' || stage === 'negociation') statusText = 'RDV Fixé';
    if (stage === 'gagne') statusText = 'Gagné';
    if (stage === 'perdu') statusText = 'Perdu';

    const success = await updateLead(lead.id, {
      stage,
      status: statusText,
      mrr_value: mrrValue,
      one_time_value: oneTimeValue,
      probability_pct: stageMeta.pct,
      notes,
    });

    setIsSaving(false);

    if (!success) {
      toastError('Erreur de sauvegarde', "Impossible d'enregistrer les changements sur ce lead.");
      return;
    }

    toastSuccess('Lead mis à jour');
    router.push('/leads');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryType === 'note' && !newNoteText.trim()) return;

    const text =
      entryType === 'call'
        ? `Appel (${callDuration} min) — ${callOutcome}${newNoteText.trim() ? ` : ${newNoteText.trim()}` : ''}`
        : newNoteText.trim();

    const newNote: LeadNote = {
      id: `note-${Date.now()}`,
      author: 'Équipe Minerva',
      text,
      created_at: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const handleDeleteLead = async () => {
    const ok = await confirmDialog({
      title: 'Supprimer ce prospect ?',
      message: 'Cette action est définitive et supprimera toutes les notes associées.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    setIsDeleting(true);
    const success = await deleteLead(lead.id);
    setIsDeleting(false);

    if (!success) {
      toastError('Erreur de suppression', "Impossible de supprimer ce prospect.");
      return;
    }

    router.push('/leads');
  };

  const displayName = lead.company_name || lead.client_name || lead.contact_name || 'Lead';

  return (
    <PageFadeIn className="space-y-4 max-w-5xl mx-auto pb-12">
      <Link href="/leads" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux leads
      </Link>

      {/* ── 1. Compact Header Banner ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-mv-cream-soft border border-mv-border flex items-center justify-center text-[11px] font-semibold text-mv-ink shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">{displayName}</h1>
            <Badge variant={stageMeta.badge}>{stageMeta.label}</Badge>
            {lead.service_requested && (
              <span className="text-[11px] text-mv-ink-faint font-mono" style={MONO}>
                {lead.service_requested}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {can('delete_lead') ? (
            <button
              type="button"
              onClick={handleDeleteLead}
              disabled={isDeleting}
              title="Supprimer ce prospect"
              className="h-7 px-2.5 rounded-[4px] bg-white border border-mv-red/30 text-[11.5px] font-medium text-mv-red hover:bg-mv-red/10 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Suppression…' : 'Supprimer'}</span>
            </button>
          ) : (
            <span
              title="Réservé aux administrateurs (ou aux membres autorisés dans Paramètres > Permissions)"
              className="h-7 px-2.5 rounded-[4px] bg-mv-cream-soft text-mv-ink-faint text-[11.5px] font-medium flex items-center gap-1.5 border border-mv-border cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveLead}
            disabled={isSaving}
            className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-mv-green-dark text-white text-[11.5px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Enregistrement…' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Ribbon ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mv-border">
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">MRR estimé</span>
              <DollarSign className="w-3.5 h-3.5 text-mv-ink-faint" />
            </div>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              <AnimatedNumber value={mrrValue} format={(n) => `${Math.round(n).toLocaleString('fr-CA')} $`} />
            </div>
          </div>
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Frais uniques</span>
              <DollarSign className="w-3.5 h-3.5 text-mv-ink-faint" />
            </div>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              <AnimatedNumber value={oneTimeValue} format={(n) => `${Math.round(n).toLocaleString('fr-CA')} $`} />
            </div>
          </div>
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Probabilité</span>
              <Target className="w-3.5 h-3.5 text-mv-ink-faint" />
            </div>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              {stageMeta.pct}%
            </div>
          </div>
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Valeur pipeline</span>
              <TrendingUp className="w-3.5 h-3.5 text-mv-ink-faint" />
            </div>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              {Math.round(pipelineValue).toLocaleString('fr-CA')} $
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Contact & Pipeline ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-mv-border">
          <div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-mv-border bg-black/[0.01]">
              <Mail className="w-3.5 h-3.5 text-mv-ink-faint" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Coordonnées</span>
            </div>
            <table className="w-full text-[12.5px] border-collapse">
              <tbody>
                <tr className="h-9 border-b border-mv-border/60">
                  <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-mv-ink-faint" /> Courriel
                  </td>
                  <td className="pr-3.5 pl-2 py-1 text-right font-medium text-mv-ink truncate max-w-[180px]">
                    {lead.contact_email || 'Non renseigné'}
                  </td>
                </tr>
                <tr className="h-9">
                  <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-mv-ink-faint" /> Téléphone
                  </td>
                  <td className="pr-3.5 pl-2 py-1 text-right font-medium text-mv-ink" style={MONO}>
                    {lead.contact_phone || 'Non renseigné'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-mv-ink-faint" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Étape du pipeline</span>
            </div>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as LeadStage)}
              className="w-full h-9 px-3 bg-mv-cream-soft border border-mv-border rounded-[4px] text-xs font-medium text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
            >
              <option value="nouveau">1. Nouveau lead (10%)</option>
              <option value="qualification">2. Qualification (30%)</option>
              <option value="proposition">3. Proposition envoyée (60%)</option>
              <option value="negociation">4. Négociation (80%)</option>
              <option value="gagne">5. Gagné / Signé (100% — création client &amp; projet)</option>
              <option value="perdu">6. Perdu (0%)</option>
            </select>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-mv-ink-soft">MRR ($/mois)</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-mv-ink-faint absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={mrrValue}
                    onChange={(e) => setMrrValue(Number(e.target.value))}
                    className="w-full h-8 pl-7 pr-2 bg-mv-cream-soft border border-mv-border rounded-[4px] text-xs font-medium text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-mv-ink-soft">Setup ($)</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-mv-ink-faint absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={oneTimeValue}
                    onChange={(e) => setOneTimeValue(Number(e.target.value))}
                    className="w-full h-8 pl-7 pr-2 bg-mv-cream-soft border border-mv-border rounded-[4px] text-xs font-medium text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Notes & Suivi des Échanges ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] shadow-2xs">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-mv-border bg-black/[0.01]">
          <MessageSquare className="w-3.5 h-3.5 text-mv-ink-faint" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Notes &amp; suivi des échanges</span>
          <span className="text-[10.5px] text-mv-ink-faint font-mono ml-auto" style={MONO}>
            {notes.length} entrée{notes.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 p-1 rounded-[4px] bg-mv-cream-soft border border-mv-border w-fit">
            <button
              type="button"
              onClick={() => setEntryType('note')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold transition-all cursor-pointer ${
                entryType === 'note' ? 'bg-white text-mv-ink shadow-2xs' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" /> Note
            </button>
            <button
              type="button"
              onClick={() => setEntryType('call')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold transition-all cursor-pointer ${
                entryType === 'call' ? 'bg-white text-mv-ink shadow-2xs' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" /> Appel
            </button>
          </div>

          <form onSubmit={handleAddNote} className="space-y-2">
            {entryType === 'call' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-mv-ink-soft mb-1">Durée (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={callDuration}
                    onChange={(e) => setCallDuration(Number(e.target.value))}
                    className="w-full h-8 px-2.5 bg-mv-cream-soft border border-mv-border rounded-[4px] text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-mv-ink-soft mb-1">Résultat</label>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="w-full h-8 px-2.5 bg-mv-cream-soft border border-mv-border rounded-[4px] text-xs text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
                  >
                    <option>Répondu</option>
                    <option>Pas de réponse</option>
                    <option>Rappeler plus tard</option>
                    <option>Numéro incorrect</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={entryType === 'call' ? "Détails de l'appel (optionnel)…" : 'Ajouter une note de suivi…'}
                className="flex-1 h-9 px-3 bg-mv-cream-soft border border-mv-border rounded-[4px] text-xs text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green"
              />
              <button
                type="submit"
                className="h-9 px-3 bg-mv-green hover:bg-mv-green-dark text-white font-semibold text-xs rounded-[4px] transition-all cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </form>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-xs text-mv-ink-faint italic py-4 text-center">Aucune note enregistrée.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="p-2.5 bg-mv-cream-soft border border-mv-border rounded-[4px] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-mv-ink-faint">
                    <span className="font-semibold text-mv-ink-soft">{note.author}</span>
                    <span style={MONO}>{new Date(note.created_at).toLocaleDateString('fr-CA')}</span>
                  </div>
                  <p className="text-xs text-mv-ink leading-relaxed">{note.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
