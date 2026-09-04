import type { Client, ClientDeliverable, Invoice, ClientHealthBreakdown } from '@/lib/types';

/**
 * Moteur de calcul automatisé du Health Score client (0-100)
 *
 * Pondération :
 * 1. Livrables & Validation (max 30 pts)
 * 2. Facturation & Paiements Stripe (max 30 pts)
 * 3. Performance ROI & Minerva Flow (max 20 pts)
 * 4. Engagement & Communication Récente (max 20 pts)
 */
export function computeClientHealthScore(
  client: Client,
  deliverables: ClientDeliverable[] = [],
  invoices: Invoice[] = [],
  messagesCountLast14Days: number = 0,
  hasFlowOrRoiData: boolean = true
): ClientHealthBreakdown {
  const alerts: string[] = [];

  // 1. Livrables Score (Max 30)
  let deliverablesScore = 30;
  const pendingCount = deliverables.filter((d) => d.status === 'pending_review').length;
  const revisionCount = deliverables.filter((d) => d.status === 'revision_requested').length;

  if (pendingCount > 2) {
    deliverablesScore -= 12;
    alerts.push(`${pendingCount} livrables en attente d'approbation`);
  } else if (pendingCount > 0) {
    deliverablesScore -= 5;
  }

  if (revisionCount > 1) {
    deliverablesScore -= 10;
    alerts.push(`${revisionCount} livrables demandent des retouches`);
  } else if (revisionCount === 1) {
    deliverablesScore -= 4;
  }
  deliverablesScore = Math.max(8, deliverablesScore);

  // 2. Facturation & Invoices Score (Max 30)
  let invoicesScore = 30;
  const overdueInvoices = invoices.filter((inv) => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    if (inv.status === 'overdue') return true;
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date).getTime();
    return dueDate < Date.now();
  });

  const unpaidInvoices = invoices.filter((inv) => inv.status === 'sent' || inv.status === 'draft');

  if (overdueInvoices.length > 0) {
    invoicesScore -= 20;
    alerts.push(`${overdueInvoices.length} facture(s) en retard de règlement`);
  } else if (unpaidInvoices.length > 1) {
    invoicesScore -= 10;
    alerts.push(`${unpaidInvoices.length} factures ouvertes en attente de paiement`);
  } else if (unpaidInvoices.length === 1) {
    invoicesScore -= 4;
  }
  invoicesScore = Math.max(5, invoicesScore);

  // 3. Performance ROI & Flow Score (Max 20)
  let roiScore = 15;
  if (client.trial_direct_orders_count && client.trial_direct_orders_count > 0) {
    roiScore = 20;
  } else if (hasFlowOrRoiData) {
    roiScore = 18;
  } else {
    roiScore = 12;
    alerts.push('Aucun volume de commande Flow enregistré');
  }

  // 4. Engagement & Communication Récente (Max 20)
  let engagementScore = 20;
  if (messagesCountLast14Days >= 4) {
    engagementScore = 20;
  } else if (messagesCountLast14Days >= 1) {
    engagementScore = 16;
  } else {
    engagementScore = 8;
    alerts.push('Aucun message dans le chat depuis plus de 14 jours');
  }

  // Total Score (0-100)
  const totalScore = Math.min(100, Math.max(0, deliverablesScore + invoicesScore + roiScore + engagementScore));

  let tier: ClientHealthBreakdown['tier'] = 'stable';
  let tier_label = 'Compte Stable';

  if (totalScore >= 90) {
    tier = 'excellent';
    tier_label = 'Excellente Santé';
  } else if (totalScore >= 70) {
    tier = 'stable';
    tier_label = 'Compte Stable';
  } else if (totalScore >= 50) {
    tier = 'warning';
    tier_label = 'Vigilance Rétention';
  } else {
    tier = 'critical';
    tier_label = 'Risque Critique de Churn';
  }

  return {
    score: totalScore,
    tier,
    tier_label,
    factors: {
      deliverables_score: deliverablesScore,
      invoices_score: invoicesScore,
      roi_score: roiScore,
      engagement_score: engagementScore,
    },
    alerts,
  };
}
