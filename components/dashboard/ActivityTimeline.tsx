'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { CopyButton } from '@/components/ui/copy-button';
import { EmptyState } from '@/components/ui/empty-state';

export interface ActivityEvent {
  id: string;
  category: 'ventes' | 'clients' | 'tech' | 'alertes';
  title: string;
  description: string;
  actor: {
    name: string;
    role: string;
    initials: string;
  };
  timestamp: string; // e.g., 'il y a 4 min', 'il y a 2h', 'hier 16:30'
  amount?: string;
  href?: string;
  statusChip?: {
    label: string;
    type: 'success' | 'info' | 'warning' | 'purple';
  };
}

const DEFAULT_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    category: 'ventes',
    title: 'Proposition Signée • Sushi Momentum',
    description: 'Acompte Stripe 50% encaissé avec succès. Déploiement QR code Flow enclenché.',
    actor: {
      name: 'Kael Belceus',
      role: 'Growth Lead',
      initials: 'KB',
    },
    timestamp: 'il y a 6 min',
    amount: '+2 400 $',
    href: '/proposals',
    statusChip: {
      label: 'Signé · Acompte 50%',
      type: 'success',
    },
  },
  {
    id: 'act-2',
    category: 'ventes',
    title: 'Qualification ACER Complétée • Bistro Laurier',
    description: 'Objection budget résolue en 1 touche. Démo sur site planifiée jeudi à 11h00.',
    actor: {
      name: 'Sarah Morin',
      role: 'SDR Outbound',
      initials: 'SM',
    },
    timestamp: 'il y a 28 min',
    href: '/leads',
    statusChip: {
      label: 'RDV Décroché',
      type: 'success',
    },
  },
  {
    id: 'act-3',
    category: 'clients',
    title: 'Jalon Livrable Validé • Pizzeria Napoli',
    description: 'Roadmap QR Code & Menu interactif passés à 100% de complétion avec le restaurateur.',
    actor: {
      name: 'Marc-Antoine Tremblay',
      role: 'Account Executive',
      initials: 'MT',
    },
    timestamp: 'il y a 1h 15m',
    href: '/clients',
    statusChip: {
      label: 'Livraison 100%',
      type: 'info',
    },
  },
  {
    id: 'act-4',
    category: 'tech',
    title: 'Audit QA 20-points Exécuté avec Succès',
    description: 'Vérification de connectivité Supabase RLS et Edge Functions sans aucune régression.',
    actor: {
      name: 'Minerva Trequartista',
      role: 'Tech Lead AI',
      initials: 'MT',
    },
    timestamp: 'il y a 2h 40m',
    href: '/tech',
    statusChip: {
      label: 'QA 20/20 Pass',
      type: 'purple',
    },
  },
  {
    id: 'act-5',
    category: 'alertes',
    title: 'Alerte Inactivité Suivi CRM (48h)',
    description: 'Lead Le Petit Marché sans touche depuis 2 jours. Rappel vocal automatisé suggéré.',
    actor: {
      name: 'Copilote Vocal',
      role: 'Agent IA',
      initials: 'IA',
    },
    timestamp: 'hier à 17:10',
    href: '/leads',
    statusChip: {
      label: 'Priorité Haute',
      type: 'warning',
    },
  },
];

interface ActivityTimelineProps {
  events?: ActivityEvent[];
  className?: string;
  limit?: number;
}

