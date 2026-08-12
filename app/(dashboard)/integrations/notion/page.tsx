'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Link2,
  Link2Off,
  BookOpen,
  Database,
  FileText,
} from 'lucide-react';
import type { NotionPage } from '@/lib/types';

type ConnectionState = 'idle' | 'testing' | 'success' | 'error';

interface NotionTestResult {
  valid: boolean;
  workspaceName?: string;
  workspaceIcon?: string;
  user?: string;
  pages: NotionPage[];
  error?: string;
}

function NotionIcon({ size = 24 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
      alt="Notion"
      width={size}
      height={size}
      className="rounded-md"
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

function PageTypeIcon({ parentType }: { parentType: NotionPage['parent_type'] }) {
  if (parentType === 'database_id') return <Database className="w-3.5 h-3.5 text-mv-ink-faint" />;
  return <FileText className="w-3.5 h-3.5 text-mv-ink-faint" />;
}

export default function NotionIntegrationPage() {
  const [token, setToken] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [result, setResult] = useState<NotionTestResult | null>(null);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load existing config from Supabase
  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('notion_config')
          .select('linked_page_ids')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.linked_page_ids) {
          setSelectedPages(data.linked_page_ids);
        }
      } catch {}
    })();
  }, []);

  const handleTest = async () => {
    if (!token.trim()) return;
    setConnectionState('testing');
    setResult(null);

    try {
      const res = await fetch('/api/integrations/notion/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data: NotionTestResult = await res.json();
      setResult(data);
      setConnectionState(data.valid ? 'success' : 'error');
    } catch {
      setResult({ valid: false, pages: [], error: 'Erreur réseau. Vérifiez votre connexion.' });
      setConnectionState('error');
    }
  };

  const togglePage = (pageId: string) => {
    setSelectedPages((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    );
  };

  const handleSave = async () => {
    if (!result?.valid || selectedPages.length === 0) return;
    setIsSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // integration_token_hash is NOT NULL — store a hash, never the raw
      // token, and never send the raw token itself in this payload.
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token.trim()));
      const tokenHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');

      await supabase.from('notion_config').upsert({
        user_id: user.id,
        integration_token_hash: tokenHash,
        workspace_name: result.workspaceName ?? 'Notion',
        workspace_icon: result.workspaceIcon,
        linked_page_ids: selectedPages,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back navigation */}
      <Link
        href="/integrations"
        className="inline-flex items-center gap-1.5 text-sm text-mv-ink-soft hover:text-mv-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux intégrations
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-center">
          <NotionIcon size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-mv-ink">Connecter Notion & Service MCP</h1>
          <p className="text-sm text-mv-ink-soft">
            Liez vos pages Notion et le serveur MCP à Minerva Trequartista.
          </p>
        </div>
      </div>

      {/* Notion MCP Server Card */}
      <div className="p-4 rounded-xl bg-mv-green-tint border border-mv-green/40 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-mv-green">
          <span>Serveur Notion MCP : https://mcp.notion.com/mcp</span>
          <span className="px-2 py-0.5 rounded bg-mv-green text-white text-[10px]">MCP Connected</span>
        </div>
        <p className="text-xs text-mv-ink-soft">
          Permet la synchronisation bidirectionnelle entre les bases Notion et les SOPs, Projets et Reels Minerva.
        </p>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border space-y-3">

        <h2 className="text-sm font-bold text-mv-ink flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-mv-green" />
          Comment obtenir votre Integration Token
        </h2>
        <ol className="space-y-2 text-xs text-mv-ink-soft list-decimal list-inside leading-relaxed">
          <li>Allez sur <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-mv-green underline underline-offset-2 hover:text-mv-green-dark">notion.so/my-integrations</a></li>
          <li>Cliquez <strong>+ New integration</strong>, nommez-la "Minerva Trequartista"</li>
          <li>Copiez le <strong>Internal Integration Token</strong> (commence par <code className="bg-mv-border px-1 rounded font-mono">secret_</code>)</li>
          <li>Dans vos pages Notion, cliquez <strong>...</strong> → <strong>Connections</strong> → ajoutez "Minerva Trequartista"</li>
        </ol>
      </div>

      {/* Token Input */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-mv-ink">Integration Token</span>
          <div className="mt-1.5 flex gap-2">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-mv-surface border border-mv-border text-mv-ink placeholder:text-mv-ink-mute focus:outline-none focus:border-mv-green focus:ring-1 focus:ring-mv-green/30 transition-all font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            />
            <button
              onClick={handleTest}
              disabled={!token.trim() || connectionState === 'testing'}
              className="px-4 py-2 rounded-lg bg-mv-green text-white text-sm font-semibold hover:bg-mv-green-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {connectionState === 'testing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Tester
            </button>
          </div>
        </label>
      </div>

      {/* Test Result */}
      {connectionState === 'success' && result && (
        <div className="p-4 rounded-xl bg-mv-green-tint border border-mv-green/30 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-mv-green" />
            <span className="text-sm font-semibold text-mv-green">Connexion réussie</span>
          </div>
          {result.workspaceName && (
            <p className="text-xs text-mv-green/70 ml-6">Workspace : <strong>{result.workspaceName}</strong></p>
          )}
          {result.user && (
            <p className="text-xs text-mv-green/70 ml-6">Connecté en tant que : <strong>{result.user}</strong></p>
          )}
        </div>
      )}

      {connectionState === 'error' && result && (
        <div className="p-4 rounded-xl bg-mv-red-bg border border-mv-red/30 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-mv-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-mv-red">Token invalide ou accès refusé</p>
            {result.error && <p className="text-xs text-mv-red/70 mt-0.5">{result.error}</p>}
          </div>
        </div>
      )}

      {/* Pages Selector */}
      {result?.valid && result.pages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-mv-ink">
              Pages accessibles ({result.pages.length})
            </h2>
            <span className="text-xs text-mv-ink-soft">
              {selectedPages.length} sélectionnée{selectedPages.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto rounded-xl border border-mv-border divide-y divide-mv-border-soft">
            {result.pages.map((page) => {
              const isSelected = selectedPages.includes(page.id);
              return (
                <button
                  key={page.id}
                  onClick={() => togglePage(page.id)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'bg-mv-green-tint'
                      : 'bg-mv-surface hover:bg-mv-cream-soft',
                  ].join(' ')}
                >
                  {/* Page icon */}
                  <span className="text-base shrink-0 w-5 text-center">
                    {page.icon?.type === 'emoji' ? page.icon.emoji : '📄'}
                  </span>

                  {/* Title & type */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mv-ink truncate">{page.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <PageTypeIcon parentType={page.parent_type} />
                      <span className="text-[11px] text-mv-ink-faint capitalize">{page.parent_type.replace('_id', '')}</span>
                    </div>
                  </div>

                  {/* Link status */}
                  {isSelected
                    ? <Link2 className="w-4 h-4 text-mv-green shrink-0" />
                    : <Link2Off className="w-4 h-4 text-mv-ink-mute shrink-0" />
                  }
                </button>
              );
            })}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={selectedPages.length === 0 || isSaving}
            className="w-full py-2.5 rounded-xl bg-mv-green text-white text-sm font-bold hover:bg-mv-green-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {savedSuccess
              ? '✓ Pages enregistrées !'
              : `Enregistrer ${selectedPages.length} page${selectedPages.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}

      {result?.valid && result.pages.length === 0 && (
        <div className="p-4 rounded-xl bg-mv-amber-bg border border-mv-amber/30 text-sm text-mv-amber">
          Aucune page accessible. Assurez-vous d'avoir ajouté l'intégration à vos pages Notion (clic droit → Connections).
        </div>
      )}

      {/* Docs link */}
      <a
        href="https://www.notion.so/help/create-integrations-with-the-notion-api"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-mv-ink-soft hover:text-mv-green transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Documentation Notion API
      </a>
    </div>
  );
}
