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
  MapPin,
  Building,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

export default function ProfilePage() {
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

  // Load real user from Supabase on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          setEmail(user.email || '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, department, avatar_url, username, bio, location, website, twitter, linkedin, github')
            .eq('id', user.id)
            .single();
          if (profile) {
            setFullName(profile.full_name || user.user_metadata?.full_name || '');
            setRole(profile.role || 'member');
            setDepartment(profile.department || '');
            setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || user.email || 'MV')}&backgroundColor=1E4B33&fontColor=ffffff`);
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setLocation(profile.location || '');
            setWebsite(profile.website || '');
            setTwitter(profile.twitter || '');
            setLinkedin(profile.linkedin || '');
            setGithub(profile.github || '');
          } else {
            setFullName(user.user_metadata?.full_name || '');
            setAvatarUrl(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'MV')}&backgroundColor=1E4B33&fontColor=ffffff`);
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
    } catch (err) {
      console.error('Avatar upload error:', err);
      toastError("Erreur d'upload", "Impossible d'enregistrer l'image.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const { error } = await supabase.from('profiles').update({
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
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    setSaving(false);

    if (error) {
      console.error('Profile save error:', error);
      toastError('Erreur de sauvegarde', error.message.includes('duplicate') ? "Ce nom d'utilisateur est déjà pris." : "Impossible d'enregistrer le profil.");
      return;
    }

    setSavedSuccess(true);
    toastSuccess('Profil sauvegardé !');
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
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-6">
            <Card
              header={
                <div>
                  <h3 className="font-extrabold text-sm text-mv-ink">Informations de base</h3>
                  <p className="text-[11px] text-mv-ink-soft mt-0.5">Votre profil public interne</p>
                </div>
              }
            >
              <div className="space-y-5 text-xs">
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-mv-green shadow-mv-sm shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="font-bold text-mv-ink">Photo de profil</div>
                    <div className="text-[11px] text-mv-ink-soft">JPG, PNG ou GIF. Max 2 Mo.</div>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border text-mv-green font-bold cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" /> Changer la photo
                      <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5">Nom d&apos;utilisateur</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="jordanchen"
                      className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-mv-ink mb-1.5">Fonction / Intitulé de poste</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
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
                      className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
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
                    placeholder="Quelques mots sur toi…"
                    className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green resize-none"
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
                    placeholder="Montréal, QC"
                    className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                  />
                </div>

                <div>
                  <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-mv-green" /> Courriel professionnel
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-mono font-semibold focus:outline-none focus:border-mv-green"
                  />
                </div>
              </div>
            </Card>

            <Card
              header={
                <div>
                  <h3 className="font-extrabold text-sm text-mv-ink">Liens</h3>
                  <p className="text-[11px] text-mv-ink-soft mt-0.5">Ton site et tes réseaux</p>
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
                    placeholder="https://…"
                    className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
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
                      className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
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
                      className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
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
                      className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={saving} icon={<Save className="w-4 h-4" />}>
                {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="sticky top-20 space-y-2">
            <div className="rounded-2xl border border-mv-border bg-mv-surface overflow-hidden shadow-mv-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-mv-border bg-mv-cream-soft">
                <span className="text-[11px] font-bold text-mv-ink uppercase tracking-wider">Aperçu en direct</span>
                <span className="text-[10px] text-mv-ink-faint">Vue publique</span>
              </div>
              <div className="p-6 text-center space-y-3">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-mv-border"
                />
                <div>
                  <div className="font-extrabold text-mv-ink text-base font-display">{fullName || 'Ton nom'}</div>
                  {username && <div className="text-mv-ink-faint text-xs">@{username}</div>}
                  {role && <div className="text-mv-ink text-xs font-semibold mt-0.5">{role}</div>}
                  {location && (
                    <div className="flex items-center justify-center gap-1 text-mv-ink-soft text-[11px] mt-1">
                      <MapPin className="w-3 h-3" /> {location}
                    </div>
                  )}
                </div>
                {bio && (
                  <p className="text-[11px] text-mv-ink-soft border-t border-mv-border pt-3">{bio}</p>
                )}
                {(website || twitter || linkedin || github) && (
                  <div className="flex items-center justify-center gap-3 border-t border-mv-border pt-3">
                    {website && (
                      <a href={website} target="_blank" rel="noreferrer" className="text-mv-ink-soft hover:text-mv-green">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {twitter && (
                      <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noreferrer" className="text-mv-ink-soft hover:text-mv-green">
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {linkedin && (
                      <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="text-mv-ink-soft hover:text-mv-green">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {github && (
                      <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="text-mv-ink-soft hover:text-mv-green">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-[10px] text-mv-ink-faint">Aperçu de ton profil tel qu&apos;il apparaît aux autres</p>
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
