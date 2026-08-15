'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  overview: 'Vue d’ensemble',
  clients: 'Clients & MRR',
  'roi-tracker': 'Suivi ROI & Leads',
  projects: 'Projets & Livraison',
  roadmap: 'Roadmap Jalons',
  'launch-check': 'Checklist 20-Points',
  'content-planner': 'Social & Reels Planner',
  team: 'Équipe & RH',
  performance: '1-on-1 & OKRs',
  academy: 'Académie LMS & SOPs',
  new: 'Nouveau',
  leads: 'Leads',
  integrations: 'Intégrations',
  notion: 'Notion',
  profil: 'Profil',
  settings: 'Paramètres',
  billing: 'Facturation',
  'audit-logs': 'Journal d’activité',
  tasks: 'Tâches',
  changelog: 'Nouveautés',
  workload: 'Charge de travail',
  invite: 'Inviter',
  join: 'Rejoindre',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-mv-ink-soft">
      <Link
        href="/overview"
        className="flex items-center gap-2 hover:text-mv-green transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Minerva</span>
      </Link>

      {(() => {
        const visibleIndices = segments.map((_, i) => i).filter((i) => !UUID_RE.test(segments[i]));
        const lastVisibleIndex = visibleIndices[visibleIndices.length - 1];

        return visibleIndices.map((index) => {
          const segment = segments[index];
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === lastVisibleIndex;
          const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');

          return (
            <React.Fragment key={href}>
              <ChevronRight className="w-3 h-3 text-mv-ink-mute shrink-0" />
              {isLast ? (
                <span className="font-semibold text-mv-ink capitalize truncate">{label}</span>
              ) : (
                <Link href={href} className="hover:text-mv-green transition-colors capitalize shrink-0">
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        });
      })()}
    </nav>
  );
}
