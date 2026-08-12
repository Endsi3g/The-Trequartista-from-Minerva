# Changelog

Notes de version pour l'équipe Minerva Trequartista. Format minimaliste : date, ce qui a changé, rien de plus.

---

## 2026-08-12 — Chantier 1 : marque, sidebar, bandeau du haut

**Corrigé**
- L'inscription (`/signup`) plantait pour tout le monde depuis un certain temps (erreur 500). C'est réparé.
- Le formulaire de connexion ne montrait aucun signe de chargement pendant l'envoi.
- Une faille de sécurité dans la base de données faisait planter silencieusement la lecture des profils en dehors du sien propre (touchait la page Profil et le nouveau menu utilisateur).

**Marque**
- Plus aucune mention de « Supabase » ou de « Centurions » nulle part dans l'app. « Minerva Trequartista » reste uniquement dans le logo, l'onglet du navigateur et l'écran de connexion.

**Sidebar**
- Reconstruite au complet sur le modèle de Minerva Flow : se réduit maintenant à rien du tout (juste le bouton pour la rouvrir), sélecteur d'espace de travail sous le logo, menu utilisateur en bas (profil, paramètres, déconnexion).
- « Feedback » et la carte d'essai gratuit ont disparu. « Inviter l'équipe » est maintenant dans Paramètres.
- Se ferme automatiquement sur mobile après un clic sur un lien.

**Bandeau du haut**
- La recherche (⌘K) floute maintenant toute l'application, pas seulement le contenu — et cherche dans vos vraies données (clients, projets, leads).
- Le chronomètre (« Track Time ») est maintenant un vrai suivi de temps par projet, plus une simple alerte.
- « New » propose un vrai menu (nouveau lead, nouveau client).
- Le bouton plein écran a été retiré.
- Les notifications demandent maintenant la permission du navigateur avant de s'activer.

*Migrations en attente de déploiement : `time_entries` (chronomètre) et le correctif RLS des profils.*

---

## 2026-08-12 — Chantier 2 : vue d'ensemble

**Vue d'ensemble**
- La timeline de projets (3 rangées inventées) est remplacée par vos vrais projets.
- Le graphique « Profit & Loss » (faux, en USD) est remplacé par un vrai graphique de MRR par client, en dollars canadiens seulement — plus aucun sélecteur de devise.
- Les 4 raccourcis (« Send an invoice », etc., non fonctionnels) sont remplacés par 4 vrais raccourcis : nouveau lead, nouveau client, planifier un reel, voir les alertes.
- La carte « Workflow Plus » (essai 14 jours) est remplacée par une vraie liste de démarrage qui suit votre progression réelle (profil complété, notifications activées, Notion connecté, Académie visitée).
- Le message d'accueil est maintenant entièrement en français.
- Ordre de priorité : clients → leads → projets en retard, comme demandé.

---

## 2026-08-12 — Chantier 4 : académie, équipe, profil

- Académie : retrait du badge « Video Tutorials Engine ».
- Fiche de performance d'équipe : plus d'employé fictif — titre, date de rendez-vous, compétences (incluant la mention Supabase) et historique étaient tous inventés. Remplacés par les vraies données quand elles existent, par un état vide honnête sinon.
- Profil : retrait complet du système de clés API (jamais vraiment utilisé) et de l'onglet Sécurité qui prétendait à tort qu'une double authentification était active. Remplacé par un vrai changement de mot de passe fonctionnel.

---

## 2026-08-12 — Chantier 3 : réels

- Chaque reel a maintenant sa propre page (`/content-planner/[id]`) avec tout dessus : aperçu, légende, hashtags, statut et son historique, client, métriques, notes internes, lien vers la publication native. Fini le panneau superposé sans adresse propre.
- Le calendrier éditorial est maintenant la vue par défaut, sur le vrai mois en cours, avec navigation mois précédent/suivant.
- Les 3 contenus inventés et la vidéo de démo Google réutilisée partout ont disparu — tout vient de vraies données.
- Le client dans le formulaire de planification vient maintenant de votre vrai Portefeuille Clients.
- Téléversement de vidéo par glisser-déposer, ou lien externe — les deux fonctionnent.

*Nouvelle migration en attente : `20260812000011` (colonnes du reel détaillé). Tant qu'elle n'est pas déployée, la création/modification de reels ne fonctionnera pas.*

---

## 2026-08-12 — Ajustements

- Le logo de la sidebar n'affiche plus le nom « Trequartista » — juste l'icône.
- Les boutons Calendrier/Kanban/Bibliothèque Médias du planificateur de contenu restent lisibles sur petit écran au lieu de se faire couper.
- Toutes les fenêtres superposées restantes (nouveau client, nouveau lead, nouveau reel, créer une SOP, voir une SOP) sont maintenant de vraies pages avec leur propre adresse, comme demandé.
