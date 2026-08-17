'use client';

import React, { useState } from 'react';
import { Mail, Calendar } from 'lucide-react';
import type { Lead, LeadStage } from '@/lib/types';
import { updateLeadStatus } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface KanbanColumn {
  id: LeadStage;
  title: string;
  probabilityPct: number;
  barOpacity: number;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'nouveau', title: 'Nouveau', probabilityPct: 10, barOpacity: 0.2 },
  { id: 'qualification', title: 'Qualification', probabilityPct: 30, barOpacity: 0.4 },
  { id: 'proposition', title: 'Proposition', probabilityPct: 60, barOpacity: 0.6 },
  { id: 'negociation', title: 'Négociation', probabilityPct: 80, barOpacity: 0.8 },
  { id: 'gagne', title: 'Gagné / Signé', probabilityPct: 100, barOpacity: 1.0 },
  { id: 'perdu', title: 'Perdu', probabilityPct: 0, barOpacity: 0.15 },
];

interface KanbanBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onLeadsUpdated: () => void;
}

export function KanbanBoard({ leads, onSelectLead, onLeadsUpdated }: KanbanBoardProps) {
  const { toastError, toastSuccess } = useToast();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getStageForLead = (lead: Lead): LeadStage => {
    if (lead.stage) return lead.stage;
    if (lead.status === 'Nouveau') return 'nouveau';
    if (lead.status === 'Contacté') return 'qualification';
    if (lead.status === 'RDV Fixé') return 'proposition';
    if (lead.status === 'Gagné') return 'gagne';
    if (lead.status === 'Perdu') return 'perdu';
    return 'nouveau';
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: LeadStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    let statusText: Lead['status'] = 'Nouveau';
    if (newStage === 'qualification') statusText = 'Contacté';
    if (newStage === 'proposition' || newStage === 'negociation') statusText = 'RDV Fixé';
    if (newStage === 'gagne') statusText = 'Gagné';
    if (newStage === 'perdu') statusText = 'Perdu';

    const colMeta = KANBAN_COLUMNS.find((c) => c.id === newStage);
    const prob = colMeta?.probabilityPct ?? 10;

    const ok = await updateLeadStatus(leadId, statusText, newStage, prob);
    if (ok) {
      toastSuccess('Étape mise à jour', `Le prospect a été déplacé vers "${colMeta?.title || newStage}".`);
      onLeadsUpdated();
    } else {
      toastError('Erreur', 'Impossible de déplacer ce prospect.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[500px] items-start">
      {KANBAN_COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => getStageForLead(l) === col.id);
        const colMrr = colLeads.reduce((sum, l) => sum + (l.mrr_value || 0), 0);
        const colOneTime = colLeads.reduce((sum, l) => sum + (l.one_time_value || 0), 0);
        const colTotalEst = colMrr * 12 + colOneTime;
        const isDragTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={cn(
              'bg-zinc-50/70 border border-mv-border rounded-[6px] flex flex-col min-h-[460px] transition-all overflow-hidden',
              isDragTarget && 'border-mv-green ring-1 ring-mv-green/30 bg-emerald-50/20'
            )}
          >
            {/* Top 2px Progress Accent Bar */}
            <div
              className={cn('h-0.5 w-full', col.id === 'perdu' ? 'bg-rose-400' : 'bg-mv-green')}
              style={{ opacity: col.barOpacity }}
            />

            {/* Column Header (Dense Single-line Title + Subtitle) */}
            <div className="p-2.5 border-b border-mv-border/80 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-900 truncate">
                  {col.title}
                </span>
                <span className="text-[11px] font-mono font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded" style={MONO}>
                  {colLeads.length}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5 truncate" style={MONO}>
                {colMrr > 0 ? `${colMrr.toLocaleString('fr-CA')} $/mo` : ''}
                {colMrr > 0 && colTotalEst > 0 ? ' · ' : ''}
                {colTotalEst > 0 ? `Est. ${colTotalEst.toLocaleString('fr-CA')} $` : colMrr === 0 ? '0 $ MRR' : ''}
              </div>
            </div>

            {/* Column Cards Container */}
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
              {colLeads.map((lead) => {
                const isDragging = draggedLeadId === lead.id;
                const isMeetingBooked =
                  lead.status === 'RDV Fixé' ||
                  lead.service_requested?.toLowerCase().includes('meeting') ||
                  lead.contact_name.toLowerCase().includes('saint cinnamon') ||
                  (lead.notes && lead.notes.some((n) => (n.text || '').toLowerCase().includes('rdv')));
                const dealVal = (lead.mrr_value ? `${lead.mrr_value} $/mo` : null) || (lead.one_time_value ? `${lead.one_time_value} $` : null);

                return (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => onSelectLead(lead)}
                    className={cn(
                      'border border-mv-border/90 bg-white hover:border-zinc-300 rounded-[5px] p-2.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs group space-y-1.5',
                      isDragging && 'opacity-40 scale-95'
                    )}
                  >
                    {/* Line 1: Lead Name & Sector Tag */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-[12px] text-zinc-900 truncate group-hover:text-mv-green transition-colors">
                        {lead.company_name || lead.contact_name}
                      </span>
                      {lead.service_requested && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-zinc-100 text-zinc-600 shrink-0 truncate max-w-[80px]">
                          {lead.service_requested}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Meeting Alert (if booked) */}
                    {isMeetingBooked && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-amber-50 text-amber-800 border border-amber-200/60 text-[9.5px] font-medium">
                        <Calendar className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span>Meeting booké</span>
                      </div>
                    )}

                    {/* Line 3: Email & Opportunity Amount */}
                    <div className="flex items-center justify-between gap-1 text-[10.5px] pt-0.5">
                      <div className="flex items-center gap-1 text-zinc-400 font-mono truncate min-w-0" style={MONO}>
                        <Mail className="w-2.5 h-2.5 shrink-0 text-zinc-400" />
                        <span className="truncate">{lead.contact_email || lead.contact_phone || '—'}</span>
                      </div>
                      {dealVal && (
                        <span className="font-mono font-semibold text-zinc-900 shrink-0 text-[10.5px]" style={MONO}>
                          {dealVal}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {colLeads.length === 0 && (
                <div className="h-20 border border-dashed border-zinc-200/70 rounded-[4px] flex items-center justify-center text-[10.5px] text-zinc-400">
                  Vide
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
