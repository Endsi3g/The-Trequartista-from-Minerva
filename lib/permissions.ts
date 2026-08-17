export interface PermissionDef {
  key: string;
  label: string;
  description: string;
}

// Single source of truth for what a "member" (non-admin) can be granted.
// Admins always have full access regardless of these toggles; client-role
// users never reach the screens that check them. A key with no row in
// app_permissions (or member_allowed = false) means admin-only -- the
// default is always locked down, never open.
export const PERMISSION_CATALOG: PermissionDef[] = [
  {
    key: 'delete_lead',
    label: 'Supprimer un lead',
    description: 'Autoriser les membres à supprimer définitivement un prospect du pipeline CRM.',
  },
  {
    key: 'edit_client_financials',
    label: 'Modifier le MRR / statut d’un client',
    description: 'Autoriser les membres à changer le revenu récurrent, le statut ou l’industrie d’un client depuis sa fiche.',
  },
  {
    key: 'publish_academy_sop',
    label: 'Publier une SOP Académie',
    description: 'Autoriser les membres à créer de nouvelles procédures dans la bibliothèque Académie.',
  },
];
