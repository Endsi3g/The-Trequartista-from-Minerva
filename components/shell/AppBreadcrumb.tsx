'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  overview: 'Command Center',
  clients: 'Clients & MRR',
  'roi-tracker': 'Suivi ROI & Leads',
  projects: 'Projets & Livraison',
  roadmap: 'Roadmap Jalons',
  'launch-check': 'Checklist 20-Points',
  'content-planner': 'Social & Reels Planner',
  team: 'Équipe & RH',
  performance: '1-on-1 & OKRs',
  academy: 'Académie LMS & SOPs',
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-mv-ink-soft mb-4">
      <Link
        href="/overview"
        className="flex items-center gap-1 hover:text-mv-green transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Centurions</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3 h-3 text-mv-ink-mute shrink-0" />
            {isLast ? (
              <span className="font-semibold text-mv-ink capitalize">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-mv-green transition-colors capitalize"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
