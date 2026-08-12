import { LaunchCheckItem } from './types';

// The only export still used in production code: fetchLaunchChecklist()
// falls back to this default 20-point template when a project has no
// checklist row yet in Supabase — a real starting template, not fake data
// standing in for a real fetch. INITIAL_CLIENTS/INITIAL_PROJECTS/
// INITIAL_TEAM/INITIAL_SOPS/MOCK_ROI_METRICS were removed: every page that
// used them now fetches from Supabase directly.
export const INITIAL_LAUNCH_CHECKITEMS: LaunchCheckItem[] = [
  { id: 1, title: 'Page 404 Personnalisée', description: 'Design sur-mesure avec lien retour accueil et recherche', category: 'UX/UI & Design', checked: false },
  { id: 2, title: 'CTA Clair Above The Fold', description: 'Bouton d’action principal visible sans scroll avec forte accroche', category: 'UX/UI & Design', checked: true },
  { id: 3, title: 'Maillage Interne Structuré', description: 'Liens logiques entre pages de services et études de cas', category: 'UX/UI & Design', checked: true },
  { id: 4, title: 'Thank You Page configurée', description: 'Redirection après formulaire avec tracking de conversion', category: 'Conversion & Analytics', checked: true },
  { id: 5, title: 'Fil d’Ariane (Breadcrumbs) Active', description: 'Fil d’ariane accessible pour l’utilisateur et le SEO Google', category: 'UX/UI & Design', checked: true },
  { id: 6, title: 'Section Études de Cas Présente', description: 'Témoignages et résultats chiffrés réels intégrés', category: 'SEO & Content', checked: true },
  { id: 7, title: 'Foire Aux Questions (F.A.Q)', description: 'Réponses aux 5 objections principales des prospects', category: 'SEO & Content', checked: true },
  { id: 8, title: 'Engagement de temps de réponse affiché', description: 'Ex: "Rappel garanti en moins de 15 minutes"', category: 'UX/UI & Design', checked: true },
  { id: 9, title: 'Sticky Mobile CTA Configuré', description: 'Barre d’appel fixe en bas d’écran sur mobile', category: 'UX/UI & Design', checked: true },
  { id: 10, title: 'Fichier Robots.txt & Sitemap OK', description: 'Sitemap XML généré et soumis à la Google Search Console', category: 'SEO & Content', checked: true },
  { id: 11, title: 'Titres de Pages Uniques & H1/H2', description: 'Structure hiérarchique stricte par page', category: 'SEO & Content', checked: true },
  { id: 12, title: 'Méta-descriptions optimisées', description: 'Méta-description unique entre 140 et 160 caractères', category: 'SEO & Content', checked: true },
  { id: 13, title: 'Visuels Social Share (Open Graph)', description: 'Image og:image 1200x630px configurée pour les partages SMS/Social', category: 'SEO & Content', checked: true },
  { id: 14, title: 'Google Maps & Itinéraire Intégré', description: 'Carte interactive et fiche GMB liée', category: 'UX/UI & Design', checked: true },
  { id: 15, title: 'Avis Clients Authentiques Intégrés', description: 'Synchro en direct avec la fiche Google Business Profile', category: 'SEO & Content', checked: true },
  { id: 16, title: 'Balises Alt sur toutes les images', description: 'Description textuelle pour l’accessibilité et le SEO', category: 'SEO & Content', checked: true },
  { id: 17, title: 'Conforme Loi 25 (Bannière & Consentement)', description: 'Politique de confidentialité et gestionnaire de cookies actif', category: 'Performance & Legal', checked: false },
  { id: 18, title: 'Vitesse Mobile < 2.0s', description: 'Lighthouse Performance score > 90/100 sur mobile', category: 'Performance & Legal', checked: true },
  { id: 19, title: 'Google Analytics & Pixels Ads Actifs', description: 'Google Tag Manager + Meta Pixel sans erreur', category: 'Conversion & Analytics', checked: true },
  { id: 20, title: 'Photos réelles de l’Équipe affichées', description: 'Pas de visuels génériques de banque d’images', category: 'SEO & Content', checked: true },
];
