/**
 * Minerva Trequartista -- Moteur de Qualification & Scoring des Leads
 *
 * Règles d'attribution :
 * - Montréal & agglomération (+25)
 * - Volume de transactions >= 200 (+25)
 * - Système de caisse (POS) compatible (+20)
 * - Type de commerce fréquent (+15)
 * - Objectif fidélité (+15)
 * - Multi-sites (+5)
 *
 * Seuils :
 * - Tier A (70 - 100) : Appel sous 10 min
 * - Tier B (45 - 69)  : Appel sous 1 heure
 * - Tier C (0 - 44)   : Email / validation
 */

export interface LeadScoringInput {
  city?: string | null;
  monthly_transactions?: number | string | null;
  pos_system?: string | null;
  business_type?: string | null;
  loyalty_goal?: string | null;
  is_multi_site?: boolean | null;
}

export interface ScoreBreakdownItem {
  criterion: string;
  points: number;
  maxPoints: number;
  matched: boolean;
  details?: string;
}

export interface ScoreLeadResult {
  score: number;
  tier: 'A' | 'B' | 'C';
  actionLabel: string;
  slaMinutes: number;
  breakdown: Record<string, ScoreBreakdownItem>;
  calculatedAt: string;
}

export interface InterventionChecklistItem {
  id: string;
  step: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  notes?: string | null;
}

// Villes et régions admissibles au bonus Montréal (+25)
const MONTREAL_REGIONS = [
  'montreal',
  'montréal',
  'laval',
  'longueuil',
  'brossard',
  'saint-laurent',
  'dorval',
  'westmount',
  'verdun',
  'outremont',
  'rosemont',
  'plateau',
  'anjou',
  'lasalle',
  'lachine',
  'pointe-claire',
  'terrebonne',
  'repentigny',
];

// Systèmes de caisse considérés comme pleinement compatibles (+20)
const COMPATIBLE_POS = [
  'lightspeed',
  'square',
  'clover',
  'touchbistro',
  'maitre\'d',
  'maitred',
  'toast',
  'stripe',
  'shift4',
  'posios',
  'revel',
];

// Types de restauration et commerces à fort achalandage (+15)
const FREQUENT_TYPES = [
  'fast-food',
  'fast food',
  'restauration rapide',
  'café',
  'cafe',
  'boulangerie',
  'bar',
  'pizzeria',
  'casual dining',
  'bistrot',
  'bistro',
  'sushi',
  'poke',
  'burger',
  'tacos',
  'traiteur',
];

// Mots-clés reliés à un objectif de fidélisation (+15)
const LOYALTY_KEYWORDS = [
  'fidelite',
  'fidélité',
  'fideliser',
  'fidéliser',
  'retention',
  'rétention',
  'points',
  'cashback',
  'recompense',
  'récompense',
  'abonnements',
  'recurrence',
  'récurrence',
  'programme',
  'client',
  'vip',
];

/**
 * Évalue et score un lead entrant selon la grille Minerva.
 */
