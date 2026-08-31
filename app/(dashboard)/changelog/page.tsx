'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchChangelogEntries } from '@/lib/services/supabase-data';
import type { ChangelogEntry } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

const STATIC_ENTRIES: ChangelogEntry[] = [
  {
    id: 'v2-17-1',
    version: '2.17.1',
    title: 'Assainissement Codebase & Maintenance de Performance (v2.17.1)',
    body: `Opération d'assainissement technique et d'optimisation de la codebase : suppression définitive de l'ensemble des stubs et types orphelins de Plane (decommissionné en v2.13), nettoyage des fonctions de synchronisation non utilisées, purge des captures d'écran et dossiers d'inspiration temporaires à la racine du projet, et validation stricte du typage TypeScript.`,
    included_items: [
      'Purge Définitive des Résidus de Plane : Suppression du fichier stub lib/services/plane.ts, retrait des types PlaneState, PlaneIssue, PlaneSyncLog et suppression des fonctions orphelines de synchronisation.',
      'Nettoyage des Fichiers Temporaires : Purge des images racine et suppression du dossier d\'inspiration périmé pour un dépôt plus léger et plus lisible.',
      'Typage Strict & Zéro Erreur : Validation stricte TypeScript sans warning et compilation Turbopack 100% propre.',
    ],
    image_url: '/changelog/minerva-flow-v2-5-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-17-0',
    version: '2.17.0',
    title: 'Suite Notion AI Universelle — Streaming Temps Réel, Commande /ai, Menu Sélection & Générateur SOPs (v2.17.0)',
    body: `Mise en production de la suite complète Notion AI intégrée à l'éditeur de blocs de Minerva Trequartista, propulsée par Google Gemini avec streaming SSE fluide en temps réel. Cette version introduit la commande slash /ai, le déclencheur d'espace pour l'invite IA, un menu contextuel de sélection pour la réécriture et le changement de ton, des actions globales de résumé et extraction de tâches sur les documents et l'Académie, ainsi qu'un générateur de SOPs assisté par IA.`,
    included_items: [
      'Commande Slash /ai & Déclencheur Espace (BlockEditor) : Saisie instantanée d\'invites IA directement dans les documents d\'équipe avec prévisualisation streaming en direct et conversion automatique Markdown <-> Blocks.',
      'Menu Contextuel Flottant sur Sélection (AiSelectionMenu) : Améliorer la rédaction, raccourcir, développer, corriger grammaire & orthographe, changer de ton (Professionnel, Direct, Persuasif, Pédagogique) et traduire (FR, EN, ES) en 1 clic.',
      'Barre d\'Action Post-Génération Interactive (AiStreamingPreview) : Boutons Conserver, Insérer en dessous, Réessayer, Plus court, Plus long ou Rejeter la proposition.',
      'Actions Globales de Page & SOPs (AiPageToolbar) : Résumé exécutif en 5 points clés, extraction automatique de la checklist de tâches (todos) et traduction de pages entières.',
      'Générateur de SOPs IA dans l\'Académie (AiSopGeneratorModal) : Création instantanée de procédures complètes respectant le standard Minerva (Objectif, Prérequis, Pas-à-pas, Checklist QA, Pièges fréquents).',
      'Télémétrie & Logs Supabase (ai_generation_logs) : Suivi des durées, tokens estimés, actions et statut de chaque génération avec politiques de sécurité RLS.',
    ],
    image_url: '/changelog/minerva-flow-v2-5-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-5-0',
    version: '2.5.0',
    title: 'Minerva-Flow Expansion, Multi-Suppression & Toolkit Opérationnel (v2.5.0)',
    body: `Déploiement majeur intégrant les sections « Mes Résultats » (métriques Minerva-Flow 0% commission), « Demander une fonctionnalité » et « Statut de mes demandes » avec notifications en temps réel dans le Portail Client. Ajout du template de projet Minerva-Flow avec son guide interactif de déploiement et sa checklist 14 jours, de la sélection multiple et suppression groupée dans Documents, Équipe et Projets, et d'un nouveau système d'avatars déterministes.`,
    included_items: [
      'Section « Mes résultats » Minerva-Flow : KPI cards en direct (Économies commissions 0%, Volume brut, Délais cuisine, Commandes passées), graphique d’évolution des ventes et flux de tickets de cuisine en temps réel.',
      'Module « Demander une fonctionnalité » & Suivi Realtime : Formulaire de proposition de features avec choix du repo/module, priorité et statut en 5 étapes synchronisé en temps réel avec notifications Toast.',
      'Sélection Multiple & Suppression Groupée (Bulk Delete) : Checkboxes de sélection multiple et barre d’actions groupées pour supprimer ou exporter en lot des documents (/documents), des collaborateurs (/team) et des projets (/projects) avec modale de confirmation sécurisée.',
      'Nouveau Template de Projet « Minerva-Flow » & Guide Déploiement : Modèle pré-configuré injectant automatiquement les 5 jalons de déploiement 14 jours et un guide complet interactif (/projects/[id]/roadmap) avec checklist terrain.',
      'Rendu des Avatars Équipe Perfectionné : Gradients déterministes colorés par collaborateur, typographie d’initiales haute-résolution et taille optimisée éliminant les images floues ou déformées.',
      'Gestion Admin des Demandes Fonctionnalités : Nouvel onglet dans /produits permettant aux administrateurs de consulter, filtrer et changer le statut des demandes en 1 clic.',
    ],
    image_url: '/changelog/minerva-flow-v2-5-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-4-3',
    version: '2.4.3',
    title: 'Système Anti-Friction (4 Piliers), Académie Redessinée & Studio de Scripting Cas Client (v2.4.3)',
    body: `Mise en production du Framework Directeur Anti-Friction « Donner d’abord, demander ensuite » couvrant les 4 piliers de l'agence (Flow, Reach, Agence Sur Mesure, Mes Inspirations). Refonte ergonomique de l'Académie avec Carte Héro Fondatrice, SOPs Essentielles en tête, bascule compacte « Voir plus », filtres de catégories ultra-navigables, Studio de Scripting Cas Client 60s et module de Co-Pilotage Mensuel ($300-$500/mo).`,
    included_items: [
      'SOP Fondatrice Anti-Friction : Framework complet intégrant la neutralisation des 4 failles critiques pour chaque pilier, les règles d’exécution terrain, la boucle d’offre unifiée et la matrice de priorité S1/M1.',
      'Académie Cockpit & Navigation Compacte : Carte Héro dark-mode en haut de l’Académie avec raccourcis directs vers les 4 piliers, barre de recherche avec focus clavier (/) et filtre de catégories en pills défilables avec dropdown compact.',
      'SOPs Essentielles & Bascule « Voir Plus » : Affichage prioritaire des guides clés de l’agence avec bouton interactif [ ▾ Afficher les autres guides ] pour désencombrer l’écran au quotidien.',
      'Studio de Scripting Cas Client 60s (Mes Inspirations) : Générateur instantané de scripts vidéo Build-in-Public (Hook chiffré, Storyline 60s, CTA pilier) avec copie 1-clic et passerelle directe vers le Content Planner.',
      'Module de Co-Pilotage Mensuel ($300-$500/mo) : Composant de suivi de la récurrence agence sur les fiches clients avec checklist de la session 1h, historique des revues et planification de la prochaine séance.',
      'Détail des SOPs Enrichi : Rendu Markdown complet, actions contextuelles 1-clic (+ Créer doc prospect, Liens directs vers démos) et checklists interactives de contrôle qualité.',
    ],
    image_url: '/changelog/academy-v2-4-3.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-4-2',
    version: '2.4.2',
    title: 'Envois d’Emails (Resend / Gmail), Audit Fuite de Marge & Minerva-Flow (v2.4.2)',
    body: `Intégration d’un double moteur d’emailing (API Resend & Gmail Direct) déclenché automatiquement lors de la complétion des jalons et pour la prospection, ainsi que le déploiement du module Restauration complet : Audit Public de Fuite de Marge, Démo interactive Minerva-Flow à 0 % de commission et SOP d’Acquisition dans l’Académie.`,
    included_items: [
      'Double Moteur d’Emailing : Envoi d’emails transactionnels HTML élégants via l’API Resend (/api/emails/send) et génération de liens Gmail Compose en 1 clic pour l’envoi personnalisé.',
      'Notification de Jalon Complété : Déclencheur avec prévisualisation du message, choix du destinataire et boutons d’envoi direct [ Resend ] et [ Gmail ] sur la Roadmap et la vue dédiée du jalon.',
      'Audit Public Fuite de Marge Restauration : Calculateur instantané basé sur les données publiques (Prix sur place vs Uber Eats / DoorDash, 30% commission, volume de commandes) sans friction de données.',
      'Démo Interactive Minerva-Flow (/minerva-flow) : Prototype de commande directe 0 % commission avec 10 plats digitalisés, calcul d’économies en direct et protocole test 5-min en cuisine.',
      'SOP & Stratégie d’Acquisition dans l’Académie : Guide complet sur les 4 failles critiques des restaurateurs et les contre-pieds d’offre (Friction zéro, Démo pré-configurée, Zéro risque rush, Passerelle trafic agence).',
      'Intégration /audits/new : Commutateur segmenté permettant de basculer instantanément entre l’audit standard de transcription et l’audit restauration.',
    ],
    image_url: '/changelog/minerva-flow-v2-4-2.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-4-1',
    version: '2.4.1',
    title: 'Flow Temps Réel d’Avancement, Tâches & Approbations Client (v2.4.1)',
    body: `Mise à niveau complète du Portail Client permettant aux clients de suivre en direct toutes les tâches en cours de réalisation pour leur entreprise, d’inspecter les maquettes, prototypes et vidéos et de valider ou demander des ajustements en un clic avec synchronisation en temps réel.`,
    included_items: [
      'Vue Dédiée Avancement & Livrables (/portal/tasks) : Tableau Kanban 4 colonnes (À faire, En cours de production, À votre validation, Livré & Validé) et commutateur de vue Liste & Jalons.',
      'Validation & Approbation en 1 Clic : Bouton « ✓ Valider le livrable » et modal de demande d’ajustement « Ajuster » avec notification immédiate à l’équipe Minerva.',
      'Aperçu Direct des Livrables : Intégration de liens interactifs vers maquettes Figma, prototypes Framer, vidéos 4K (Reels/TikTok) et rapports PDF téléchargeables.',
      'Journal des Actions en Direct : Volet d’activité temps réel indiquant les démarrages de tâches, soumissions de livrables et validations d’étapes.',
      'Widget Résumé sur l’Accueil : Bannière de synthèse « Production & Livrables en Cours » sur /portal avec accès direct vers la roadmap interactive.',
      'Synchronisation en temps réel : Canal WebSocket instantané pour actualiser les colonnes sans rechargement de page.',
    ],
    image_url: '/changelog/portal-v2-4-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-4-0',
    version: '2.4.0',
    title: 'Pages Dédiées des Jalons, Générateur par Service & Studio Minerva (v2.4.0)',
    body: `Mise à jour majeure introduisant les pages dédiées par jalon (/projects/[id]/roadmap/[milestoneId]), le générateur de jalons automatiques pour 5 packages de services, les SOPs visuelles avec créateur de document prospect, l’éditeur Word-like avec split-preview et export PDF natif, le formulaire monolithique de contenu Minerva (support YouTube et téléversement vidéo local) ainsi que les refontes ultra-denses du Portail Client.`,
    included_items: [
      'Page Dédiée des Jalons : Route dédiée /projects/[id]/roadmap/[milestoneId] avec jauge d’avancement, sous-tâches interactives, assignation et liens de livrables.',
      'Générateur de Jalons par Service : Templates automatiques pour 5 packages (Framer Web Design, LeadGen Ads, Social Reels, SEO Local GMB, Audit & Conseil IA).',
      'Académie & SOPs Visuelles : Layout riche avec scripts de prospection copiables en 1 clic, checklist d’exécution interactive et action « + Créer doc prospect ».',
      'Éditeur Word-like & Export PDF : Barre d’outils d’insertion Markdown opérationnelle (H1-H3, Gras, Tableaux, Checklists, Callouts), mode Split en direct et impression PDF (@media print).',
      'Contenu Minerva Monolithique : Carte unique max-w-2xl, inputs 32px, bande upload 40px avec support direct des liens YouTube/Reels et des fichiers vidéo locaux (MP4, MOV).',
      'Portail Client Ultra-Dense : Refonte de /portal/join (carte 360px, alerte de connexion inline) et de /portal (top nav 40px, ruban 4-KPIs, graphique 140px et chat direct).',
      'Messagerie & Fiabilité : Optimisations temps réel avec envoi optimiste instantané et validation stricte des identifiants.',
    ],
    image_url: '/changelog/overview-v2-4-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-3-0',
    version: '2.3.0',
    title: 'Linear Roadmaps, Éditeur Word-like & Studio Monolithique (v2.3.0)',
    body: `Mise à niveau majeure intégrant la Roadmap des Jalons Client inspirée de Linear Roadmaps, un studio de création de réels monolithique en Single Viewport avec preview sticky 9:16 en direct, une refonte de l’Académie avec toolbar hiérarchique, un éditeur de documents collaboratif Word-like avec 3 modèles d’amorce, des états vides proactifs pour l'équipe (Admin vs Membre) et la persistance stricte des favoris.`,
    included_items: [
      'Roadmap des Jalons Client : Bandeau de synthèse 36px (0/4 complétés, date cible, statut temps, J-29), barre de progression 3px, DataTable Linear 36px et ligne de création inline (C/N).',
      'Nouveau Reel Monolithique : Panneau Single Viewport 2 colonnes (65% formulaire / 35% preview live 9:16), micro-labels, inputs 32px, strip média 40px et soumission ⌘+Entrée.',
      'Éditeur Documents Word-like : Barre d’outils complète (H1-H3, Gras, Italique, Barré, Listes, Tâches, Tableaux, Callouts), compteurs de mots live, exports Markdown & PDF et 3 modèles d’amorce.',
      'Académie & Process : Toolbar hiérarchique avec recherche à gauche (w-64 h-8), onglets soulignés de 2px vert émeraude, compteurs non-tronqués et accordéon média 36px.',
      'Page Équipe & Empty States : 4 états vides proactifs avec distinction Admin vs Membre, raccourci A puis M pour inviter et import CSV.',
      'Sidebar & Layout Fluide : Persistance localStorage des favoris sans ré-injection forcée, masquage propre de la section et contraction mobile fluide.',
    ],
    image_url: '/changelog/overview-v2-2-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-2-0',
    version: '2.2.0',
    title: 'Refonte Chirurgicale Linear & Superhuman (v2.2.0)',
    body: `Une transformation complète de l’ensemble des pages de l’écosystème Minerva. Adoption d’une esthétique ultra-haute densité, monochrome rehaussée de vert émeraude (#059669), chiffres tabulaires Geist/Mono, navigation par raccourcis clavier et suppression intégrale des widgets espacés au profit de bandeaux continus connectés.`,
    included_items: [
      'Vue d’ensemble repensée : Ruban télémétrique 5 métriques connecté, graphiques AreaChart épurés à courbe fine 1.5px et DonutChart 80px.',
      'Chat d’équipe Monolithique : Split-pane pleine hauteur, filtre instantané ⌘F, 44px top bar, flux dense avec micro-avatars et enregistreur vocal avec chronomètre.',
      'Contenu Minerva & Studio Réels : Jauge linéaire multi-plateforme 56px, grille calendrier monolithique Notion-style et sous-vues Opus Clip.',
      'Suivi ROI & Leads : En-tête compact 24px TB, comparatif SEO vs Ads en 2 colonnes 32px et zone d’importation hairlines 44px.',
      'Répertoire Clients & Suivi MRR : DataTable haute densité 40px, point d’état dynamique 6px et barre d’actions groupées flottante.',
      'Pipeline CRM & Projets : Cartes compactes 48-54px, synchronisation optimiste drag-and-drop et tableau 36px Linear Issues.',
      'Bannière de version automatique et menu utilisateur popover macOS / Linear.',
    ],
    image_url: '/changelog/overview-v2-2-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-1-0',
    version: '2.1.0',
    title: 'Chat d’Équipe Temps Réel & Pièces Jointes Multimédias',
    body: `Introduction de la messagerie instantanée en split-pane continue. Canaux par projet, discussions directes (DM), partage de fichiers sécurisé et lecteur de notes vocales intégré.`,
    included_items: [
      'Canaux automatiques rattachés aux projets et clients sous gestion.',
      'Support des pièces jointes images, audio, documents et GIFs.',
      'Filtre de recherche rapide par raccourci clavier ⌘F.',
    ],
    image_url: '/changelog/chat-v2-2-0.png',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-0-0',
    version: '2.0.0',
    title: 'Studio Réels & Automatisation IA Opus Clip',
    body: `Planificateur de contenus multi-plateforme (Instagram, TikTok, YouTube Shorts) avec synchronisation Google Drive et intégration du pipeline Opus Clip pour la découpe automatique de capsules vidéo.`,
    included_items: [
      'Calendrier éditorial visuel avec micro-pills et marqueur dynamique Aujourd’hui.',
      'Banque d’inspiration et de ressources internes de l’agence.',
      'Suivi des jobs de découpe IA Opus Clip et export automatisé.',
    ],
    image_url: '/changelog/content-v2-2-0.png',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
];

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>(STATIC_ENTRIES);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>('v2-2-0');
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchChangelogEntries();
        if (data && data.length > 0) {
          // Live entries are always newer than the static v2.4.3 bridge
          // entry (STATIC_ENTRIES predates the in-app changelog going
          // live) -- they sort first, with the static entry kept last as
          // historical continuity rather than forced to the top.
          const combined = [...data.filter((d) => d.version !== '2.2.0'), STATIC_ENTRIES[0]];
          setEntries(combined);
          setActiveId(combined[0].id);
        } else {
          setEntries(STATIC_ENTRIES);
          setActiveId(STATIC_ENTRIES[0].id);
        }
      } catch {
        setEntries(STATIC_ENTRIES);
        setActiveId(STATIC_ENTRIES[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageFadeIn className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 max-w-6xl mx-auto pb-16">
      {/* Left Sticky Sidebar (Shadcnblocks / Linear style) */}
      <div className="lg:sticky lg:top-20 lg:self-start space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-mv-ink tracking-tight">
            Nouveautés
          </h1>
          <p className="text-xs text-mv-ink-soft mt-1">
            Découvrez les dernières mises à jour et améliorations apportées à Minerva.
          </p>
        </div>

        {isAdmin && (
          <Link href="/changelog/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} className="bg-mv-ink hover:bg-black text-white text-xs h-7 px-3 rounded-[4px]">
              Nouvelle entrée
            </Button>
          </Link>
        )}

        {entries.length > 0 && (
          <div className="border-t border-mv-border/80 pt-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Sur cette page
            </p>
            <div className="space-y-1">
              {entries.map((entry) => {
                const isActive = activeId === entry.id;
                return (
                  <a
                    key={entry.id}
                    href={`#entry-${entry.id}`}
                    onClick={() => setActiveId(entry.id)}
                    className={`block p-2.5 rounded-[5px] transition-all ${
                      isActive
                        ? 'bg-white border border-mv-border shadow-2xs text-zinc-900 font-semibold'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{entry.title}</div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {entry.version && <span>v{entry.version} · </span>}
                      {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Content Feed */}
      <div className="space-y-6">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Dernières mises à jour
        </h2>

        {loading ? (
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <SkeletonText className="w-24 h-2.5" />
                <SkeletonText className="w-2/3 h-5" />
                <Skeleton className="w-full h-40 rounded-[6px]" />
                <div className="space-y-2 pt-1">
                  <SkeletonText className="w-full" />
                  <SkeletonText className="w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {entries.map((entry) => (
              <div
                key={entry.id}
                id={`entry-${entry.id}`}
                className="space-y-4 scroll-mt-24 pb-10 border-b border-mv-border last:border-b-0"
              >
                {/* Version & Date row */}
                <div className="flex items-center gap-2.5">
                  {entry.version && (
                    <span className="px-2 py-0.5 rounded-[4px] bg-zinc-100 border border-mv-border text-zinc-900 text-[11px] font-mono font-semibold">
                      v{entry.version}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 font-mono">
                    {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Title & Body */}
                <h3 className="font-semibold text-zinc-900 text-lg sm:text-xl tracking-tight">
                  {entry.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {entry.body}
                </p>

                {/* What's included card */}
                {entry.included_items && entry.included_items.length > 0 && (
                  <div className="bg-white border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-2">
                    <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-mv-green" /> Ce qui est inclus :
                    </p>
                    <ul className="space-y-1.5 pt-1">
                      {entry.included_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-mv-green mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Real In-App Screenshot Preview */}
                {entry.image_url && (
                  <div className="rounded-[6px] overflow-hidden border border-mv-border shadow-xs bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.image_url}
                      alt={entry.title}
                      className="w-full max-h-[440px] object-cover object-top"
                    />
                  </div>
                )}

                {entry.author_name && (
                  <p className="text-[11px] text-zinc-400 font-mono">Publié par {entry.author_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
