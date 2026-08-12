'use client';

import React, { useState } from 'react';
import { Plus, Mail, DollarSign, ArrowRight, User } from 'lucide-react';
import type { Lead, LeadStage } from '@/lib/types';
import { updateLeadStatus } from '@/lib/services/supabase-data';

interface KanbanColumn {
  id: LeadStage;
  title: string;
  probabilityPct: number;
  badgeBg: string;
  badgeText: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'nouveau', title: '1. Nouveau Lead', probabilityPct: 10, badgeBg: 'bg-gray-100 border-gray-200', badgeText: 'text-gray-700' },
  { id: 'qualification', title: '2. Qualification', probabilityPct: 30, badgeBg: 'bg-blue-50 border-blue-200', badgeText: 'text-blue-700' },
  { id: 'proposition', title: '3. Proposition Envoyée', probabilityPct: 60, badgeBg: 'bg-purple-50 border-purple-200', badgeText: 'text-purple-700' },
  { id: 'negociation', title: '4. Négociation', probabilityPct: 80, badgeBg: 'bg-amber-50 border-amber-200', badgeText: 'text-amber-700' },
  { id: 'gagne', title: '5. Gagné / Signé', probabilityPct: 100, badgeBg: 'bg-emerald-50 border-emerald-200', badgeText: 'text-emerald-700' },
  { id: 'perdu', title: '6. Perdu', probabilityPct: 0, badgeBg: 'bg-red-50 border-red-200', badgeText: 'text-red-700' },
];

interface KanbanBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onLeadsUpdated: () => void;
}

export function KanbanBoard({ leads, onSelectLead, onLeadsUpdated }: KanbanBoardProps) {
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

    await updateLeadStatus(leadId, statusText, newStage);
    setDraggedLeadId(null);
    onLeadsUpdated();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
      {KANBAN_COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => getStageForLead(l) === col.id);
        const totalMrr = columnLeads.reduce((acc, l) => acc + (l.mrr_value || 0), 0);
        const totalOneTime = columnLeads.reduce((acc, l) => acc + (l.one_time_value || 0), 0);
        const weightedForecast = (totalMrr * 12 + totalOneTime) * (col.probabilityPct / 100);

        const isOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col bg-mv-surface/60 border rounded-2xl p-3 min-h-[500px] transition-all ${
              isOver ? 'border-[#00a800] ring-2 ring-[#00a800]/20 bg-mv-green-tint/40' : 'border-mv-border'
            }`}
          >
            {/* Column Header */}
            <div className="mb-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${col.badgeBg} ${col.badgeText}`}>
                  {col.title}
                </span>
                <span className="text-xs font-extrabold text-mv-ink-soft bg-white border border-mv-border px-2 py-0.5 rounded-full">
                  {columnLeads.length}
                </span>
              </div>

              {/* Column Financial Summary */}
              <div className="pt-1 flex items-center justify-between text-[10px] text-mv-ink-soft font-semibold">
                <span>MRR: ${totalMrr.toLocaleString()}/mo</span>
                <span>Est: ${Math.round(weightedForecast).toLocaleString()}</span>
              </div>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onClick={() => onSelectLead(lead)}
                  className="bg-white border border-mv-border rounded-xl p-3.5 shadow-mv-sm hover:shadow-mv-md hover:border-mv-green transition-all cursor-grab active:cursor-grabbing space-y-2 group relative"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-mv-ink group-hover:text-mv-green transition-colors line-clamp-1">
                      {lead.company_name || lead.client_name || lead.contact_name}
                    </h4>
                    <span className="text-[10px] font-bold text-mv-ink-faint bg-mv-surface px-1.5 py-0.5 rounded">
                      {lead.score_grade || 'A'}
                    </span>
                  </div>

                  <p className="text-[11px] text-mv-ink-soft flex items-center gap-1">
                    <Mail className="w-3 h-3 text-mv-green shrink-0" />
                    <span className="truncate">{lead.contact_email}</span>
                  </p>

                  {/* Financial Badges */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {(lead.mrr_value || 0) > 0 && (
                      <span className="text-[10px] font-bold text-mv-green bg-mv-green-tint border border-mv-green/20 px-2 py-0.5 rounded-md">
                        ${lead.mrr_value}/mo
                      </span>
                    )}
                    {(lead.one_time_value || 0) > 0 && (
                      <span className="text-[10px] font-bold text-mv-ink bg-mv-surface border border-mv-border px-2 py-0.5 rounded-md">
                        ${lead.one_time_value} setup
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
