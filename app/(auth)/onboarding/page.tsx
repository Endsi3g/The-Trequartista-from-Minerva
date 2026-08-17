'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, ArrowRight, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BonsaiPlantLoader } from '@/components/ui/bonsai-plant-loader';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/providers/ToastProvider';
import { motion, AnimatePresence } from 'motion/react';

const STEPS = [
  { id: 1, label: 'Votre profil' },
  { id: 2, label: 'Votre rôle' },
  { id: 3, label: 'Votre équipe' },
  { id: 4, label: 'Préférences' },
  { id: 5, label: 'Terminer' },
];

const DEPARTMENTS = ['Tech & IA', 'Marketing', 'Ventes', 'Design', 'Opérations', 'Gestion'];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('member');

  // Step 1: Profil
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sendUpdates, setSendUpdates] = useState(true);

  // Step 2: Rôle
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('Tech & IA');

  // Step 3: Équipe
  const [teamSize, setTeamSize] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');

  // Step 4: Préférences
  const [defaultView, setDefaultView] = useState('/overview');
  const [timezone, setTimezone] = useState('America/Toronto');
  const [language, setLanguage] = useState('fr');

  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toastError, toastSuccess } = useToast();

  useEffect(() => {
    (async () => {
      // Created inside the effect, not at component top-level -- this page
      // has no `dynamic` export, so a top-level createClient() call also
      // runs during SSR/build prerendering and throws when the public
      // Supabase env vars aren't present in that environment (e.g. CI).
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, bio, avatar_url, client_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role === 'client') {
          window.location.href = '/portal';
          return;
        }
        if (profile?.role) setUserRole(profile.role);
        if (profile?.full_name) setFullName(profile.full_name);
        else if (user.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
        if (profile?.bio) setBio(profile.bio);
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    })();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const filePath = `avatars/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('team-documents').upload(filePath, file, { upsert: true });
      if (error) { toastError("Erreur d'upload", error.message); return; }
      const { data } = supabase.storage.from('team-documents').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toastSuccess('Photo téléchargée !');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const finalRole = userRole || 'member';
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        email: userEmail,
        avatar_url: avatarUrl || null,
        bio: bio || null,
        role: finalRole,
        department,
        default_view: defaultView,
        approved: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      await supabase.from('notification_preferences').upsert({
        user_id: userId,
        push_enabled: true,
        task_reminders_enabled: true,
        changelog_announcements_enabled: sendUpdates,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setStep(5);
      toastSuccess('Profil créé !', 'Bienvenue dans Minerva.');
      setTimeout(() => {
        window.location.href = finalRole === 'client' ? '/portal' : defaultView;
      }, 1400);
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-8 font-sans text-neutral-900">
      {loading && <BonsaiPlantLoader title="Configuration…" subtitle="Création de votre espace de travail" />}

      <div className="bg-white border border-neutral-200/90 rounded-[28px] shadow-sm max-w-[1080px] w-full p-6 sm:p-12 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-stretch">

        {/* ── Left: Form Area ── */}
        <div className="flex flex-col justify-between min-h-[540px]">
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 font-mono">{step}/{STEPS.length}</span>
                <span className="text-xs font-semibold text-[#059669]">{STEPS[step - 1].label}</span>
              </div>
              <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#059669] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ── STEP 1: Profil ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
                    Set up your profile
                  </h1>

                  {/* Avatar upload */}
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="relative w-20 h-20 rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center overflow-hidden hover:border-[#059669] transition-colors group shrink-0"
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Plus className="w-6 h-6 text-neutral-400 group-hover:text-[#059669] transition-colors stroke-[1.5]" />
                      )}
                    </button>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-neutral-900">Profile picture</p>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center px-4 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition-all cursor-pointer"
                      >
                        {uploadingAvatar ? 'Téléchargement…' : 'Upload image'}
                      </button>
                      <p className="text-[11px] text-neutral-400">*.png, *.jpeg files up to 10MB</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Full name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#059669] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        placeholder="A few words about yourself..."
                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#059669] resize-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Work email</label>
                      <input
                        type="email"
                        value={userEmail}
                        readOnly
                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-500 bg-neutral-50/50 cursor-default"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-xs font-bold text-neutral-900">Send me product updates</p>
                        <p className="text-[11px] text-neutral-400">Stay informed about new features and improvements.</p>
                      </div>
                      <Switch checked={sendUpdates} onCheckedChange={setSendUpdates} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Rôle ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
                    Your role
                  </h1>
                  <p className="text-sm text-neutral-500">Aidez-nous à personnaliser votre expérience selon votre fonction.</p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Intitulé de poste</label>
                      <input
                        type="text"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="Ex: Directeur croissance, Responsable IA…"
                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#059669] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Département</label>
                      <div className="grid grid-cols-2 gap-2">
                        {DEPARTMENTS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDepartment(d)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                              department === d
                                ? 'border-[#059669] bg-[#059669] text-white'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Équipe ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
                    Your team
                  </h1>
                  <p className="text-sm text-neutral-500">Invitez vos collègues à rejoindre Minerva. Vous pourrez le faire plus tard aussi.</p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Taille de l&apos;équipe</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['1-5', '6-20', '21-50', '51-200', '200+', 'Solo'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setTeamSize(size)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              teamSize === size
                                ? 'border-[#059669] bg-[#059669] text-white'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Inviter des collègues</label>
                      <textarea
                        value={inviteEmails}
                        onChange={(e) => setInviteEmails(e.target.value)}
                        rows={3}
                        placeholder="jean@entreprise.com, marie@entreprise.com…"
                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#059669] resize-none transition-colors"
                      />
                      <p className="text-[11px] text-neutral-400">Séparez les adresses par des virgules.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Préférences ── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
                    Preferences
                  </h1>
                  <p className="text-sm text-neutral-500">Configurez votre vue par défaut et vos réglages régionaux.</p>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900">Page d&apos;accueil par défaut</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { href: '/overview', label: 'Vue d\'ensemble — Tableau de bord IA', icon: '📊' },
                          { href: '/tasks', label: 'Tâches — Gestion de projets', icon: '✅' },
                          { href: '/clients', label: 'Clients — Gestion des comptes', icon: '👥' },
                        ].map((v) => (
                          <button
                            key={v.href}
                            type="button"
                            onClick={() => setDefaultView(v.href)}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                              defaultView === v.href
                                ? 'border-[#059669] bg-[#059669]/5 text-[#059669]'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            <span className="text-base">{v.icon}</span>
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-900">Fuseau horaire</label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#059669] bg-white cursor-pointer"
                        >
                          <option value="America/Toronto">America/Toronto (EST)</option>
                          <option value="America/Montreal">America/Montréal</option>
                          <option value="America/Vancouver">America/Vancouver (PST)</option>
                          <option value="Europe/Paris">Europe/Paris (CET)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-900">Langue</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#059669] bg-white cursor-pointer"
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: Terminé ── */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center space-y-6 py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-[#059669] flex items-center justify-center shadow-lg">
                    <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                      Vous êtes prêt·e !
                    </h1>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                      Votre espace Minerva est configuré. Redirection vers votre tableau de bord…
                    </p>
                  </div>
                  <div className="w-40 h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#059669] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.2 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="flex items-center gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-60"
                >
                  <span>{loading ? 'Sauvegarde…' : 'Terminer la configuration'}</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Workspace Preview Mockup ── */}
        <div className="hidden lg:flex flex-col border border-neutral-200/80 rounded-2xl bg-neutral-50/50 overflow-hidden shadow-sm">
          <div className="grid grid-cols-[180px_1fr] flex-1 h-full min-h-[460px]">
            {/* Mini Sidebar */}
            <div className="border-r border-neutral-200/70 p-4 space-y-3 bg-neutral-50/80">
              <div className="flex items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[#059669] flex items-center justify-center shrink-0" />
                  <span className="text-xs font-bold text-neutral-900 truncate">Workspace</span>
                </div>
                <span className="text-neutral-400 text-xs">‹</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {[true, false, false, false, false, false, false, false, false].map((active, i) => (
                  <div key={i} className={`h-7 rounded-lg border ${active ? 'bg-[#059669]/10 border-[#059669]/20' : 'bg-neutral-100/60 border-neutral-200/50'}`} />
                ))}
              </div>
            </div>

            {/* Mini Content */}
            <div className="p-4 flex flex-col justify-between space-y-3 bg-white">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-7 rounded-lg bg-neutral-50 border border-neutral-200" />
                  <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200" />
                  <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200" />
                </div>
                <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-200">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className={`grid grid-cols-4 divide-x divide-neutral-200 h-8 ${i === 0 ? 'bg-neutral-50' : ''}`}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className={`${i === 0 ? 'bg-neutral-100/50' : 'bg-white'}`} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-6 h-6 rounded-md border ${i === 0 ? 'bg-[#059669] border-[#059669]' : 'bg-neutral-50 border-neutral-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
