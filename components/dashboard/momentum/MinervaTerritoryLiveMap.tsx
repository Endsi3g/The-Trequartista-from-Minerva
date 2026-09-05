'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Utensils,
  Target,
  Sparkles,
  ExternalLink,
  Radio,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface TerritoryPoint {
  id: string;
  name: string;
  district: string;
  type: 'restaurant_flow' | 'hot_lead';
  x: number; // percentage coordinates (0-100)
  y: number;
  valueCad: number;
  statusText: string;
  lastEventTime: string;
}

const TERRITORY_POINTS: TerritoryPoint[] = [
  {
    id: 'pt-1',
    name: 'Trattoria Bella Napoli',
    district: 'Petite-Italie, Montréal',
    type: 'restaurant_flow',
    x: 48,
    y: 42,
    valueCad: 1420,
    statusText: '18 commandes QR aujourd’hui • 0% com.',
    lastEventTime: 'Il y a 3 min',
  },
  {
    id: 'pt-2',
    name: 'Bistro Saint-Laurent',
    district: 'Plateau-Mont-Royal',
    type: 'restaurant_flow',
    x: 54,
    y: 50,
    valueCad: 2100,
    statusText: 'Service terrasse actif • 42 commandes',
    lastEventTime: 'Il y a 8 min',
  },
  {
    id: 'pt-3',
    name: 'Le Central Gourmet',
    district: 'Centre-Ville, Montréal',
    type: 'restaurant_flow',
    x: 46,
    y: 58,
    valueCad: 3500,
    statusText: 'Menu QR en ligne • 64 commandes',
    lastEventTime: 'Il y a 14 min',
  },
  {
    id: 'pt-4',
    name: 'Brasserie Mile End',
    district: 'Mile End, Montréal',
    type: 'hot_lead',
    x: 42,
    y: 38,
    valueCad: 1800,
    statusText: 'Proposition commerciale consultée 3x',
    lastEventTime: 'Il y a 22 min',
  },
  {
    id: 'pt-5',
    name: 'Café & Buvette Laurier',
    district: 'Outremont',
    type: 'hot_lead',
    x: 38,
    y: 46,
    valueCad: 1200,
    statusText: 'Rendez-vous qualifié fixé jeudi 10h',
    lastEventTime: 'Il y a 35 min',
  },
  {
    id: 'pt-6',
    name: 'Tacos Verdun',
    district: 'Verdun, Montréal',
    type: 'hot_lead',
    x: 36,
    y: 68,
    valueCad: 950,
    statusText: 'En attente de signature d’acompte 50%',
    lastEventTime: 'Il y a 1h',
  },
  {
    id: 'pt-7',
    name: 'Pizzeria Napoletana',
    district: 'Vieux-Québec',
    type: 'restaurant_flow',
    x: 84,
    y: 28,
    valueCad: 1650,
    statusText: 'Déploiement QR complété avec succès',
    lastEventTime: 'Il y a 1h 10m',
  },
];

