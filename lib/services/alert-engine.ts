import { Project, ClientRoiMetrics, LaunchCheckItem } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export interface SystemAlert {
  id: string;
  type: 'checklist_blocked' | 'roi_drop' | 'loi_25_violation';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  clientId?: string;
  projectId?: string;
  createdAt: string;
  actionUrl: string;
}

const supabase = createClient();

export async function evaluateSystemAlerts(
  projects: Project[],
  metricsMap: Record<string, ClientRoiMetrics>,
  checklistMap: Record<string, LaunchCheckItem[]>
): Promise<SystemAlert[]> {
  const alerts: SystemAlert[] = [];
  const now = new Date();

  // Rule 1: Checklist Bloquée (< 100% at < 48h of due_date)
  projects.forEach((proj) => {
    const dueDate = new Date(proj.due_date);
    const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (proj.progress_pct < 100 && hoursRemaining <= 72) {
      alerts.push({
        id: `alert-proj-${proj.id}`,
        type: 'checklist_blocked',
        severity: 'critical',
        title: `Checklist Bloquée : ${proj.client_name}`,
        description: `Le projet "${proj.name}" est à ${proj.progress_pct}% et l'échéance est dans moins de 48h.`,
        projectId: proj.id,
        createdAt: new Date().toISOString(),
        actionUrl: `/projects/${proj.id}/launch-check`,
      });
    }
  });

  // Rule 2: Chute de ROI (< 4.0x or high CPL)
  Object.values(metricsMap).forEach((metric) => {
    if (metric.roi_multiplier < 4.0) {
      alerts.push({
        id: `alert-roi-${metric.client_id}`,
        type: 'roi_drop',
        severity: 'warning',
        title: `Alerte ROI Client : ${metric.client_id}`,
        description: `Le multiplicateur ROI est tombé à ${metric.roi_multiplier}x (seuil critique: 4.0x).`,
        clientId: metric.client_id,
        createdAt: new Date().toISOString(),
        actionUrl: `/clients/${metric.client_id}/roi-tracker`,
      });
    }
  });

  // Rule 3: Non-conformité Loi 25 (Item #17 unchecked)
  Object.entries(checklistMap).forEach(([projId, items]) => {
    const loi25Item = items.find((i) => i.id === 17);
    if (loi25Item && !loi25Item.checked) {
      alerts.push({
        id: `alert-loi25-${projId}`,
        type: 'loi_25_violation',
        severity: 'critical',
        title: `Conformité Loi 25 Requise`,
        description: `Le critère #17 (Bannière & Consentement Cookies) est obligatoire avant la mise en ligne.`,
        projectId: projId,
        createdAt: new Date().toISOString(),
        actionUrl: `/projects/${projId}/launch-check`,
      });
    }
  });

  return alerts;
}

export async function dispatchAlertNotification(alert: SystemAlert) {
  try {
    await fetch('https://eobatkwbwcdsdqbemrma.supabase.co/functions/v1/alert-dispatcher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
  } catch (err) {
    console.error('Error dispatching alert notification:', err);
  }
}