export function ActivityTimeline({
  events = DEFAULT_ACTIVITIES,
  className = '',
  limit = 5,
}: ActivityTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'ventes' | 'clients' | 'tech'>('all');

  const filteredEvents = events
    .filter((e) => filter === 'all' || e.category === filter)
    .slice(0, limit);

  const getCategoryNode = (category: ActivityEvent['category']) => {
    switch (category) {
      case 'ventes':
        return (
          <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 text-[#0c8c5e] flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        );
      case 'clients':
        return (
          <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
        );
      case 'tech':
        return (
          <div className="w-7 h-7 rounded bg-purple-50 border border-purple-200 text-[#7c3aed] flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        );
      case 'alertes':
      default:
        return (
          <div className="w-7 h-7 rounded bg-amber-50 border border-amber-200 text-[#d97706] flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const getStatusChipStyle = (type: NonNullable<ActivityEvent['statusChip']>['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-[#0c8c5e] border-emerald-200';
      case 'info':
        return 'bg-blue-50 text-[#2563eb] border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-[#7c3aed] border-purple-200';
      case 'warning':
      default:
        return 'bg-amber-50 text-[#d97706] border-amber-200';
    }
  };

  return (
    <div className={`bg-white border border-[#f2f2f2] rounded-2xl p-4 shadow-2xs ${className}`}>
      {/* Header with Title and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-[#f2f2f2]">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Flux d&apos;activité séquentiel
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[#08090a] tracking-tight mt-0.5">
            Journal des Événements Récents
          </h3>
        </div>

        {/* Category Filters (Square 4px buttons) */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#08090a] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setFilter('ventes')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              filter === 'ventes'
                ? 'bg-[#08090a] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            Ventes
          </button>
          <button
            type="button"
            onClick={() => setFilter('clients')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              filter === 'clients'
                ? 'bg-[#08090a] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setFilter('tech')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              filter === 'tech'
                ? 'bg-[#08090a] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            Tech
          </button>
        </div>
      </div>

      {/* Vertical Timeline Body */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          title="Aucun événement récent"
          description="Aucune activité détectée pour ce filtre actuellement."
          actionLabel="Réinitialiser le filtre"
          onAction={() => setFilter('all')}
          className="my-4 p-6"
        />
      ) : (
        <div className="relative pl-3 pt-4 space-y-4">
          {/* Continuous vertical connector line */}
          <div className="absolute left-6.5 top-5 bottom-4 w-px bg-zinc-200" />

          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="relative flex items-start gap-3.5 group rounded p-1.5 -ml-1.5 hover:bg-zinc-50/70 transition-colors"
            >
              {/* Node Icon on top of line */}
              <div className="relative z-10 shrink-0">
                {getCategoryNode(evt.category)}
              </div>

              {/* Event Content Box */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12.5px] font-semibold text-[#08090a] truncate">
                      {evt.title}
                    </span>
                    {evt.statusChip && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${getStatusChipStyle(
                          evt.statusChip.type
                        )}`}
                      >
                        {evt.statusChip.label}
                      </span>
                    )}
                  </div>

                  {/* Timestamp & Amount Right-aligned */}
                  <div className="flex items-center gap-2 text-[11px] shrink-0 font-mono tabular-nums">
                    {evt.amount && (
                      <span className="font-semibold text-[#0c8c5e]">
                        {evt.amount}
                      </span>
                    )}
                    <span className="text-zinc-400">
                      {evt.timestamp}
                    </span>
                  </div>
                </div>

                <p className="text-[12px] text-zinc-500 leading-snug mt-0.5 line-clamp-2">
                  {evt.description}
                </p>

                {/* Actor Badge & Hover Actions (Low Explicitness) */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    {/* Soft Square 4px Actor Avatar */}
                    <div className="w-4.5 h-4.5 rounded bg-zinc-200 text-zinc-700 text-[9px] font-bold font-mono flex items-center justify-center shrink-0">
                      {evt.actor.initials}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-700">
                      {evt.actor.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      · {evt.actor.role}
                    </span>
                  </div>

                  {/* Contextual actions revealed on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton
                      text={`${evt.title} — ${evt.description}`}
                      tooltipText="Copier la note"
                    />
                    {evt.href && (
                      <Tooltip content="Ouvrir le module">
                        <Link
                          href={evt.href}
                          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#08090a] hover:text-[#0c8c5e] px-1.5 py-0.5 rounded hover:bg-zinc-100 transition-colors"
                        >
                          <span>Voir</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
