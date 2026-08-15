'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, Plus, User, LogOut } from 'lucide-react';
import { LogoMark } from './Logo';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  member: 'Membre',
};

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const { role } = useCurrentUser();
  const router = useRouter();
  // The workspace shown here IS the current user's role — once chantier
  // équipe lands, each role (admin, prospecteur, etc.) becomes its own
  // workspace with its own nav. For now there's just the one, named after
  // whatever role the signed-in profile actually has.
  const workspaceName = ROLE_LABELS[role] || role || 'Espace de travail';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (collapsed) {
    return <LogoMark size={26} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 min-w-0 text-left transition-colors hover:bg-mv-cream-soft cursor-pointer">
          <LogoMark size={28} className="shrink-0" />
          <span className="flex-1 min-w-0 truncate text-[13px] font-bold text-mv-ink">{workspaceName}</span>
          <ChevronDown size={14} className="shrink-0 text-mv-ink-faint" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Espace de travail</DropdownMenuLabel>
        <DropdownMenuItem className="flex items-center gap-2.5">
          <LogoMark size={18} />
          <span className="flex-1 text-mv-ink font-semibold">{workspaceName}</span>
          <Check size={14} className="text-mv-green" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profil" className="flex items-center gap-2.5">
            <User size={14} />
            <span>Mon profil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="flex items-center gap-2.5 text-mv-ink-faint">
          <Plus size={14} />
          <span>Nouvel espace (bientôt)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 text-mv-red">
          <LogOut size={14} />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
