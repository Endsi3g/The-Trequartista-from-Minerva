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
  {
    key: 'view_voice_agent',
    label: 'Voir l’Agent Vocal IA',
    description: 'Autoriser les membres à consulter le tableau de bord, la configuration et le journal des appels de l’agent vocal.',
  },
  {
    key: 'view_clients',
    label: 'Voir l’historique MRR des clients',
    description: 'Autoriser les membres à consulter l’évolution du revenu récurrent sur la fiche d’un client.',
  },
];

// Modules exposed in the custom-role builder (Team > Postes & Rôles). Each
// (module, action) pair maps to a real permission string that member_can()
// enforces at the RLS level -- kept deliberately small (only what's
// actually wired to real enforcement, see 20260821000010_custom_roles.sql)
// rather than exposing checkboxes that would silently do nothing.
export const ROLE_MODULE_ACTIONS: Record<string, Partial<Record<'view' | 'create' | 'edit' | 'delete', string>>> = {
  clients: { view: 'view_clients', edit: 'edit_client_financials' },
  leads: { delete: 'delete_lead' },
  academy: { create: 'publish_academy_sop' },
  voice_agent: { view: 'view_voice_agent' },
};

export const ROLE_MODULE_LABELS: Record<string, string> = {
  clients: 'Clients',
  leads: 'Leads',
  academy: 'Académie',
  voice_agent: 'Agent Vocal IA',
};
