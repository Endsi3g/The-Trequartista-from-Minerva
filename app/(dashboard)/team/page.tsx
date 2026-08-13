'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Plus, ExternalLink, UserPlus, Users, Shield, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { role: currentUserRole } = useCurrentUser();

  useEffect(() => {
    async function loadTeam() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, department, avatar_url, created_at')
          .eq('approved', true)
          .order('created_at', { ascending: true });
        setMembers(data || []);
      } catch {
        // Fallback: show empty state
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'MV';
  };

  const getAvatarSrc = (member: TeamMember) => {
    if (member.avatar_url) return member.avatar_url;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.full_name || member.email || 'MV')}&backgroundColor=1c9a6f&fontColor=ffffff`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Répertoire Équipe In-House Minerva
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Cliquez sur un membre pour voir sa fiche de performance, ses objectifs et planifier son prochain 1-on-1.
          </p>
        </div>

        {currentUserRole === 'admin' && (
          <div className="flex items-center gap-2">
            <Link
              href="/team/workload"
              className="px-4 py-2 bg-mv-surface border border-mv-border hover:border-mv-green/40 text-mv-ink text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Charge de travail
            </Link>
            <Tooltip content="Générer un lien d'invitation pour un nouveau membre" position="left">
              <Link href="/team/invite">
                <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                  Inviter un Collaborateur
                </Button>
              </Link>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-mv-surface border border-mv-border">
          <div className="flex items-center gap-2 text-mv-ink-soft text-xs mb-1">
            <Users className="w-3.5 h-3.5" />
            Membres actifs
          </div>
          <div className="text-2xl font-extrabold text-mv-ink">
            {loading ? '—' : members.length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-mv-surface border border-mv-border">
          <div className="flex items-center gap-2 text-mv-ink-soft text-xs mb-1">
            <Shield className="w-3.5 h-3.5" />
            Admins
          </div>
          <div className="text-2xl font-extrabold text-mv-green">
            {loading ? '—' : members.filter((m) => m.role === 'admin').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-mv-surface border border-mv-border col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-mv-ink-soft text-xs mb-1">
            <UserPlus className="w-3.5 h-3.5" />
            Membres standard
          </div>
          <div className="text-2xl font-extrabold text-mv-ink">
            {loading ? '—' : members.filter((m) => m.role === 'member').length}
          </div>
        </div>
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-mv-surface border border-mv-border animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-mv-green-tint border border-mv-green/20 flex items-center justify-center text-mv-green">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-mv-ink">Aucun membre approuvé</h3>
              <p className="text-sm text-mv-ink-soft mt-1">
                Les membres apparaîtront ici après approbation dans{' '}
                <Link href="/settings/billing" className="text-mv-green hover:underline font-medium">
                  Paramètres → Gestion des Accès
                </Link>.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member) => (
            <Card key={member.id}>
              <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={getAvatarSrc(member)}
                    alt={member.full_name || member.email || 'Membre'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-mv-green shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(member.full_name, member.email)}&backgroundColor=1c9a6f&fontColor=ffffff`;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-mv-ink truncate">
                      {member.full_name || 'Membre Minerva'}
                    </div>
                    <div className="text-xs text-mv-ink-soft flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="green">● Actif</Badge>
                      {member.role === 'admin' && (
                        <Tooltip content="Administrateur de l'organisation" position="right">
                          <Badge variant="neutral">
                            <Shield className="w-2.5 h-2.5 inline mr-0.5" />
                            Admin
                          </Badge>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>

                <Tooltip content="Voir la fiche 1-on-1 et les performances" position="left">
                  <Link href={`/team/${member.id}/performance`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />} className="w-full sm:w-auto">
                      Fiche 1-on-1
                    </Button>
                  </Link>
                </Tooltip>
              </div>

              <div className="mt-4 pt-4 border-t border-mv-border space-y-2 text-xs">
                {member.department && (
                  <div className="flex justify-between text-mv-ink-soft">
                    <span>Département :</span>
                    <span className="font-bold text-mv-ink">{member.department}</span>
                  </div>
                )}
                <div className="flex justify-between text-mv-ink-soft">
                  <span>Membre depuis :</span>
                  <span className="font-bold text-mv-ink font-mono">
                    {new Date(member.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
