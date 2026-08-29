// Minerva Studio Marketplace — Creative & Growth Agency Services for Clients & Flow Restaurants
import { getSupabase } from '@/lib/supabase/client';
import type { StudioServicePackage, StudioServiceOrder } from '@/lib/types';
import { createInvoice } from '@/lib/services/invoicing';

export const STUDIO_PACKAGES_CATALOG: StudioServicePackage[] = [
  {
    id: 'pack-reels-8',
    title: 'Pack 8 Vidéos Reels & TikTok 4K',
    category: 'production_video',
    description: 'Shooting sur place à Montréal avec éclairage cinéma, captation des plats signatures et montage dynamique 9:16 avec hooks optimisés.',
    price_cad: 1500.0,
    recurring: false,
    deliverable_days: 7,
    features_list: [
      '1/2 journée de tournage avec caméra 4K cinéma',
      '8 Reels / TikToks montés avec sous-titres animés',
      'Étalonnage couleur & sound design professionnel',
      'Calendrier de publication et hashtags locaux inclus',
    ],
    is_popular: true,
    icon_name: 'Video',
  },
  {
    id: 'pack-web-framer',
    title: 'Site Vitrine & Menu Framer Haute Performance',
    category: 'web_framer',
    description: 'Refonte complète sur Framer avec animations fluides, commande directe Minerva Flow, carte Google interactive et vitesse ultra-rapide.',
    price_cad: 2800.0,
    recurring: false,
    deliverable_days: 14,
    features_list: [
      'Design UX/UI sur mesure aux couleurs de votre établissement',
      'Menu dynamique interactif lié à Minerva Flow',
      'Optimisation SEO local & intégration Google My Business',
      'Score de performance 99/100 sur mobile',
    ],
    is_popular: true,
    icon_name: 'Globe',
  },
  {
    id: 'pack-ads-acquisition',
    title: 'Gestion Publicités Meta & Google Ads (30 Jours)',
    category: 'acquisition_ads',
    description: 'Campagnes d’acquisition ultra-ciblées dans un rayon de 5 km pour remplir vos tables aux heures creuses et booster les commandes en direct.',
    price_cad: 1200.0,
    recurring: true,
    deliverable_days: 30,
    features_list: [
      'Création des visuels publicitaires et accroches copywriting',
      'Ciblage géographique précis des amateurs de gastronomie locale',
      'Tracking des conversions et réservations en temps réel',
      'Rapport hebdomadaire de performance et ROAS transparent',
    ],
    is_popular: false,
    icon_name: 'TrendingUp',
  },
  {
    id: 'pack-pos-qr-setup',
    title: 'Configuration Flow POS & Chevalets QR Codes',
    category: 'operations_pos',
    description: 'Branchement opérationnel clé en main : imprimantes thermiques de cuisine, synchronisation du menu et 50 chevalets de table en bois/plexiglas.',
    price_cad: 650.0,
    recurring: false,
    deliverable_days: 3,
    features_list: [
      'Connexion avec votre imprimante ticket existante ou recommandée',
      'Impression de 50 supports de table QR code haute résistance',
      'Formation de l’équipe en personne ou vidéo (15 min)',
      'Support prioritaire le premier week-end de service',
    ],
    is_popular: false,
    icon_name: 'QrCode',
  },
  {
    id: 'pack-brand-identity',
    title: 'Identité Visuelle & Charte Graphique Complète',
    category: 'branding',
    description: 'Modernisation du logo, palette chromatique harmonieuse, typographies élégantes et modèles imprimables pour menus et packagings.',
    price_cad: 1950.0,
    recurring: false,
    deliverable_days: 10,
    features_list: [
      'Refonte logo vectoriel (formats HD, réseaux sociaux, enseigne)',
      'Charte graphique (couleurs, polices, directives d’usage)',
      'Gabarit de menu physique prêt pour impression',
      'Templates de stories Instagram éditables',
    ],
    is_popular: false,
    icon_name: 'Sparkles',
  },
];

export async function fetchStudioPackages(): Promise<StudioServicePackage[]> {
  try {
    const { data, error } = await getSupabase()
      .from('studio_service_packages')
      .select('*')
      .order('price_cad', { ascending: false });

    if (error || !data || data.length === 0) {
      return STUDIO_PACKAGES_CATALOG;
    }
    return data as StudioServicePackage[];
  } catch {
    return STUDIO_PACKAGES_CATALOG;
  }
}

export function getStudioPackageById(packageId: string): StudioServicePackage | undefined {
  return STUDIO_PACKAGES_CATALOG.find((p) => p.id === packageId);
}

export async function createStudioServiceOrder(payload: {
  clientId: string;
  packageId: string;
  notes?: string;
}): Promise<StudioServiceOrder> {
  const pkg = getStudioPackageById(payload.packageId) || STUDIO_PACKAGES_CATALOG[0];

  const orderObj: StudioServiceOrder = {
    id: `ord-studio-${Date.now()}`,
    client_id: payload.clientId,
    package_id: pkg.id,
    package_title: pkg.title,
    package_price_cad: pkg.price_cad,
    status: 'pending',
    total_cad: pkg.price_cad,
    notes: payload.notes || null,
    ordered_at: new Date().toISOString(),
  };

  try {
    // 1. Save order in DB
    const { data } = await getSupabase()
      .from('studio_service_orders')
      .insert([orderObj])
      .select()
      .single();

    // 2. Automatically generate an invoice draft in the financial system
    await createInvoice({
      client_id: payload.clientId,
      type: 'invoice',
      status: 'sent',
      currency: 'CAD',
      items: [
        {
          description: `Prestation Studio : ${pkg.title}`,
          quantity: 1,
          unit_price_cad: pkg.price_cad,
        },
      ],
      notes: `Commande Studio passée via le portail client. Délai de livraison estimé : ${pkg.deliverable_days} jours.`,
    });

    if (data) return data as StudioServiceOrder;
    return orderObj;
  } catch {
    return orderObj;
  }
}
