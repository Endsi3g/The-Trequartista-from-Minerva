'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, ArrowRight, ArrowLeft, User, Briefcase, Sparkles, Upload, Bell, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BonsaiPlantLoader } from '@/components/ui/bonsai-plant-loader';
import { LogoMark } from '@/components/shell/Logo';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/providers/ToastProvider';

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Step 1 -- Profil
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Step 2 -- Rôle
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Direction & Management');

  // Step 3 -- Préférences
  const [defaultView, setDefaultView] = useState('/overview');

  // Step 4 -- Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true);
  const [changelogAnnouncementsEnabled, setChangelogAnnouncementsEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toastError } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        } else {
          setFullName(user.email?.split('@')[0] || '');
        }
        setAvatarUrl(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'MV')}&backgroundColor=1E4B33&fontColor=ffffff`);
      }
    })();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      const filePath = `avatars/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('team-documents').upload(filePath, file, { upsert: true });
      if (uploadError) {
        toastError("Erreur d'upload", uploadError.message);
        return;
      }
      const { data } = supabase.storage.from('team-documents').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await supabase.from('profiles').upsert(
        {
          id: userId,
          full_name: fullName,
          email: userEmail,
          avatar_url: avatarUrl,
          bio: bio || null,
          role,
          department,
          default_view: defaultView,
          approved: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      await supabase.from('notification_preferences').upsert(
        {
          user_id: userId,
          push_enabled: pushEnabled,
          task_reminders_enabled: taskRemindersEnabled,
          changelog_announcements_enabled: changelogAnnouncementsEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      setStep(5);
      setTimeout(() => {
        window.location.href = defaultView;
      }, 1400);
    } catch {
      window.location.href = '/overview';
    } finally {
      setLoading(false);
    }
  };

  const StepShell = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-xs font-bold text-mv-ink-faint">{step}/{TOTAL_STEPS}</p>
        </div>
        {children}
      </div>

      {/* Live preview -- real sidebar look with the data entered so far */}
      <div className="hidden lg:block bg-mv-cream-soft border-l border-mv-border p-4">
        <div className="rounded-xl border border-mv-border bg-mv-surface overflow-hidden h-full">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-mv-border">
            <LogoMark size={20} />
            <span className="text-xs font-bold text-mv-ink truncate">{department || 'Espace de travail'}</span>
          </div>
          <div className="p-3 flex items-center gap-2.5">
            <img src={avatarUrl} alt={fullName} className="w-8 h-8 rounded-full object-cover border border-mv-border" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-mv-ink truncate">{fullName || 'Ton nom'}</div>
              <div className="text-[10px] text-mv-ink-faint truncate">{role || 'Ton rôle'}</div>
            </div>
          </div>
          <div className="px-3 space-y-1.5 mt-2">
            {['Accueil', 'Clients', 'Leads', 'Projets'].map((label) => (
              <div key={label} className="h-6 rounded-md bg-mv-cream-soft" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mv-cream flex flex-col justify-between relative overflow-hidden text-mv-ink">
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between z-20 relative bg-mv-surface/60 backdrop-blur-sm border-b border-mv-border/40">
        <LogoMark />
        <div className="flex items-center gap-2 text-xs font-bold text-mv-ink-soft">
          <span>Étape {step} sur {TOTAL_STEPS}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-20 relative my-6">
        <div className="bg-mv-surface border border-mv-border rounded-[16px] shadow-mv-md max-w-[820px] w-full relative overflow-hidden">
          {loading && <BonsaiPlantLoader title="Un instant !" subtitle="Configuration de votre espace…" />}

          {/* Stepper */}
          <div className="flex items-center gap-2 px-6 sm:px-8 pt-6">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-mv-green' : 'bg-mv-border'}`} />
            ))}
          </div>

          {step === 1 && (
            <StepShell>
              <h1 className="text-2xl font-extrabold text-mv-ink font-display tracking-tight">Configure ton profil</h1>
              <p className="text-xs text-mv-ink-soft -mt-4">Ton profil interne pour l&apos;équipe Minerva ({userEmail}).</p>

              <div className="flex items-center gap-4">
                <img src={avatarUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover border-2 border-mv-green" />
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border text-mv-green font-bold text-xs cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" /> {uploadingAvatar ? 'Envoi…' : 'Téléverser une photo'}
                  <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" disabled={uploadingAvatar} />
                </label>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-mv-ink">Nom complet</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marie Tremblay"
                    className="w-full px-3.5 py-2.5 pl-10 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
                  />
                  <User className="w-4 h-4 text-mv-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-mv-ink">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Quelques mots sur toi…"
                  className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green resize-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!fullName.trim()}
                className="w-full py-3 px-4 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell>
              <h1 className="text-2xl font-extrabold text-mv-ink font-display tracking-tight">Ton rôle</h1>
              <p className="text-xs text-mv-ink-soft -mt-4">Comment ton équipe te reconnaît-elle ?</p>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-mv-ink">Fonction / Intitulé de poste</label>
                <div className="relative">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Gestionnaire de comptes"
                    className="w-full px-3.5 py-2.5 pl-10 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
                  />
                  <Briefcase className="w-4 h-4 text-mv-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-mv-ink">Département / Pôle d&apos;expertise</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green appearance-none"
                >
                  <option value="Direction & Management">Direction & Management</option>
                  <option value="Design & UX Studio">Design & UX Studio</option>
                  <option value="Achat Média & Growth">Achat Média & Growth</option>
                  <option value="Développement & Tech">Développement & Tech</option>
                  <option value="Gestion de Comptes & ROI">Gestion de Comptes & ROI</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3 px-4 bg-mv-cream-soft border border-mv-border text-mv-ink font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Retour
                </button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 px-4 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center justify-center gap-2">
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell>
              <h1 className="text-2xl font-extrabold text-mv-ink font-display tracking-tight">Préférences de travail</h1>
              <p className="text-xs text-mv-ink-soft -mt-4">Personnalise ton affichage par défaut.</p>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-mv-ink">Vue initiale au démarrage</label>
                <div className="relative">
                  <select
                    value={defaultView}
                    onChange={(e) => setDefaultView(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-10 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green appearance-none"
                  >
                    <option value="/overview">Vue d&apos;ensemble (tableau de bord)</option>
                    <option value="/leads">CRM Leads & Pipeline</option>
                    <option value="/projects">Projets & Livraison</option>
                    <option value="/content-planner">Planificateur Reels</option>
                    <option value="/tasks">Mes tâches</option>
                  </select>
                  <LayoutDashboard className="w-4 h-4 text-mv-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-mv-ink-faint">Cette vue s&apos;ouvrira automatiquement à chaque connexion.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="w-1/3 py-3 px-4 bg-mv-cream-soft border border-mv-border text-mv-ink font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Retour
                </button>
                <button type="button" onClick={() => setStep(4)} className="flex-1 py-3 px-4 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center justify-center gap-2">
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell>
              <h1 className="text-2xl font-extrabold text-mv-ink font-display tracking-tight">Notifications</h1>
              <p className="text-xs text-mv-ink-soft -mt-4">Choisis comment tu veux être averti.</p>

              <div className="rounded-xl border border-mv-border divide-y divide-mv-border overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-mv-green shrink-0" />
                    <span className="text-sm font-semibold text-mv-ink">Notifications push</span>
                  </div>
                  <Switch checked={pushEnabled} onChange={setPushEnabled} label="Notifications push" />
                </div>
                <div className="flex items-center justify-between gap-4 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-mv-green shrink-0" />
                    <span className="text-sm font-semibold text-mv-ink">Rappels de tâches en retard</span>
                  </div>
                  <Switch checked={taskRemindersEnabled} onChange={setTaskRemindersEnabled} label="Rappels de tâches" />
                </div>
                <div className="flex items-center justify-between gap-4 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-mv-green shrink-0" />
                    <span className="text-sm font-semibold text-mv-ink">Nouveautés (changelog)</span>
                  </div>
                  <Switch checked={changelogAnnouncementsEnabled} onChange={setChangelogAnnouncementsEnabled} label="Nouveautés" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setStep(3)} className="w-1/3 py-3 px-4 bg-mv-cream-soft border border-mv-border text-mv-ink font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Retour
                </button>
                <button type="button" onClick={handleFinish} disabled={loading} className="flex-1 py-3 px-4 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                  <span>Lancer mon espace</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <div className="text-center py-16 px-8 space-y-4 animate-mv-scale-in">
              <div className="w-16 h-16 rounded-full bg-mv-green-tint text-mv-green flex items-center justify-center mx-auto mb-2">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h1 className="text-2xl font-extrabold text-mv-ink font-display">Configuration réussie !</h1>
              <p className="text-xs text-mv-ink-soft max-w-sm mx-auto">
                Bienvenue {fullName}. Redirection automatique vers votre tableau de bord…
              </p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-left.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>
      <div className="fixed bottom-0 right-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-right.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>
    </div>
  );
}
