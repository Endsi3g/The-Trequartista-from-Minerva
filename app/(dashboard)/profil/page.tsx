'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Bell,
  ShieldCheck,
  Mail,
  Building,
  Save,
  CheckCircle2,
  Upload,
  Lock,
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

  // Load real user from Supabase on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          setEmail(user.email || '');
          // Try to load from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, department, avatar_url')
            .eq('id', user.id)
            .single();
          if (profile) {
            setFullName(profile.full_name || user.user_metadata?.full_name || '');
            setRole(profile.role || 'member');
            setDepartment(profile.department || '');
            setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || user.email || 'MV')}`);
          } else {
            // Fallback: use auth metadata
            setFullName(user.user_metadata?.full_name || '');
            setAvatarUrl(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'MV')}`);
          }
        }
      } catch {}
    }
    loadUser();
  }, []);


  // Notification Toggles State
  const [emailChecklistAlert, setEmailChecklistAlert] = useState(true);
  const [emailRoiDropAlert, setEmailRoiDropAlert] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);

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

      // Persist immediately -- don't leave the new photo stranded in local
      // state waiting on a separate "Enregistrer le Profil" click.
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
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    setSaving(false);

    if (error) {
      console.error('Profile save error:', error);
      toastError('Erreur de sauvegarde', "Impossible d'enregistrer le profil.");
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
            Gérez votre compte, votre sécurité et vos préférences d'alertes.
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
                  ? 'border-mv-warm text-mv-warm bg-mv-surface/60 font-bold'
                  : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Informations & Rôle */}
      {activeTab === 'info' && (
        <Card
          header={
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Fiche Collaborateur Minerva
            </h3>
          }
        >
          <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6 p-4 rounded-xl bg-mv-cream-soft border border-mv-border">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-mv-green shadow-mv-sm"
              />
              <div className="space-y-2">
                <div className="font-bold text-mv-ink">Photo de Profil Collaborateur</div>
                <div className="text-[11px] text-mv-ink-soft">
                  Fichier sauvegardé automatiquement dans le bucket <strong>team-documents</strong>.
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mv-surface hover:bg-mv-green-tint border border-mv-border text-mv-green font-bold cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" /> Changer la photo
                  <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-mv-green" /> Nom Complet
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                />
              </div>

              <div>
                <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-mv-warm" /> Courriel Professionnel
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-mono font-semibold focus:outline-none focus:border-mv-green"
                />
              </div>

              <div>
                <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-mv-green" /> Fonction / Intitulé de Poste
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                />
              </div>

              <div>
                <label className="block font-bold text-mv-ink mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-mv-warm" /> Département
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink font-semibold focus:outline-none focus:border-mv-green"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-mv-border flex justify-end">
              <Button type="submit" variant="primary" disabled={saving} icon={<Save className="w-4 h-4" />}>
                {saving ? 'Enregistrement...' : 'Enregistrer le Profil'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Préférences d'Alertes */}
      {activeTab === 'notifications' && (
        <Card
          header={
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Canaux & Seuils de Notifications
            </h3>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-mv-cream-soft border border-mv-border">
              <div>
                <div className="font-bold text-mv-ink">Alertes Email — Checklists Bloquées</div>
                <div className="text-mv-ink-soft mt-0.5">Recevoir un courriel si une checklist 20-points reste inactive {'>'} 48h.</div>
              </div>
              <input
                type="checkbox"
                checked={emailChecklistAlert}
                onChange={(e) => setEmailChecklistAlert(e.target.checked)}
                className="w-5 h-5 accent-mv-green cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-mv-cream-soft border border-mv-border">
              <div>
                <div className="font-bold text-mv-ink">Alertes Email — Chute du ROI Client</div>
                <div className="text-mv-ink-soft mt-0.5">Notification prioritaire si le ROI d'un client descend sous 4.0x.</div>
              </div>
              <input
                type="checkbox"
                checked={emailRoiDropAlert}
                onChange={(e) => setEmailRoiDropAlert(e.target.checked)}
                className="w-5 h-5 accent-mv-green cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-mv-cream-soft border border-mv-border">
              <div>
                <div className="font-bold text-mv-ink">Intégration Slack Webhook</div>
                <div className="text-mv-ink-soft mt-0.5">Push automatique des alertes vers le canal Slack #minerva-alertes.</div>
              </div>
              <input
                type="checkbox"
                checked={slackAlerts}
                onChange={(e) => setSlackAlerts(e.target.checked)}
                className="w-5 h-5 accent-mv-green cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-mv-cream-soft border border-mv-border">
              <div>
                <div className="font-bold text-mv-ink">Tiroir In-App (Topbar)</div>
                <div className="text-mv-ink-soft mt-0.5">Afficher le compteur rouge et les notifications dans l'application.</div>
              </div>
              <input
                type="checkbox"
                checked={inAppAlerts}
                onChange={(e) => setInAppAlerts(e.target.checked)}
                className="w-5 h-5 accent-mv-green cursor-pointer"
              />
            </div>
          </div>
        </Card>
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
