'use client';

import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Copy,
  Check,
  Building2,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface ReachSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

const SAMPLE_REACH_DATA = [
  {
    reach_id: 'reach-mtl-01',
    company_name: 'Bistro Le Petit Rosemont',
    contact_name: 'Marc-André Tremblay',
    phone: '+1 514-555-0142',
    email: 'contact@bistropetitrosemont.ca',
    neighbourhood: 'Rosemont - La Petite-Patrie',
    service_requested: 'Minerva Flow & Imprimante Cuisine',
    notes: 'Perd 25-30% sur Uber Eats. Menu actuel au format PDF sur Facebook sans commande en ligne directe.',
    rating: 4.6,
    reviews_count: 142,
  },
  {
    reach_id: 'reach-mtl-02',
    company_name: 'Pizzeria Napoletana Mile-End',
    contact_name: 'Matteo Rossi',
    phone: '+1 514-555-0189',
    email: 'info@pizzerianapoletana-mtl.com',
    neighbourhood: 'Mile End',
    service_requested: 'Minerva Flow Commande Directe 0%',
    notes: 'Volume de commandes à emporter très élevé (80+ pizzas/jour). Propriétaire furieux des frais Doordash.',
    rating: 4.7,
    reviews_count: 310,
  },
  {
    reach_id: 'reach-mtl-03',
    company_name: 'Le Diplomate Café & Bakery',
    contact_name: 'Sophie Lemoine',
    phone: '+1 514-555-0163',
    email: 'sophie@lediplomatecafe.com',
    neighbourhood: 'Plateau-Mont-Royal',
    service_requested: 'Site Web Framer & QR Code Flow',
    notes: 'Clientèle de quartier fidèle. Recherche un QR code sur table pour commande express de cafés.',
    rating: 4.8,
    reviews_count: 220,
  },
  {
    reach_id: 'reach-mtl-04',
    company_name: 'Tacos Chingon Saint-Laurent',
    contact_name: 'Carlos Mendez',
    phone: '+1 514-555-0177',
    email: 'carlos@tacoschingon.ca',
    neighbourhood: 'Boulevard Saint-Laurent',
    service_requested: 'Minerva Flow & Acquisition Ads',
    notes: 'Restauration rapide haut débit. Besoin d\'impression automatique de tickets en cuisine aux heures de pointe.',
    rating: 4.5,
    reviews_count: 185,
  },
];

export function ReachSyncModal({ isOpen, onClose, onSyncComplete }: ReachSyncModalProps) {
  const { toastSuccess, toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'direct' | 'import'>('direct');
  const [isSyncing, setIsSyncing] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [lastSyncStats, setLastSyncStats] = useState<{ created: number; updated: number } | null>(null);

  if (!isOpen) return null;

  const handleCopyWebhookUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/api/leads/reach-sync`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_REACH_DATA, null, 2));
  };

  const handleSyncSubmit = async (dataToSync: any[]) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/leads/reach-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: dataToSync }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Échec de la synchronisation');
      }

      setLastSyncStats({ created: data.created, updated: data.updated });
      toastSuccess(
        'Synchronisation réussie !',
        `${data.created} nouveau(x) lead(s) créé(s), ${data.updated} mis à jour.`
      );
      onSyncComplete();
    } catch (err: any) {
      toastError('Erreur de synchronisation', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportJson = () => {
    if (!jsonInput.trim()) {
      toastError('Données manquantes', 'Veuillez coller un tableau JSON de prospects.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const leads = Array.isArray(parsed) ? parsed : [parsed];
      handleSyncSubmit(leads);
    } catch (e: any) {
      toastError('Format JSON invalide', 'Vérifiez la syntaxe JSON de votre saisie.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-mv-border flex items-center justify-between bg-mv-cream-soft/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mv-green/10 border border-mv-green/20 flex items-center justify-center text-mv-green">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-mv-ink flex items-center gap-2">
                Passerelle Minerva Reach & Prospection
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-mv-green/15 text-mv-green font-mono">
                  Sync v2.20
                </span>
              </h2>
              <p className="text-xs text-mv-ink-soft">
                Synchronisez les fiches commerces depuis l'application mobile/desktop Minerva Reach
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mv-ink-faint hover:text-mv-ink hover:bg-mv-cream-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-mv-border bg-mv-surface px-6 pt-2">
          <button
            onClick={() => setActiveTab('direct')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'direct'
                ? 'border-mv-green text-mv-green'
                : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
            }`}
          >
            Synchronisation en Direct
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-mv-green text-mv-green'
                : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
            }`}
          >
            Import Express (JSON)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'direct' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-mv-cream-soft/60 border border-mv-border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mv-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mv-green"></span>
                    </span>
                    <span className="text-xs font-bold text-mv-ink">Instance Minerva Reach Connectée</span>
                  </div>
                  <a
                    href="https://minerva-os-lite-desktop.vercel.app/today"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1"
                  >
                    Ouvrir Minerva Reach (/today) <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-mv-ink-soft leading-relaxed">
                  L'application Minerva Reach qualifie les restaurants sur le terrain et peut envoyer directement les fiches vers cette instance Trequartista.
                </p>

                {/* Webhook Endpoint */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider mb-1">
                    URL du Webhook de Réception Trequartista
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 text-xs bg-white border border-mv-border rounded-lg font-mono text-mv-ink select-all truncate">
                      https://minerva-trequartista.vercel.app/api/leads/reach-sync
                    </code>
                    <button
                      onClick={handleCopyWebhookUrl}
                      className="px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink hover:bg-mv-border/30 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-mv-green" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button: Sync Batch from Sample or Direct Trigger */}
              <div className="p-4 rounded-xl border border-mv-border/80 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-mv-ink">Synchroniser un lot de qualification Montréal</h3>
                    <p className="text-[11px] text-mv-ink-soft">
                      Injecte instantanément les 4 fiches de prospection récentes de Minerva Reach (Rosemont, Mile End, Plateau).
                    </p>
                  </div>
                  <button
                    onClick={() => handleSyncSubmit(SAMPLE_REACH_DATA)}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Synchronisation…' : 'Synchroniser le lot'}</span>
                  </button>
                </div>
              </div>

              {lastSyncStats && (
                <div className="p-3.5 rounded-xl bg-mv-green/10 border border-mv-green/20 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-mv-green shrink-0" />
                  <p className="text-xs text-mv-green-dark font-medium">
                    Dernière synchronisation réussie : <strong>{lastSyncStats.created}</strong> créés, <strong>{lastSyncStats.updated}</strong> mis à jour.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-mv-ink">Coller un tableau JSON de prospects</label>
                <button
                  onClick={handleLoadSample}
                  type="button"
                  className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Charger un exemple
                </button>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[\n  {\n    "company_name": "Restaurant Exemple",\n    "contact_name": "Jean Tremblay",\n    "phone": "+1 514-555-0100",\n    "service_requested": "Minerva Flow"\n  }\n]'
                rows={9}
                className="w-full p-3.5 text-xs font-mono bg-mv-cream-soft/70 border border-mv-border rounded-xl text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJsonInput('')}
                  className="px-3.5 py-2 text-xs font-semibold text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  disabled={isSyncing || !jsonInput.trim()}
                  className="px-4 py-2 rounded-xl bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Importation…' : 'Importer les prospects'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-mv-border bg-mv-cream-soft/40 flex items-center justify-between">
          <span className="text-[11px] text-mv-ink-faint font-mono">
            Déduplication automatique par reach_id et nom de restaurant
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-mv-border text-xs font-semibold text-mv-ink hover:bg-mv-surface transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
