const SECTION_LABELS: Record<string, string> = {
  overview: 'Accueil',
  'voice-agent': 'Agent Vocal IA',
  tasks: 'Tâches',
  clients: 'Clients',
  leads: 'Leads',
  projects: 'Projets',
  team: 'Équipe',
  'content-planner': 'Réels',
  academy: 'Académie',
  audits: 'Audits',
  acquisition: 'Acquisition',
  integrations: 'Intégrations',
  settings: 'Paramètres',
  profil: 'Profil',
  changelog: 'Nouveautés',
  help: 'Aide',
  portal: 'Portail client',
};

export function getPageLabel(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Accueil';
  const section = SECTION_LABELS[segments[0]] || segments[0];
  if (segments[0] === 'team' && segments[1] === 'invite') return 'Équipe — Invitations';
  if (segments[0] === 'team' && segments[1] === 'workload') return 'Équipe — Charge de travail';
  if (segments.length === 1) return section;
  if (/^new$/.test(segments[segments.length - 1])) return `${section} — Nouveau`;
  return section;
}
