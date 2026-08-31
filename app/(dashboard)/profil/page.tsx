'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Bell,
  ShieldCheck,
  Mail,
  Save,
  CheckCircle2,
  Upload,
  Lock,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Phone,
  MapPin,
  Building,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { UserAvatar } from '@/components/ui/user-avatar';

export default function ProfilePage() {
  const { refresh: refreshCurrentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'info' | 'notifications' | 'security'>('info');

  // Form State
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  // Load real user from Supabase on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          setEmail(user.email || '');
          // `phone`/`instagram_url` ship in a migration that may not be
          // deployed yet -- an explicit select naming a missing column
          // 400s the whole query, so try the widened select first and
          // fall back to the base column set rather than losing every
          // other field on this page until the migration lands.
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, role, department, avatar_url, username, bio, location, website, twitter, linkedin, github, phone, instagram_url')
            .eq('id', user.id)
            .single();
          if (profileError) {
            ({ data: profile } = await supabase
              .from('profiles')
              .select('full_name, role, department, avatar_url, username, bio, location, website, twitter, linkedin, github')
              .eq('id', user.id)
              .single());
          }
          if (profile) {
            setFullName(profile.full_name || user.user_metadata?.full_name || '');
            setRole(profile.role || 'member');
            setDepartment(profile.department || '');
            setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || user.email || 'MV')}&backgroundColor=059669&fontColor=ffffff`);
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setLocation(profile.location || '');
            setWebsite(profile.website || '');
            setTwitter(profile.twitter || '');
            setLinkedin(profile.linkedin || '');
            setGithub(profile.github || '');
            setPhone((profile as { phone?: string | null }).phone || '');
            setInstagramUrl((profile as { instagram_url?: string | null }).instagram_url || '');
          } else {
            setFullName(user.user_metadata?.full_name || '');
            setAvatarUrl(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'MV')}&backgroundColor=059669&fontColor=ffffff`);
          }
        }
      } catch {}
    }
    loadUser();
  }, []);

  // Notification Preferences State — persisted in notification_preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true);
  const [changelogAnnouncementsEnabled, setChangelogAnnouncementsEnabled] = useState(true);
  const [notifPrefsLoaded, setNotifPrefsLoaded] = useState(false);

  useEffect(() => {
    async function loadNotifPrefs() {
      if (!userId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('notification_preferences')
        .select('push_enabled, task_reminders_enabled, changelog_announcements_enabled')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        setPushEnabled(data.push_enabled);
        setTaskRemindersEnabled(data.task_reminders_enabled);
        setChangelogAnnouncementsEnabled(data.changelog_announcements_enabled);
      }
      setNotifPrefsLoaded(true);
    }
    loadNotifPrefs();
  }, [userId]);

  const persistNotifPref = async (patch: Partial<{ push_enabled: boolean; task_reminders_enabled: boolean; changelog_announcements_enabled: boolean }>) => {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      toastError('Erreur de sauvegarde', "Impossible d'enregistrer la préférence.");
    }
  };

  // Status State
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClient();
  const { toastSuccess, toastError } = useToast();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    const filePath = `avatars/${Date.now()}-${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage.from('team-documents').upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        toastError("Erreur d'upload", `Impossible d'enregistrer l'image : ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from('team-documents').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

      const { error: persistError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (persistError) {
        console.error('Avatar persist error:', persistError);
        toastError('Erreur de sauvegarde', "La photo a été téléversée mais n'a pas pu être enregistrée sur votre profil.");
        return;
      }

      toastSuccess('Photo mise à jour', 'Votre avatar a été mis à jour.');
      refreshCurrentUser();
    } catch (err) {
      console.error('Avatar upload error:', err);
      toastError("Erreur d'upload", "Impossible d'enregistrer l'image.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toastError('Numéro de téléphone requis', "Ajoutez un numéro de téléphone pour que l'équipe puisse vous joindre facilement.");
      return;
    }

    setSaving(true);
    setSavedSuccess(false);

    const payload: Record<string, unknown> = {
      full_name: fullName,
      role: role,
      department: department || null,
      avatar_url: avatarUrl,
      username: username || null,
      bio: bio || null,
      location: location || null,
      website: website || null,
      twitter: twitter || null,
      linkedin: linkedin || null,
      github: github || null,
      phone: phone.trim(),
      instagram_url: instagramUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from('profiles').update(payload).eq('id', userId);

    // The `phone`/`instagram_url` migration may not be deployed yet --
    // retry once without those two fields rather than losing the whole
    // save (same pending-migration pattern as addClient/updateClient).
    if (error && (error.message?.includes('phone') || error.message?.includes('instagram_url'))) {
      delete payload.phone;
      delete payload.instagram_url;
      ({ error } = await supabase.from('profiles').update(payload).eq('id', userId));
      if (!error) {
        toastError('Coordonnées non enregistrées', "Le téléphone/Instagram n'est pas encore disponible côté serveur -- réessayez plus tard.");
      }
    }

    setSaving(false);

    if (error) {
      console.error('Profile save error:', error);
      toastError('Erreur de sauvegarde', error.message.includes('duplicate') ? "Ce nom d'utilisateur est déjà pris." : "Impossible d'enregistrer le profil.");
      return;
    }

    setSavedSuccess(true);
    toastSuccess('Profil sauvegardé !');
    refreshCurrentUser();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toastError('Mot de passe trop court', 'Minimum 8 caractères.');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toastError('Erreur', "Impossible de changer le mot de passe.");
      return;
    }
    setNewPassword('');
    toastSuccess('Mot de passe changé', 'Votre mot de passe a été mis à jour.');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Mon Profil
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Gérez votre compte, votre sécurité et vos préférences d&apos;alertes.
          </p>
        </div>

        {savedSuccess && (
          <Badge variant="green" className="animate-mv-fade-up">
            <CheckCircle2 className="w-3.5 h-3.5" /> Modifications sauvegardées
          </Badge>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-mv-border gap-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'info', label: '1. Informations & Rôle', icon: User },
          { id: 'notifications', label: '2. Alertes', icon: Bell },
          { id: 'security', label: '3. Sécurité', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-mv-green text-mv-green bg-mv-surface/60 font-bold'
                  : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Informations & Rôle — édition + aperçu en direct */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-6">
            <Card
              header={
                <div>
                  <h3 className="font-extrabold text-sm text-mv-ink font-display">Informations de base</h3>
                  <p className="text-[11px] text-mv-ink-soft mt-0.5">Vos informations de profil public</p>
                </div>
              }
            >
              <div className="space-y-5 text-xs">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <UserAvatar
                      src={avatarUrl}
                      name={fullName}
                      email={email}
                      size="xl"
                      className="border-2 border-mv-border shadow-mv-sm"
                    />
                    <label
                      title="Changer la photo"
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-mv-ink text-white shadow-mv-md hover:bg-mv-green transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-mv-ink text-sm">Photo de profil</div>
                    <div className="text-[11px] text-mv-ink-soft">JPG, PNG ou GIF. Max 2 Mo.</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jordan Chen"
                      className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5">Nom d&apos;utilisateur</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="jordanchen"
                      className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5">Rôle / Intitulé de poste</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Senior Software Engineer"
                      className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-mv-ink-soft" /> Département
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Tech & IA"
                      className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-mv-ink mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder="Full-stack developer building tools for the modern web. Open source enthusiast and occasional writer about software architecture."
                    className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green resize-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-mv-green" /> Localisation
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Seattle, WA"
                    className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                  />
                </div>
              </div>
            </Card>

            <Card
              header={
                <div>
                  <h3 className="font-extrabold text-sm text-mv-ink font-display">Coordonnées</h3>
                  <p className="text-[11px] text-mv-ink-soft mt-0.5">Pour que l'équipe puisse vous joindre facilement</p>
                </div>
              }
            >
              <div className="space-y-4 text-xs">
                {!phone.trim() && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Un numéro de téléphone est requis pour rester joignable par l'équipe.</span>
                  </div>
                )}
                <div>
                  <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-mv-green" /> Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="514 555-0123"
                    className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
                <div>
                  <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-mv-ink-soft" /> Instagram (optionnel)
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/votre_compte"
                    className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
              </div>
            </Card>

            <Card
              header={
                <div>
                  <h3 className="font-extrabold text-sm text-mv-ink font-display">Liens</h3>
                  <p className="text-[11px] text-mv-ink-soft mt-0.5">Votre site web et vos réseaux sociaux</p>
                </div>
              }
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-mv-ink-soft" /> Site web
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://jordanchen.dev"
                    className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-mv-ink-soft" /> Twitter
                    </label>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="jordanchen"
                      className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-mv-ink-soft" /> LinkedIn
                    </label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="jordanchen"
                      className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-mv-ink-soft" /> GitHub
                    </label>
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="jordanchen"
                      className="w-full p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl border border-mv-border text-xs font-semibold text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <Button type="submit" variant="primary" disabled={saving} icon={<Save className="w-4 h-4" />}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="sticky top-20 space-y-2">
            <div className="rounded-2xl border border-mv-border bg-mv-surface overflow-hidden shadow-mv-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-mv-border bg-mv-cream-soft/60">
                <span className="text-[12px] font-bold text-mv-ink">Aperçu en direct</span>
                <span className="text-[10px] font-bold text-mv-ink-soft bg-mv-surface border border-mv-border px-2 py-0.5 rounded-full">
                  Vue publique
                </span>
              </div>
              <div className="p-6 text-center space-y-3">
                <UserAvatar
                  src={avatarUrl}
                  name={fullName}
                  email={email}
                  size="2xl"
                  className="mx-auto shadow-mv-md"
                />
                <div>
                  <div className="font-extrabold text-mv-ink text-base font-display">{fullName || 'Jordan Chen'}</div>
                  <div className="text-mv-ink-faint text-xs mt-0.5">@{username || 'jordanchen'}</div>
                  <div className="text-mv-ink text-xs font-semibold mt-1">{role || 'Senior Software Engineer'}</div>
                  <div className="flex items-center justify-center gap-1 text-mv-ink-soft text-[11px] mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-mv-ink-faint" />
                    <span>{location || 'Seattle, WA'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-mv-ink-soft leading-relaxed border-t border-mv-border/60 pt-3">
                  {bio || 'Full-stack developer building tools for the modern web. Open source enthusiast and occasional writer about software architecture.'}
                </p>

                <div className="flex items-center justify-center gap-3.5 border-t border-mv-border/60 pt-3 text-mv-ink-soft">
                  <a href={website || '#'} target="_blank" rel="noreferrer" className="hover:text-mv-green transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                  <a href={twitter ? `https://twitter.com/${twitter}` : '#'} target="_blank" rel="noreferrer" className="hover:text-mv-green transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href={linkedin ? `https://linkedin.com/in/${linkedin}` : '#'} target="_blank" rel="noreferrer" className="hover:text-mv-green transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a href={github ? `https://github.com/${github}` : '#'} target="_blank" rel="noreferrer" className="hover:text-mv-green transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-mv-ink-faint">
              Voici comment votre profil apparaît aux autres
            </p>
          </div>
        </form>
      )}

      {/* Tab 2: Préférences d'Alertes — persistées dans notification_preferences */}
      {activeTab === 'notifications' && (
        <div className="max-w-xl space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-mv-ink font-display">Notifications</h2>
            <p className="text-xs text-mv-ink-soft mt-0.5">Gère comment tu reçois les notifications de l&apos;application.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint">Appareil</h3>
            <div className="rounded-xl border border-mv-border divide-y divide-mv-border overflow-hidden bg-mv-surface">
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-bold text-sm text-mv-ink">Notifications push</div>
                  <div className="text-xs text-mv-ink-soft mt-0.5">Alertes web push sur cet appareil (nécessite l&apos;autorisation du navigateur).</div>
                </div>
                <Switch
                  checked={pushEnabled}
                  disabled={!notifPrefsLoaded}
                  onChange={(v) => { setPushEnabled(v); persistNotifPref({ push_enabled: v }); }}
                  label="Notifications push"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint">Projets & tâches</h3>
            <div className="rounded-xl border border-mv-border divide-y divide-mv-border overflow-hidden bg-mv-surface">
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-bold text-sm text-mv-ink">Rappels de tâches en retard</div>
                  <div className="text-xs text-mv-ink-soft mt-0.5">Rappel push quand une tâche assignée dépasse son échéance.</div>
                </div>
                <Switch
                  checked={taskRemindersEnabled}
                  disabled={!notifPrefsLoaded}
                  onChange={(v) => { setTaskRemindersEnabled(v); persistNotifPref({ task_reminders_enabled: v }); }}
                  label="Rappels de tâches en retard"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint">Produit</h3>
            <div className="rounded-xl border border-mv-border divide-y divide-mv-border overflow-hidden bg-mv-surface">
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-bold text-sm text-mv-ink">Nouveautés (changelog)</div>
                  <div className="text-xs text-mv-ink-soft mt-0.5">Être averti quand une nouvelle entrée est publiée dans /changelog.</div>
                </div>
                <Switch
                  checked={changelogAnnouncementsEnabled}
                  disabled={!notifPrefsLoaded}
                  onChange={(v) => { setChangelogAnnouncementsEnabled(v); persistNotifPref({ changelog_announcements_enabled: v }); }}
                  label="Nouveautés (changelog)"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sécurité */}
      {activeTab === 'security' && (
        <Card
          header={
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Changer le mot de passe
            </h3>
          }
        >
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-sm">
            <div>
              <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-mv-green" /> Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-mono focus:outline-none focus:border-mv-green"
              />
              <p className="text-[11px] text-mv-ink-faint mt-1">Minimum 8 caractères.</p>
            </div>
            <Button type="submit" variant="primary" disabled={changingPassword} icon={<Save className="w-4 h-4" />}>
              {changingPassword ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
