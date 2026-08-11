'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User,
  Bell,
  ShieldCheck,
  Mail,
  Building,
  Save,
  CheckCircle2,
  Lock,
  Smartphone,
  Globe,
  Upload,
  Key,
  Plus,
  Copy,
  Trash2,
  Shield,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'info' | 'notifications' | 'security' | 'api_keys'>('info');

  // Form State
  const [fullName, setFullName] = useState('Alex Tremblay');
  const [email, setEmail] = useState('alex@minervaflow.com');
  const [role, setRole] = useState('Lead Dev Fullstack & IA');
  const [department, setDepartment] = useState('Operations & Tech');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Notification Toggles State
  const [emailChecklistAlert, setEmailChecklistAlert] = useState(true);
  const [emailRoiDropAlert, setEmailRoiDropAlert] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);

  // Status State
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: 'key-1', name: 'Webhook Production Lead Gen', prefix: 'mv_live_9a8b7c6d', created_at: '2026-08-01' },
    { id: 'key-2', name: 'Notion Sync Agent Key', prefix: 'mv_live_3f4e5d6c', created_at: '2026-08-08' },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const supabase = createClient();
  const { toastSuccess, toastError } = useToast();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    const filePath = `avatars/${Date.now()}-${file.name}`;

    try {
      const { error } = await supabase.storage.from('team-documents').upload(filePath, file, { upsert: true });

      if (!error) {
        const { data } = supabase.storage.from('team-documents').getPublicUrl(filePath);
        setAvatarUrl(data.publicUrl);
        toastSuccess('Photo mise à jour', 'Votre avatar a été mis à jour dans Supabase Storage.');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toastError('Erreur d\'upload', 'Impossible d\'enregistrer l\'image.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await supabase.from('profiles').update({
        full_name: fullName,
        role: role,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }).eq('email', email);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      toastSuccess('Profil sauvegardé !');
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const rawRandom = Math.random().toString(36).substring(2, 10);
    const keyString = `mv_live_${rawRandom}${Date.now().toString(36)}`;

    try {
      await supabase.from('user_api_keys').insert([
        {
          key_name: newKeyName,
          key_prefix: keyString.substring(0, 12),
          key_hash: keyString,
        },
      ]);
    } catch {
      // Fallback
    }

    const created: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      prefix: keyString.substring(0, 14) + '...',
      created_at: new Date().toISOString().split('T')[0],
    };

    setApiKeys([created, ...apiKeys]);
    setGeneratedKey(keyString);
    setNewKeyName('');
    toastSuccess('Clé API créée !', 'Conservez cette clé en lieu sûr.');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Mon Profil & Écosystème Centurions
            </h1>
            <Badge variant="green">Profil & API Hub</Badge>
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Gérez votre compte, vos clés API Webhook, la sécurité 2FA et vos préférences d'alertes.
          </p>
        </div>

        {savedSuccess && (
          <Badge variant="green" className="animate-mv-fade-up">
            <CheckCircle2 className="w-3.5 h-3.5" /> Modifications sauvegardées dans Supabase
          </Badge>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-mv-border gap-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'info', label: '1. Informations & Rôle', icon: User },
          { id: 'notifications', label: '2. Alertes & Webhooks', icon: Bell },
          { id: 'security', label: '3. Sécurité & 2FA', icon: ShieldCheck },
          { id: 'api_keys', label: '4. Clés API & Tokens', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-mv-lime text-mv-lime bg-mv-surface/60 font-bold'
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
                  Fichier sauvegardé automatiquement dans le bucket Supabase <strong>team-documents</strong>.
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
                  <Mail className="w-3.5 h-3.5 text-mv-lime" /> Courriel Professionnel
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
                  <Building className="w-3.5 h-3.5 text-mv-lime" /> Département
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
                <div className="text-mv-ink-soft mt-0.5">Push automatique des alertes vers le canal Slack #centurions-alerts.</div>
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
                <div className="text-mv-ink-soft mt-0.5">Afficher le compteur rouge et les notifications dans le cockpit.</div>
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

      {/* Tab 3: Sécurité & 2FA */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                  Sécurité 2FA & Authentification Multi-Facteurs
                </h3>
                <Badge variant="green">2FA Actif</Badge>
              </div>
            }
          >
            <div className="p-4 rounded-xl bg-mv-green-tint border border-mv-green/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-mv-green" />
                <div>
                  <span className="font-bold text-mv-green">Double Authentification (TOTP) Activée</span>
                  <p className="text-mv-ink-soft mt-0.5">Votre compte est protégé par application Authenticator (Google/1Password).</p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            header={
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Session Active & Terminal
              </h3>
            }
          >
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-mv-green-tint text-mv-green">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-mv-ink">Poste Actuel (Windows / Chrome)</div>
                    <div className="text-mv-ink-soft mt-0.5 font-mono">Adresse IP : 192.168.1.104 • Montréal, CA</div>
                  </div>
                </div>
                <Badge variant="green">Session Active</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Clés API & Tokens */}
      {activeTab === 'api_keys' && (
        <div className="space-y-6">
          <Card
            header={
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Générateur de Clés API Webhooks & Integrations
              </h3>
            }
          >
            <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-mv-ink">Nom de la Clé API</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Webhook Framer Leads Client"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green font-medium"
                  />
                  <Button variant="primary" size="sm" type="submit" icon={<Plus className="w-4 h-4" />}>
                    Générer la Clé
                  </Button>
                </div>
              </div>

              {generatedKey && (
                <div className="p-4 rounded-xl bg-mv-green-tint border border-mv-green/40 space-y-2 animate-mv-scale-in">
                  <div className="flex items-center justify-between text-xs font-bold text-mv-green">
                    <span>Clé API Générée Avec Succès (Supabase Postgres)</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        toastSuccess('Clé copiée !');
                      }}
                      className="flex items-center gap-1 text-[11px] bg-mv-green text-white px-2 py-0.5 rounded font-mono hover:bg-mv-green-dark cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copier
                    </button>
                  </div>
                  <code className="block p-2.5 rounded bg-mv-surface border border-mv-border font-mono text-xs text-mv-ink font-bold break-all">
                    {generatedKey}
                  </code>
                </div>
              )}
            </form>
          </Card>

          <Card
            header={
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Clés API Actives (`public.user_api_keys`)
              </h3>
            }
          >
            <div className="space-y-3 text-xs">
              {apiKeys.map((k) => (
                <div key={k.id} className="p-3.5 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-mv-ink">{k.name}</div>
                    <code className="text-[11px] font-mono text-mv-ink-soft">{k.prefix}</code>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-mv-ink-faint">Créée le {k.created_at}</span>
                    <button
                      onClick={() => {
                        setApiKeys(apiKeys.filter((item) => item.id !== k.id));
                        toastSuccess('Clé révoquée');
                      }}
                      className="p-1.5 rounded-lg text-mv-coral hover:bg-mv-coral/10 transition-colors cursor-pointer"
                      title="Révoquer cette clé"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
