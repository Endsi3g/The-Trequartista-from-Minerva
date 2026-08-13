'use client';

import React, { useState } from 'react';
import { X, Mail, Phone, Building, DollarSign, Calendar, MessageSquare, Trash2, Save, ArrowRight } from 'lucide-react';
import type { Lead, LeadNote, LeadStage } from '@/lib/types';
import { updateLead, deleteLead } from '@/lib/services/supabase-data';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export function LeadDetailDrawer({ lead, onClose, onLeadUpdated }: LeadDetailDrawerProps) {
  const [newNoteText, setNewNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [stage, setStage] = useState<LeadStage>(lead?.stage || 'nouveau');
  const [mrrValue, setMrrValue] = useState<number>(lead?.mrr_value || 0);
  const [oneTimeValue, setOneTimeValue] = useState<number>(lead?.one_time_value || 0);
  const [notes, setNotes] = useState<LeadNote[]>(lead?.notes || []);

  if (!lead) return null;

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

    await updateLead(lead.id, {
      stage,
      status: statusText,
      mrr_value: mrrValue,
      one_time_value: oneTimeValue,
      probability_pct: probPct,
      notes,
    });

    setIsSaving(false);
    onLeadUpdated();
    onClose();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: LeadNote = {
      id: `note-${Date.now()}`,
      author: 'Équipe Minerva',
      text: newNoteText.trim(),
      created_at: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const handleDeleteLead = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce prospect ?')) return;
    await deleteLead(lead.id);
    onLeadUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-mv-ink/40 backdrop-blur-sm animate-mv-fade-in">
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-mv-surface border-l border-mv-border h-full shadow-mv-lg flex flex-col z-10 animate-mv-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-mv-border flex items-center justify-between bg-mv-cream-soft">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-mv-green bg-mv-green-tint px-2.5 py-1 rounded-full border border-mv-green/30">
              {lead.service_requested || 'Lead CRM'}
            </span>
            <h2 className="text-xl font-extrabold text-mv-ink mt-2 font-display">
              {lead.company_name || lead.client_name || lead.contact_name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-mv-ink-soft hover:text-mv-ink hover:bg-mv-border/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-mv-surface border border-mv-border rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-mv-ink-soft flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-mv-green" /> Email Contact
              </span>
              <p className="text-xs font-semibold text-mv-ink truncate">{lead.contact_email}</p>
            </div>

            <div className="p-3.5 bg-mv-surface border border-mv-border rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-mv-ink-soft flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-mv-green" /> Téléphone
              </span>
              <p className="text-xs font-semibold text-mv-ink">{lead.contact_phone || 'Non renseigné'}</p>
            </div>
          </div>

          {/* Pipeline Stage Select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-mv-ink">Étape du Pipeline Sales</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as LeadStage)}
              className="w-full px-3.5 py-2.5 bg-mv-surface border border-mv-border rounded-xl text-xs font-bold text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all"
            >
              <option value="nouveau">1. Nouveau Lead (10%)</option>
              <option value="qualification">2. Qualification (30%)</option>
              <option value="proposition">3. Proposition Envoyée (60%)</option>
              <option value="negociation">4. Négociation (80%)</option>
              <option value="gagne">5. Gagné / Signé (100% - Auto-Création Client & Projet)</option>
              <option value="perdu">6. Perdu (0%)</option>
            </select>
          </div>

          {/* Financial Values Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-mv-ink">MRR Estimé ($ / mois)</label>
              <div className="relative">
                <input
                  type="number"
                  value={mrrValue}
                  onChange={(e) => setMrrValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2 pl-8 bg-mv-surface border border-mv-border rounded-xl text-xs font-bold text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
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
                  className="w-full px-3.5 py-2 pl-8 bg-mv-surface border border-mv-border rounded-xl text-xs font-bold text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
                />
                <DollarSign className="w-3.5 h-3.5 text-mv-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Contact Notes Section */}
          <div className="space-y-3 pt-4 border-t border-mv-border">
            <h3 className="text-sm font-bold text-mv-ink flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-mv-green" />
              <span>Notes & Suivi des Échanges</span>
            </h3>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Ajouter une note de suivi..."
                className="flex-1 px-3 py-2 bg-mv-surface border border-mv-border rounded-xl text-xs text-mv-ink placeholder-mv-ink-mute focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-mv-green hover:bg-mv-green/90 text-white font-bold text-xs rounded-xl transition-all"
              >
                Ajouter
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
              {notes.length === 0 ? (
                <p className="text-xs text-mv-ink-soft italic">Aucune note enregistrée.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 bg-mv-surface border border-mv-border rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-mv-ink-soft">
                      <span className="font-bold text-mv-ink">{note.author}</span>
                      <span>{new Date(note.created_at).toLocaleDateString('fr-CA')}</span>
                    </div>
                    <p className="text-xs text-mv-ink leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-mv-border flex items-center justify-between bg-mv-cream-soft">
          <button
            type="button"
            onClick={handleDeleteLead}
            className="px-3 py-2 bg-mv-red-bg hover:bg-mv-red/20 text-mv-red font-bold text-xs rounded-xl flex items-center gap-1.5 border border-mv-red/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLead}
            disabled={isSaving}
            className="px-5 py-2.5 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-mv-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