export function MinervaTerritoryLiveMap() {
  const [activePointId, setActivePointId] = useState<string>('pt-1');
  const [filterType, setFilterType] = useState<'all' | 'restaurants' | 'leads'>('all');

  const activePoint = TERRITORY_POINTS.find((p) => p.id === activePointId) || TERRITORY_POINTS[0];

  const filteredPoints = TERRITORY_POINTS.filter((p) => {
    if (filterType === 'restaurants') return p.type === 'restaurant_flow';
    if (filterType === 'leads') return p.type === 'hot_lead';
    return true;
  });

  const totalFlowRestos = TERRITORY_POINTS.filter((p) => p.type === 'restaurant_flow').length;
  const totalHotLeads = TERRITORY_POINTS.filter((p) => p.type === 'hot_lead').length;

  return (
    <div className="p-5 rounded-2xl bg-white border border-[#f2f2f2] shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2f2f2]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400" style={MONO}>
              VUE SPATIALE TEMPS RÉEL (SHOPIFY LIVE VIEW PATTERN)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c8c5e] animate-ping" />
          </div>
          <h3 className="text-sm font-semibold text-[#08090a]">Carte Territoriale d&apos;Activité Minerva</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-50 border border-[#f2f2f2] p-0.5 rounded text-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterType('all');
              }}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer',
                filterType === 'all'
                  ? 'bg-white text-[#08090a] shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              Tous ({TERRITORY_POINTS.length})
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterType('restaurants');
              }}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1',
                filterType === 'restaurants'
                  ? 'bg-white text-[#0c8c5e] shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c8c5e]" />
              <span>Flow ({totalFlowRestos})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterType('leads');
              }}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1',
                filterType === 'leads'
                  ? 'bg-white text-[#2563eb] shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
              <span>Leads ({totalHotLeads})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Spatial Map Canvas (Stylized Minimalist Topographic Vector) ── */}
      <div className="relative w-full h-72 sm:h-80 bg-zinc-50/80 rounded-xl border border-[#f2f2f2] overflow-hidden select-none">
        {/* Subtle Water & Landmass Silhouette (Montréal St-Laurent River) */}
        <svg
          viewBox="0 0 1000 600"
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        >
          {/* St. Lawrence River Curve */}
          <path
            d="M -50,450 C 250,420 400,520 600,420 C 800,320 950,380 1050,300 L 1050,650 L -50,650 Z"
            fill="#eff6ff"
            stroke="#2563eb"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          {/* Island of Montreal Contour */}
          <path
            d="M 120,380 C 260,260 480,240 680,330 C 720,360 690,440 540,430 C 380,420 220,450 120,380 Z"
            fill="#ffffff"
            stroke="#e4e4e7"
            strokeWidth="1.5"
          />
          {/* Grid lines */}
          <line x1="0" y1="200" x2="1000" y2="200" stroke="#f4f4f5" strokeDasharray="4 4" />
          <line x1="0" y1="400" x2="1000" y2="400" stroke="#f4f4f5" strokeDasharray="4 4" />
          <line x1="333" y1="0" x2="333" y2="600" stroke="#f4f4f5" strokeDasharray="4 4" />
          <line x1="666" y1="0" x2="666" y2="600" stroke="#f4f4f5" strokeDasharray="4 4" />
        </svg>

        {/* Territory Label Watermarks */}
        <div className="absolute top-4 left-4 text-[10px] font-mono text-zinc-400 pointer-events-none" style={MONO}>
          <div>AXE MONTRÉAL — QUÉBEC</div>
          <div className="text-[9px] text-zinc-300">LAT 45.5017° N • LON 73.5673° W</div>
        </div>

        {/* Live Pulsing Map Points */}
        {filteredPoints.map((point) => {
          const isSelected = point.id === activePoint.id;
          const isFlow = point.type === 'restaurant_flow';

          return (
            <button
              key={point.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActivePointId(point.id);
              }}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer p-2 z-10"
              aria-label={point.name}
            >
              {/* Outer Pulse Wave */}
              <span
                className={cn(
                  'absolute inset-0 rounded-full animate-ping opacity-60',
                  isFlow ? 'bg-[#0c8c5e]' : 'bg-[#2563eb]'
                )}
              />

              {/* Core Solid Pin */}
              <span
                className={cn(
                  'relative flex items-center justify-center w-5 h-5 rounded-full border shadow-sm transition-transform group-hover:scale-125',
                  isSelected && 'ring-2 ring-offset-1 ring-[#08090a] scale-110',
                  isFlow
                    ? 'bg-[#0c8c5e] text-white border-[#09734d]'
                    : 'bg-[#2563eb] text-white border-[#1d4ed8]'
                )}
              >
                {isFlow ? (
                  <Utensils size={10} className="stroke-[2.5]" />
                ) : (
                  <Target size={10} className="stroke-[2.5]" />
                )}
              </span>

              {/* Tooltip Label on Hover/Select */}
              <span
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-medium shadow-xs transition-opacity pointer-events-none z-20',
                  isSelected
                    ? 'bg-[#08090a] text-white opacity-100'
                    : 'bg-white/95 text-zinc-700 border border-[#f2f2f2] opacity-0 group-hover:opacity-100'
                )}
              >
                {point.name}
              </span>
            </button>
          );
        })}

        {/* Selected Point Inspection Float Card (Bottom Right inside Map) */}
        {activePoint && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 bg-white/95 backdrop-blur-md border border-[#f2f2f2] rounded-xl p-3.5 shadow-md text-xs space-y-1.5 z-20 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      activePoint.type === 'restaurant_flow' ? 'bg-[#0c8c5e]' : 'bg-[#2563eb]'
                    )}
                  />
                  <h4 className="font-semibold text-[#08090a]">{activePoint.name}</h4>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                  {activePoint.district}
                </span>
              </div>

              <span className="font-mono font-bold text-xs text-[#08090a]" style={MONO}>
                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(activePoint.valueCad)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              {activePoint.statusText}
            </p>

            <div className="pt-1.5 border-t border-[#f2f2f2] flex items-center justify-between text-[10px] text-zinc-400 font-mono" style={MONO}>
              <span>Activité : {activePoint.lastEventTime}</span>
              <span className="text-[#0c8c5e] font-medium">Temps réel connecté</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Real-Time Activity Ticker (Bottom of Map) ── */}
      <div className="p-2.5 rounded-lg bg-zinc-50 border border-[#f2f2f2] flex items-center justify-between gap-3 text-xs overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Radio size={12} className="text-[#0c8c5e] animate-pulse" />
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-500 font-semibold" style={MONO}>
            DERNIÈRES IMPULSIONS :
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-600 whitespace-nowrap min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c8c5e]" />
            <span>Trattoria Bella Napoli : 3 nouvelles commandes QR directes</span>
          </div>
          <span className="text-zinc-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
            <span>Brasserie Mile End : Devis consulté (1 800 $ CAD)</span>
          </div>
          <span className="text-zinc-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c8c5e]" />
            <span>Pizzeria Napoletana : Terminal actif (Québec)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