export function scoreLead(input: LeadScoringInput): ScoreLeadResult {
  const breakdown: Record<string, ScoreBreakdownItem> = {};
  let totalScore = 0;

  // 1. Montréal & grand Montréal (+25)
  const normalizedCity = (input.city || '').trim().toLowerCase();
  const isMontrealArea = MONTREAL_REGIONS.some((reg) => normalizedCity.includes(reg));
  const cityPoints = isMontrealArea ? 25 : 0;
  totalScore += cityPoints;
  breakdown.montreal = {
    criterion: 'Montréal & Agglomération',
    points: cityPoints,
    maxPoints: 25,
    matched: isMontrealArea,
    details: input.city || 'Non spécifié',
  };

  // 2. Volume de transactions >= 200 (+25)
  const rawTx = input.monthly_transactions;
  let txCount = 0;
  if (typeof rawTx === 'number') {
    txCount = rawTx;
  } else if (typeof rawTx === 'string') {
    const parsed = parseInt(rawTx.replace(/[^\d]/g, ''), 10);
    txCount = isNaN(parsed) ? 0 : parsed;
  }
  const hasMinTransactions = txCount >= 200;
  const txPoints = hasMinTransactions ? 25 : 0;
  totalScore += txPoints;
  breakdown.transactions = {
    criterion: '>= 200 Transactions',
    points: txPoints,
    maxPoints: 25,
    matched: hasMinTransactions,
    details: `${txCount} tx`,
  };

  // 3. POS compatible (+20)
  const normalizedPos = (input.pos_system || '').trim().toLowerCase();
  const isPosCompatible = COMPATIBLE_POS.some((pos) => normalizedPos.includes(pos));
  const posPoints = isPosCompatible ? 20 : 0;
  totalScore += posPoints;
  breakdown.pos_compatible = {
    criterion: 'POS Compatible',
    points: posPoints,
    maxPoints: 20,
    matched: isPosCompatible,
    details: input.pos_system || 'Non spécifié',
  };

  // 4. Type de commerce fréquent (+15)
  const normalizedType = (input.business_type || '').trim().toLowerCase();
  const isFrequentType = FREQUENT_TYPES.some((t) => normalizedType.includes(t));
  const typePoints = isFrequentType ? 15 : 0;
  totalScore += typePoints;
  breakdown.frequent_type = {
    criterion: 'Type de commerce fréquent',
    points: typePoints,
    maxPoints: 15,
    matched: isFrequentType,
    details: input.business_type || 'Non spécifié',
  };

  // 5. Objectif fidélité (+15)
  const normalizedLoyalty = (input.loyalty_goal || '').trim().toLowerCase();
  const hasLoyaltyGoal = LOYALTY_KEYWORDS.some((kw) => normalizedLoyalty.includes(kw));
  const loyaltyPoints = hasLoyaltyGoal ? 15 : 0;
  totalScore += loyaltyPoints;
  breakdown.loyalty_goal = {
    criterion: 'Objectif fidélité qualifié',
    points: loyaltyPoints,
    maxPoints: 15,
    matched: hasLoyaltyGoal,
    details: input.loyalty_goal || 'Non spécifié',
  };

  // 6. Multi-sites (+5)
  const isMultiSite = Boolean(input.is_multi_site);
  const multiSitePoints = isMultiSite ? 5 : 0;
  totalScore += multiSitePoints;
  breakdown.multi_site = {
    criterion: 'Établissement multi-sites',
    points: multiSitePoints,
    maxPoints: 5,
    matched: isMultiSite,
    details: isMultiSite ? 'Oui' : 'Non',
  };

  // Plafonner à 100 points max
  const finalScore = Math.min(100, Math.max(0, totalScore));

  // Attribution du Tier et du SLA
  let tier: 'A' | 'B' | 'C';
  let actionLabel: string;
  let slaMinutes: number;

  if (finalScore >= 70) {
    tier = 'A';
    actionLabel = 'Appel d\'urgence sous 10 minutes';
    slaMinutes = 10;
  } else if (finalScore >= 45) {
    tier = 'B';
    actionLabel = 'Appel de qualification sous 1 heure';
    slaMinutes = 60;
  } else {
    tier = 'C';
    actionLabel = 'Email d\'information & validation';
    slaMinutes = 1440; // 24 heures
  }

  return {
    score: finalScore,
    tier,
    actionLabel,
    slaMinutes,
    breakdown,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Génère la checklist d'intervention standard de 45-60 minutes
 */
export function getInitialInterventionChecklist(): InterventionChecklistItem[] {
  return [
    {
      id: 'step-1-prep',
      step: 1,
      title: 'Préparation en amont (10 min)',
      description: 'Vérification du matériel, configuration du compte Minerva Flow et impression des pré-requis.',
      estimatedMinutes: 10,
      completed: false,
    },
    {
      id: 'step-2-setup',
      step: 2,
      title: 'Setup sur place (15 min)',
      description: 'Branchement de l\'imprimante thermique, test réseau Wi-Fi/Ethernet et pose des QR codes.',
      estimatedMinutes: 15,
      completed: false,
    },
    {
      id: 'step-3-tests',
      step: 3,
      title: 'Tests d\'inscription réelle (10 min)',
      description: 'Passage d\'une commande test réelle sur place, validation du ticket de caisse et du flux client.',
      estimatedMinutes: 10,
      completed: false,
    },
    {
      id: 'step-4-training',
      step: 4,
      title: 'Formation équipe avec script (15 min)',
      description: 'Briefing des serveurs et du gérant, remise du script d\'accueil et simulation du pitch fidélité.',
      estimatedMinutes: 15,
      completed: false,
    },
    {
      id: 'step-5-photos',
      step: 5,
      title: 'Photo des supports installés (5 min)',
      description: 'Prise de photos des chevalets, vitrophanies et comptoirs pour archivage dans le dossier client.',
      estimatedMinutes: 5,
      completed: false,
    },
    {
      id: 'step-6-trial-active',
      step: 6,
      title: 'Passage à trial_active (5 min)',
      description: 'Validation de l\'ouverture officielle de la période d\'essai active et notification au dashboard.',
      estimatedMinutes: 5,
      completed: false,
    },
  ];
}

/**
 * Génère les 2 créneaux d'installation recommandés par semaine pour les 4 prochaines semaines
 * (ex: Mardi 14:00 et Jeudi 10:00)
 */
export function generateInstallationSlots(weeksCount = 4): { slotId: string; dateIso: string; label: string }[] {
  const slots: { slotId: string; dateIso: string; label: string }[] = [];
  const now = new Date();

  // On démarre à partir de demain
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);

  while (slots.length < weeksCount * 2) {
    const dayOfWeek = current.getDay(); // 0 = Dim, 2 = Mar, 4 = Jeu

    if (dayOfWeek === 2) {
      // Mardi 14h00
      const slotDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 14, 0, 0);
      slots.push({
        slotId: `slot-${slotDate.getTime()}`,
        dateIso: slotDate.toISOString(),
        label: slotDate.toLocaleDateString('fr-CA', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } else if (dayOfWeek === 4) {
      // Jeudi 10h00
      const slotDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 10, 0, 0);
      slots.push({
        slotId: `slot-${slotDate.getTime()}`,
        dateIso: slotDate.toISOString(),
        label: slotDate.toLocaleDateString('fr-CA', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}
