'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bell } from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';

export default function NotificationsSettingsPage() {
  const { toastSuccess, toastError } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Notification Preferences State
  const [prefs, setPrefs] = useState({
    comments: true,
    mentions: true,
    newLeads: true,
    productUpdates: true,
    tipsAndTutorials: false,
    securityAlerts: true,
    billingUpdates: true,
  });

  useEffect(() => {
    async function loadPrefs() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setPrefs({
              comments: data.push_enabled ?? true,
              mentions: data.task_reminders_enabled ?? true,
              newLeads: data.new_leads_enabled ?? true,
              productUpdates: data.changelog_announcements_enabled ?? true,
              tipsAndTutorials: data.tips_tutorials_enabled ?? false,
              securityAlerts: true,
              billingUpdates: true,
            });
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, []);

  const handleToggle = async (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);

    if (!userId) return;

    try {
      const supabase = createClient();
      await supabase.from('notification_preferences').upsert({
        user_id: userId,
        push_enabled: updated.comments,
        task_reminders_enabled: updated.mentions,
        new_leads_enabled: updated.newLeads,
        changelog_announcements_enabled: updated.productUpdates,
        tips_tutorials_enabled: updated.tipsAndTutorials,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      toastSuccess('Préférence enregistrée');
    } catch {
      toastError('Erreur', 'Impossible de sauvegarder la préférence.');
    }
  };

  return (
    <PageFadeIn className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* ── Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
          <Bell className="w-3.5 h-3.5" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight">Notifications</h1>
          <p className="text-xs text-mv-ink-soft">Gérez la manière dont vous recevez les notifications à travers les différentes sections.</p>
        </div>
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : (
        <>

      {/* Group 1: ACTIVITY */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-mv-ink-faint uppercase tracking-wider px-1">
          Activité
        </h2>
        <Card className="p-0 overflow-hidden border border-mv-border shadow-mv-sm divide-y divide-mv-border/60">
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-mv-ink">Commentaires</div>
              <p className="text-xs text-mv-ink-soft">
                Quand un coéquipier commente vos publications ou vous répond.
              </p>
            </div>
            <Switch
              checked={prefs.comments}
              onCheckedChange={() => handleToggle('comments')}
            />
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-mv-ink">Mentions</div>
              <p className="text-xs text-mv-ink-soft">
                Quand quelqu&apos;un vous mentionne dans un commentaire ou une tâche.
              </p>
            </div>
            <Switch
              checked={prefs.mentions}
              onCheckedChange={() => handleToggle('mentions')}
            />
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-mv-ink">Nouveaux leads</div>
              <p className="text-xs text-mv-ink-soft">
                Quand un nouveau prospect entre dans le pipeline CRM.
              </p>
            </div>
            <Switch
              checked={prefs.newLeads}
              onCheckedChange={() => handleToggle('newLeads')}
            />
          </div>
        </Card>
      </div>

      {/* Group 2: UPDATES */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-mv-ink-faint uppercase tracking-wider px-1">
          Mises à jour
        </h2>
        <Card className="p-0 overflow-hidden border border-mv-border shadow-mv-sm divide-y divide-mv-border/60">
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-mv-ink">Nouveautés produit</div>
              <p className="text-xs text-mv-ink-soft">
                Annonces concernant les nouvelles fonctionnalités et améliorations.
              </p>
            </div>
            <Switch
              checked={prefs.productUpdates}
              onCheckedChange={() => handleToggle('productUpdates')}
            />
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-mv-ink">Conseils et guides</div>
              <p className="text-xs text-mv-ink-soft">
                Contenu utile pour tirer le meilleur parti de Minerva.
              </p>
            </div>
            <Switch
              checked={prefs.tipsAndTutorials}
              onCheckedChange={() => handleToggle('tipsAndTutorials')}
            />
          </div>
        </Card>
      </div>

      {/* Group 3: ACCOUNT */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-mv-ink-faint uppercase tracking-wider px-1">
          Compte
        </h2>
        <Card className="p-0 overflow-hidden border border-mv-border shadow-mv-sm divide-y divide-mv-border/60">
          <div className="p-4 sm:p-5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-mv-green shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-mv-ink">Alertes de sécurité</div>
              <p className="text-xs text-mv-ink-soft">
                Alertes critiques concernant la sécurité de votre compte — toujours activées, non désactivables.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-mv-green shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-mv-ink">Mises à jour de facturation</div>
              <p className="text-xs text-mv-ink-soft">
                Notifications concernant les paiements et factures Stripe — toujours activées, non désactivables.
              </p>
            </div>
          </div>
        </Card>
      </div>
        </>
      )}
    </PageFadeIn>
  );
}
