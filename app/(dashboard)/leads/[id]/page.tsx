'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, DollarSign, MessageSquare, Trash2, Save, PhoneCall, StickyNote,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchLead, updateLead, deleteLead } from '@/lib/services/supabase-data';
import type { Lead, LeadNote, LeadStage } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';

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
    return <div className="py-16 text-center text-sm text-mv-ink-soft">Chargement…</div>;
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Link href="/leads" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux leads
        </Link>
        <Card className="py-16 text-center">
          <p className="text-sm text-mv-ink-soft">Ce prospect est introuvable.</p>
        </Card>
      </div>
    );
  }

  const handleSaveLead = async () => {
    setIsSaving(true);
    let statusText: Lead['status'] = 'Nouveau';
    if (stage === 'qualification') statusText = 'Contacté';
    if (stage === 'proposition' || stage === 'negociation') statusText = 'RDV Fixé';
    if (stage === 'gagne') statusText = 'Gagné';
    if (stage === 'perdu') statusText = 'Perdu';

    let probPct = 10;
    if (stage === 'qualification') probPct = 30;
    if (stage === 'proposition') probPct = 60;
    if (stage === 'negociation') probPct = 80;
    if (stage === 'gagne') probPct = 100;
    if (stage === 'perdu') probPct = 0;

    const success = await updateLead(lead.id, {
      stage,
      status: statusText,
      mrr_value: mrrValue,
      one_time_value: oneTimeValue,
      probability_pct: probPct,
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
        ? `📞 Appel (${callDuration} min) — ${callOutcome}${newNoteText.trim() ? ` : ${newNoteText.trim()}` : ''}`
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link href="/leads" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux leads
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="green">{lead.service_requested || 'Lead CRM'}</Badge>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display mt-2">
            {lead.company_name || lead.client_name || lead.contact_name}
          </h1>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="space-y-1">
          <span className="text-[11px] font-bold text-mv-ink-soft flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-mv-green" /> Email Contact
          </span>
          <p className="text-sm font-semibold text-mv-ink truncate">{lead.contact_email}</p>
        </Card>
        <Card className="space-y-1">
          <span className="text-[11px] font-bold text-mv-ink-soft flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-mv-green" /> Téléphone
          </span>
          <p className="text-sm font-semibold text-mv-ink">{lead.contact_phone || 'Non renseigné'}</p>
        </Card>
      </div>

      {/* Pipeline + Financials */}
      <Card className="space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-mv-ink">Étape du Pipeline Sales</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as LeadStage)}
            className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-xs font-bold text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all"
          >
            <option value="nouveau">1. Nouveau Lead (10%)</option>
            <option value="qualification">2. Qualification (30%)</option>
            <option value="proposition">3. Proposition Envoyée (60%)</option>
            <option value="negociation">4. Négociation (80%)</option>
            <option value="gagne">5. Gagné / Signé (100% - Auto-Création Client &amp; Projet)</option>
            <option value="perdu">6. Perdu (0%)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">MRR Estimé ($ / mois)</label>
            <div className="relative">
              <input
                type="number"
                value={mrrValue}
                onChange={(e) => setMrrValue(Number(e.target.value))}
                className="w-full px-3.5 py-2 pl-8 bg-mv-cream-soft border border-mv-border rounded-xl text-xs font-bold text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
              />
              <DollarSign className="w-3.5 h-3.5 text-mv-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Frais Uniques ($ Setup)</label>
            <div className="relative">
              <input
                type="number"
                value={oneTimeValue}
                onChange={(e) => setOneTimeValue(Number(e.target.value))}
                className="w-full px-3.5 py-2 pl-8 bg-mv-cream-soft border border-mv-border rounded-xl text-xs font-bold text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
              />
              <DollarSign className="w-3.5 h-3.5 text-mv-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Notes & Calls */}
      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-mv-ink flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-mv-green" />
          <span>Notes &amp; Suivi des Échanges</span>
        </h2>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-mv-cream-soft border border-mv-border w-fit">
          <button
            type="button"
            onClick={() => setEntryType('note')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              entryType === 'note' ? 'bg-mv-surface text-mv-ink shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" /> Note
          </button>
          <button
            type="button"
            onClick={() => setEntryType('call')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              entryType === 'call' ? 'bg-mv-surface text-mv-ink shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" /> Appel
          </button>
        </div>

        <form onSubmit={handleAddNote} className="space-y-2">
          {entryType === 'call' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-mv-ink-soft mb-1">Durée (min)</label>
                <input
                  type="number"
                  min={1}
                  value={callDuration}
                  onChange={(e) => setCallDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-mv-ink-soft mb-1">Résultat</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green cursor-pointer"
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
              placeholder={entryType === 'call' ? "Détails de l'appel (optionnel)…" : 'Ajouter une note de suivi...'}
              className="flex-1 px-3 py-2 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink placeholder-mv-ink-mute focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-mv-green hover:bg-mv-green/90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Ajouter
            </button>
          </div>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
          {notes.length === 0 ? (
            <p className="text-xs text-mv-ink-soft italic">Aucune note enregistrée.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-3 bg-mv-cream-soft border border-mv-border rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px] text-mv-ink-soft">
                  <span className="font-bold text-mv-ink">{note.author}</span>
                  <span>{new Date(note.created_at).toLocaleDateString('fr-CA')}</span>
                </div>
                <p className="text-xs text-mv-ink leading-relaxed">{note.text}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {can('delete_lead') ? (
          <button
            type="button"
            onClick={handleDeleteLead}
            disabled={isDeleting}
            className="px-3 py-2 bg-mv-red-bg hover:bg-mv-red/20 text-mv-red font-bold text-xs rounded-xl flex items-center gap-1.5 border border-mv-red/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Suppression…' : 'Supprimer'}</span>
          </button>
        ) : (
          <span
            title="Réservé aux administrateurs (ou aux membres autorisés dans Paramètres > Permissions)"
            className="px-3 py-2 bg-mv-cream-soft text-mv-ink-faint font-bold text-xs rounded-xl flex items-center gap-1.5 border border-mv-border cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </span>
        )}

        <button
          type="button"
          onClick={handleSaveLead}
          disabled={isSaving}
          className="px-5 py-2.5 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-mv-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder'}</span>
        </button>
      </div>
    </div>
  );
}
