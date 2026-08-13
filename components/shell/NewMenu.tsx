'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Target, Users, FolderKanban, CheckSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NewMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Nouveau"
          title="Nouveau"
          className="p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-green hover:border-mv-green/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href="/leads/new" className="flex items-center gap-2.5">
            <Target size={15} className="text-mv-green shrink-0" />
            <span>Nouveau lead</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/clients/new" className="flex items-center gap-2.5">
            <Users size={15} className="text-mv-green shrink-0" />
            <span>Nouveau client</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/projects" className="flex items-center gap-2.5">
            <FolderKanban size={15} className="text-mv-green shrink-0" />
            <span>Voir les projets</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/tasks/new" className="flex items-center gap-2.5">
            <CheckSquare size={15} className="text-mv-green shrink-0" />
            <span>Nouvelle tâche</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
