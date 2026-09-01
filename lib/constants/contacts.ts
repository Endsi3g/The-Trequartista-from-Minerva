// A contact left at status 'a_contacter' with no manually-set follow_up_date
// used to never trigger a reminder, no matter its age (the cron and the UI
// due-badge both only checked follow_up_date). Contacts are rarely given an
// explicit follow-up date at creation, so this made the reminder feature
// silently inert for most of them. Both isFollowUpDue() below and the
// contact-reminders cron treat "no date set" as due after this many days
// since creation.
export const STALE_CONTACT_REMINDER_DAYS = 7;

export const SECTOR_OPTIONS = [
  'Restauration & Café',
  'Bâtiment & Rénovation',
  'Immobilier',
  'SaaS & Technologie',
  'Santé & Bien-être',
  'Commerce de détail',
  'Services professionnels',
  'Automobile',
  'Autre',
];

export const CONTACT_STATUS_OPTIONS: Array<{ value: 'a_contacter' | 'rencontre_proposee' | 'entrevue_minerva' | 'collaboration_en_cours'; label: string; variant: 'neutral' | 'blue' | 'purple' | 'green' }> = [
  { value: 'a_contacter', label: 'À contacter', variant: 'neutral' },
  { value: 'rencontre_proposee', label: 'Rencontre proposée', variant: 'blue' },
  { value: 'entrevue_minerva', label: 'Entrevue Minerva', variant: 'purple' },
  { value: 'collaboration_en_cours', label: 'Collaboration en cours', variant: 'green' },
];

export const CONTACT_PREFERRED_METHOD_OPTIONS: Array<{ value: 'email' | 'reseaux_sociaux' | 'site_web' | 'autre'; label: string }> = [
  { value: 'email', label: 'Courriel' },
  { value: 'reseaux_sociaux', label: 'Réseaux sociaux' },
  { value: 'site_web', label: 'Site web' },
  { value: 'autre', label: 'Autre' },
];
