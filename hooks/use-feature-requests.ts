'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  fetchFeatureRequests,
  createFeatureRequest,
  updateFeatureRequestStatus,
  deleteFeatureRequest,
} from '@/lib/services/supabase-data';
import type { FeatureRequest, FeatureRequestStatus } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';

const STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  submitted: 'Soumise',
  under_review: 'En revue',
  planned: 'Planifié',
  in_progress: 'En développement',
  in_development: 'En développement',
  testing: 'En test & QA',
  in_qa: 'En recette QA',
  delivered: 'Livré',
  declined: 'Refusé',
};

export function useFeatureRequests(clientId?: string) {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { toastSuccess, toastInfo, toastError } = useToast();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const data = await fetchFeatureRequests(clientId);
    setRequests(data);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ── Supabase Realtime Subscription ─────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-feature-requests-${clientId || 'all'}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_requests',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new as FeatureRequest;
            setRequests((prev) => {
              if (prev.some((r) => r.id === newReq.id)) return prev;
              return [newReq, ...prev];
            });
            toastInfo(
              'Nouvelle demande enregistrée',
              `"${newReq.title}" a été ajoutée avec succès.`
            );
          } else if (payload.eventType === 'UPDATE') {
            const updatedReq = payload.new as FeatureRequest;
            setRequests((prev) =>
              prev.map((r) => {
                if (r.id === updatedReq.id) {
                  // If status changed, notify user in real time
                  if (r.status !== updatedReq.status) {
                    const statusName = STATUS_LABELS[updatedReq.status] || updatedReq.status;
                    if (updatedReq.status === 'delivered') {
                      toastSuccess(
                        '🎉 Fonctionnalité livrée !',
                        `Votre demande "${updatedReq.title}" est désormais en production.`
                      );
                    } else {
                      toastInfo(
                        'Mise à jour en direct',
                        `La demande "${updatedReq.title}" est passée à "${statusName}".`
                      );
                    }
                  }
                  return { ...r, ...updatedReq };
                }
                return r;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id;
            if (oldId) {
              setRequests((prev) => prev.filter((r) => r.id !== oldId));
            }
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, toastInfo, toastSuccess]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const submitRequest = async (
    data: Omit<FeatureRequest, 'id' | 'created_at' | 'updated_at'>
  ): Promise<FeatureRequest | null> => {
    try {
      const created = await createFeatureRequest(data);
      if (created) {
        setRequests((prev) => {
          if (prev.some((r) => r.id === created.id)) return prev;
          return [created, ...prev];
        });
        toastSuccess('Demande transmise', `"${created.title}" a été envoyée à l'équipe technique.`);
        return created;
      }
      toastError('Erreur', 'Impossible de soumettre la demande.');
      return null;
    } catch {
      toastError('Erreur', 'Une erreur inattendue est survenue.');
      return null;
    }
  };

  const updateStatus = async (
    id: string,
    status: FeatureRequestStatus,
    adminNotes?: string,
    estimatedDelivery?: string
  ): Promise<boolean> => {
    const prevItem = requests.find((r) => r.id === id);
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              admin_notes: adminNotes !== undefined ? adminNotes : r.admin_notes,
              estimated_delivery:
                estimatedDelivery !== undefined ? estimatedDelivery : r.estimated_delivery,
              updated_at: new Date().toISOString(),
            }
          : r
      )
    );

    const ok = await updateFeatureRequestStatus(id, status, adminNotes, estimatedDelivery);
    if (ok) {
      const statusName = STATUS_LABELS[status] || status;
      toastSuccess('Statut mis à jour', `La demande est désormais "${statusName}".`);
    } else {
      if (prevItem) {
        setRequests((prev) => prev.map((r) => (r.id === id ? prevItem : r)));
      }
      toastError('Erreur', 'La mise à jour a échoué.');
    }
    return ok;
  };

  const removeRequest = async (id: string): Promise<boolean> => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    const ok = await deleteFeatureRequest(id);
    if (ok) {
      toastInfo('Demande supprimée', 'La demande a été retirée de la liste.');
    }
    return ok;
  };

  // Grouped counts for badges
  const countsByStatus = useMemo(() => {
    return requests.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<FeatureRequestStatus, number>
    );
  }, [requests]);

  return {
    requests,
    loading,
    isRealtimeConnected,
    countsByStatus,
    refresh: loadRequests,
    submitRequest,
    updateStatus,
    removeRequest,
  };
}
