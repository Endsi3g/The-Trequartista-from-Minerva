'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, User, Settings2, CreditCard, Users, Zap, LogOut, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function UserMenu({ collapsed = false, onNavigate }: UserMenuProps) {
  const { fullName, email, avatarUrl } = useCurrentUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const avatar = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={fullName || email}
      className="h-7 w-7 shrink-0 rounded-full object-cover border border-mv-border"
    />
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-full py-1 cursor-pointer">{avatar}</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-60">
          <MenuBody
            fullName={fullName}
            email={email}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            onNavigate={onNavigate}
            onLogout={handleLogout}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-mv-cream-soft cursor-pointer">
          {avatar}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-mv-ink">
              {fullName || 'Mon compte'}
            </span>
            <span className="block truncate text-[11px] text-mv-ink-faint">{email}</span>
          </span>
          <ChevronDown size={14} className="shrink-0 text-mv-ink-faint" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <MenuBody
          fullName={fullName}
          email={email}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          onNavigate={onNavigate}
          onLogout={handleLogout}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuBody({
  settingsOpen,
  setSettingsOpen,
  onNavigate,
  onLogout,
}: {
  fullName: string;
  email: string;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <DropdownMenuItem asChild onClick={onNavigate}>
        <Link href="/profil" className="flex items-center gap-2.5">
          <User size={15} className="shrink-0" />
          <span className="font-semibold text-mv-ink">Mon profil</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild onClick={onNavigate}>
        <Link href="/team" className="flex items-center gap-2.5">
          <Users size={15} className="shrink-0" />
          <span className="font-semibold text-mv-ink">Équipe</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild onClick={onNavigate}>
        <Link href="/changelog" className="flex items-center gap-2.5">
          <Sparkles size={15} className="shrink-0" />
          <span className="font-semibold text-mv-ink">Nouveautés</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setSettingsOpen(!settingsOpen);
        }}
        className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-mv-ink-faint hover:text-mv-ink transition-colors"
      >
        <span className="flex items-center gap-2">
          <Settings2 size={13} />
          Paramètres
        </span>
        <motion.span animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {settingsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 40 }}
            className="overflow-hidden"
          >
            <DropdownMenuItem asChild onClick={onNavigate}>
              <Link href="/integrations" className="flex items-center gap-2.5 pl-6">
                <Zap size={14} className="shrink-0" />
                <span>Intégrations</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={onNavigate}>
              <Link href="/settings/billing" className="flex items-center gap-2.5 pl-6">
                <CreditCard size={14} className="shrink-0" />
                <span>Facturation</span>
              </Link>
            </DropdownMenuItem>
          </motion.div>
        )}
      </AnimatePresence>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout} className="flex items-center gap-2.5 text-mv-red">
        <LogOut size={15} className="shrink-0" />
        <span className="font-semibold">Déconnexion</span>
      </DropdownMenuItem>
    </>
  );
}
