'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, User, Settings2, CreditCard, Users, Zap, LogOut, Sparkles, ShieldCheck, Bell, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UserAvatar } from '@/components/ui/user-avatar';

interface UserMenuProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  align?: 'start' | 'end';
  /** 'row' (default) is a plain hover row for the topbar; 'card' is a
   * bordered profile card for the sidebar header (v2 Kanban reference). */
  variant?: 'row' | 'card';
}

export function UserMenu({ collapsed = false, onNavigate, align = 'start', variant = 'row' }: UserMenuProps) {
  const { fullName, email, avatarUrl, role } = useCurrentUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const avatar = (
    <UserAvatar
      src={avatarUrl}
      name={fullName}
      email={email}
      size="sm"
    />
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-full py-1 cursor-pointer">{avatar}</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} side="right" className="w-60">
          <MenuBody
            fullName={fullName}
            email={email}
            role={role}
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
        <button
          className={
            variant === 'card'
              ? 'flex w-full items-center gap-2.5 rounded-xl border border-mv-border bg-mv-surface px-2.5 py-2 text-left transition-colors hover:border-mv-ink-faint cursor-pointer'
              : 'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-mv-cream-soft cursor-pointer'
          }
        >
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
          role={role}
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
  role,
  settingsOpen,
  setSettingsOpen,
  onNavigate,
  onLogout,
}: {
  fullName: string;
  email: string;
  role: string;
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
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
            className="overflow-hidden"
          >
            <DropdownMenuItem asChild onClick={onNavigate}>
              <Link href="/integrations" className="flex items-center gap-2.5 pl-6">
                <Zap size={14} className="shrink-0" />
                <span>Intégrations</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={onNavigate}>
              <Link href="/settings/notifications" className="flex items-center gap-2.5 pl-6">
                <Bell size={14} className="shrink-0" />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={onNavigate}>
              <Link href="/help" className="flex items-center gap-2.5 pl-6">
                <HelpCircle size={14} className="shrink-0" />
                <span>Aide</span>
              </Link>
            </DropdownMenuItem>
            {role === 'admin' && (
              <DropdownMenuItem asChild onClick={onNavigate}>
                <Link href="/settings/billing" className="flex items-center gap-2.5 pl-6">
                  <CreditCard size={14} className="shrink-0" />
                  <span>Facturation</span>
                </Link>
              </DropdownMenuItem>
            )}
            {role === 'admin' && (
              <DropdownMenuItem asChild onClick={onNavigate}>
                <Link href="/settings/permissions" className="flex items-center gap-2.5 pl-6">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>Permissions</span>
                </Link>
              </DropdownMenuItem>
            )}
            {role === 'admin' && (
              <DropdownMenuItem asChild onClick={onNavigate}>
                <Link href="/audits" className="flex items-center gap-2.5 pl-6">
                  <Sparkles size={14} className="shrink-0" />
                  <span>Audits IA</span>
                </Link>
              </DropdownMenuItem>
            )}
            {role === 'admin' && (
              <DropdownMenuItem asChild onClick={onNavigate}>
                <Link href="/acquisition" className="flex items-center gap-2.5 pl-6">
                  <Users size={14} className="shrink-0" />
                  <span>Acquisition</span>
                </Link>
              </DropdownMenuItem>
            )}
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
