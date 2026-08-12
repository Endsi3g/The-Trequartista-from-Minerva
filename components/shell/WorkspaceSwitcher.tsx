'use client';

import React from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { LogoMark } from './Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Single workspace for now (solo usage). The switcher UI is ready to grow into
// multi-workspace / multi-role support (chantier équipe) without a rebuild —
// just populate this list from the real workspaces table when it exists.
const WORKSPACES = [{ id: 'minerva', name: 'Minerva Trequartista' }];

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const current = WORKSPACES[0];

  if (collapsed) {
    return <LogoMark size={26} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 min-w-0 text-left transition-colors hover:bg-mv-cream-soft cursor-pointer">
          <LogoMark size={28} />
          <ChevronDown size={14} className="shrink-0 text-mv-ink-faint ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Espaces de travail</DropdownMenuLabel>
        {WORKSPACES.map((ws) => (
          <DropdownMenuItem key={ws.id} className="flex items-center gap-2.5">
            <LogoMark size={18} />
            <span className="flex-1 text-mv-ink font-semibold">{ws.name}</span>
            <Check size={14} className="text-mv-green" />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="flex items-center gap-2.5 text-mv-ink-faint">
          <Plus size={14} />
          <span>Nouvel espace (bientôt)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
