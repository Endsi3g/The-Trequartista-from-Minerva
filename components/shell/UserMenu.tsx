'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Users,
  Sparkles,
  Zap,
  Bell,
  HelpCircle,
  CreditCard,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
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
  variant?: 'row' | 'card';
}

export function UserMenu({ collapsed = false, onNavigate, align = 'start', variant = 'row' }: UserMenuProps) {
  const { fullName, email, avatarUrl, role } = useCurrentUser();
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
        <DropdownMenuContent align={align} side="right" className="w-[230px] p-1 shadow-lg border border-mv-border bg-white rounded-lg">
          <MenuBody
            fullName={fullName}
            email={email}
            role={role}
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
              ? 'flex w-full items-center gap-2 rounded-[6px] border border-mv-border bg-white px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03] cursor-pointer h-9'
              : 'flex w-full items-center gap-2 rounded-[4px] px-2 py-1 text-left transition-colors hover:bg-black/[0.04] cursor-pointer h-8'
          }
        >
          {avatar}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-medium text-mv-ink leading-tight">
              {fullName || 'Mon compte'}
            </span>
            <span className="block truncate text-[10.5px] text-mv-ink-faint leading-tight font-mono">
              {email}
            </span>
          </span>
          <ChevronDown size={12} className="shrink-0 text-mv-ink-faint opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-[230px] p-1 shadow-lg border border-mv-border bg-white rounded-lg mb-1">
        <MenuBody
          fullName={fullName}
          email={email}
          role={role}
          onNavigate={onNavigate}
          onLogout={handleLogout}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuBody({
  fullName,
  email,
  role,
  onNavigate,
  onLogout,
}: {
  fullName: string;
  email: string;
  role: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-0.5 text-[12px]">
      {/* ── User Identity Strip ── */}
      <div className="px-2 py-1.5 border-b border-mv-border mb-1 bg-black/[0.01] rounded-t-[4px]">
        <div className="font-medium text-mv-ink truncate text-[12px]">{fullName || 'Utilisateur'}</div>
        <div className="text-[10.5px] text-mv-ink-faint font-mono truncate">{email}</div>
      </div>

      {/* ── Main Navigation Items ── */}
      <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
        <Link href="/profil" className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-mv-ink">
            <User size={13} className="shrink-0 text-mv-ink-soft" />
            <span>Mon profil</span>
          </div>
          <kbd className="text-[9px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-black/[0.02]">
            G P
          </kbd>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
        <Link href="/team" className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-mv-ink">
            <Users size={13} className="shrink-0 text-mv-ink-soft" />
            <span>Équipe</span>
          </div>
          <kbd className="text-[9px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-black/[0.02]">
            G T
          </kbd>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
        <Link href="/changelog" className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-mv-ink">
            <Sparkles size={13} className="shrink-0 text-mv-ink-soft" />
            <span>Nouveautés</span>
          </div>
          <kbd className="text-[9px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-black/[0.02]">
            G C
          </kbd>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-mv-border" />

      {/* ── Static Settings Group Header ── */}
      <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mv-ink-faint">
        Paramètres
      </div>

      <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
        <Link href="/integrations" className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-mv-ink">
            <Zap size={13} className="shrink-0 text-mv-ink-soft" />
            <span>Intégrations</span>
          </div>
          <kbd className="text-[9px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-black/[0.02]">
            ,
          </kbd>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
        <Link href="/settings/notifications" className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-mv-ink">
            <Bell size={13} className="shrink-0 text-mv-ink-soft" />
            <span>Notifications</span>
          </div>
          <kbd className="text-[9px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-black/[0.02]">
            G N
          </kbd>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
        <Link href="/help" className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-mv-ink">
            <HelpCircle size={13} className="shrink-0 text-mv-ink-soft" />
            <span>Aide & Support</span>
          </div>
          <kbd className="text-[9px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-black/[0.02]">
            ?
          </kbd>
        </Link>
      </DropdownMenuItem>

      {role === 'admin' && (
        <>
          <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
            <Link href="/settings/billing" className="flex items-center gap-2 text-mv-ink">
              <CreditCard size={13} className="shrink-0 text-mv-ink-soft" />
              <span>Facturation</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild onClick={onNavigate} className="h-7 px-2 rounded-[4px] cursor-pointer hover:bg-black/[0.04] focus:bg-black/[0.04]">
            <Link href="/settings/permissions" className="flex items-center gap-2 text-mv-ink">
              <ShieldCheck size={13} className="shrink-0 text-mv-ink-soft" />
              <span>Permissions</span>
            </Link>
          </DropdownMenuItem>
        </>
      )}

      <DropdownMenuSeparator className="my-1 bg-mv-border" />

      {/* ── Logout ── */}
      <DropdownMenuItem
        onClick={onLogout}
        className="h-7 px-2 rounded-[4px] cursor-pointer flex items-center justify-between text-mv-ink-soft hover:text-mv-red hover:bg-red-50/50 focus:text-mv-red focus:bg-red-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <LogOut size={13} className="shrink-0" />
          <span className="font-medium">Déconnexion</span>
        </div>
        <kbd className="text-[9px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-black/[0.02]">
          ⌥ ⇧ Q
        </kbd>
      </DropdownMenuItem>
    </div>
  );
}
