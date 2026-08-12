'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Target, Users, FolderKanban } from 'lucide-react';
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
        <button className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold transition-all cursor-pointer shadow-mv-sm">
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden sm:inline">Nouveau</span>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
