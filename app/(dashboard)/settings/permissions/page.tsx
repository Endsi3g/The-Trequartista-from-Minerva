'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';
import { fetchAppPermissions, setAppPermission } from '@/lib/services/supabase-data';
import { PERMISSION_CATALOG } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

export default function PermissionsSettingsPage() {
  const { role: currentUserRole, loading: userLoading } = useCurrentUser();
  const { refresh: refreshGlobalPermissions } = useAppPermissions();
  const { toastSuccess, toastError } = useToast();

  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setPermissions(await fetchAppPermissions());
      setLoading(false);
    })();
  }, []);

  const handleToggle = async (key: string, next: boolean) => {
    setSavingKey(key);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSavingKey(null);
      return;
    }
    const ok = await setAppPermission(key, next, user.id);
    setSavingKey(null);
    if (ok) {
      setPermissions((prev) => ({ ...prev, [key]: next }));
      refreshGlobalPermissions();
      toastSuccess(next ? 'Autorisation accordée' : 'Autorisation retirée');
    } else {
      toastError('Erreur', "Impossible d'enregistrer. La migration app_permissions est peut-être encore en attente de déploiement.");
    }
  };

  if (!userLoading && currentUserRole !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">Retour à l&apos;aperçu</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link href="/overview" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l&apos;aperçu
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Permissions</h1>
        <p className="text-sm text-mv-ink-soft mt-1">
          Ce que les membres (non-admin) peuvent faire, en plus de ce qu&apos;ils peuvent déjà faire par défaut. Les administrateurs ont toujours accès complet ; les clients ne voient jamais ces écrans.
        </p>
      </div>

      <Card>
        {loading ? (
          <div className="py-8 text-center text-xs text-mv-ink-soft">Chargement…</div>
        ) : (
          <div className="divide-y divide-mv-border">
            {PERMISSION_CATALOG.map((perm) => {
              const allowed = permissions[perm.key] === true;
              return (
                <div key={perm.key} className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-mv-ink">{perm.label}</div>
                    <p className="text-xs text-mv-ink-soft mt-0.5">{perm.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(perm.key, !allowed)}
                    disabled={savingKey === perm.key}
                    role="switch"
                    aria-checked={allowed}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                      allowed ? 'bg-mv-green' : 'bg-mv-border'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-mv-sm transition-transform ${
                        allowed ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-mv-cream-soft border border-mv-border text-xs text-mv-ink-soft">
        <ShieldCheck className="w-4 h-4 text-mv-green shrink-0 mt-0.5" />
        <p>
          Ces autorisations sont appliquées à la fois dans l&apos;interface et côté base de données (RLS) — un membre sans
          l&apos;autorisation ne peut pas contourner la restriction en appelant l&apos;API directement.
        </p>
      </div>

      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-mv-cream-soft border border-mv-border text-xs text-mv-ink-soft">
        <Users className="w-4 h-4 text-mv-ink-faint shrink-0 mt-0.5" />
        <p>
          La suppression de clients et de projets n&apos;existe pas encore ailleurs dans l&apos;app — ces bascules
          n&apos;apparaîtront ici qu&apos;une fois ces fonctionnalités construites.
        </p>
      </div>
    </div>
  );
}
