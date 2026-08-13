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

---

## 2026-08-12 — Typographie et sidebar

- Nouvelle police de titres : Fraunces (serif élégante), avec Inter pour le texte courant. Au passage, j'ai trouvé et corrigé un bug de CSS qui forçait discrètement tous les titres en serif système depuis un moment, peu importe la police configurée.
- La sidebar affiche maintenant ton rôle (Admin, Membre) à côté du logo plutôt qu'un nom fixe — la base pour l'espace de travail par rôle à venir.
- Bordure de la sidebar maintenant alignée avec celle du bandeau du haut.
- Nouvelle capacité technique : un item de navigation peut être marqué « Nouveau » pour signaler une section fraîchement lancée.

---

## 2026-08-12 — Ronde de finition

- Les chiffres bruts des 3 cartes KPI de la Vue d'ensemble (Clients, Leads, Projets en retard) sont maintenant accompagnés d'un petit graphique de répartition réelle (par statut/santé), pas juste un nombre.
- « Équipe » est maintenant au même endroit que « Mon profil » dans le menu utilisateur, plus dans la sidebar principale.
- Bordure de la sidebar et du bandeau du haut maintenant bien alignées ; le fil d'Ariane ne montre plus de UUID illisibles ni le mot anglais « new ».
- Le chronomètre (« Track Time ») est retiré — décidé inutile après usage.
- Nouveau : suivi réel de complétion des SOPs (bouton « Marquer comme complétée » sur chaque SOP), qui alimente une nouvelle étape de la liste de démarrage : « Terminer les SOPs liées à tes tâches ».
- Police des titres changée pour Times New Roman.
- Bouton « Nouveau » du bandeau simplifié en icône neutre plutôt qu'un gros bouton vert.
- Fond de page et fond des cartes rapprochés pour un contraste plus doux (moins de beige contre blanc pur).

---

## 2026-08-12 — Chantier 6 : portail client

- Nouveau portail client (`/portal`) : chaque client peut maintenant se connecter à son propre espace — aperçu de sa performance, calendrier éditorial partagé, messagerie de questions avec l'équipe.
- Chaque client peut être invité par lien sécurisé (bouton « Inviter au portail » sur sa fiche Suivi ROI), valide 14 jours.
- Un client redirige automatiquement vers son portail et n'a jamais accès au reste de l'application interne.

*Nouvelle migration en attente : `20260812000013` (portail client). Tant qu'elle n'est pas déployée, l'invitation et le portail ne fonctionneront pas.*

---

## 2026-08-12 — Suivi ROI : fin des chiffres inventés

- La fiche Suivi ROI d'un client affichait de fausses données impressionnantes (48 leads, 12 ventes, 85 000 $ de pipeline, deux graphiques inventés, deux vidéos de démo Google) dès qu'un client réel n'avait pas encore de métriques saisies. Retiré au complet : la page montre maintenant un état vide honnête tant qu'aucune donnée n'existe.
- Le graphique de tendance hebdomadaire vient maintenant des vraies données du client ; la répartition budgétaire compare le budget Google Ads réel au reste du budget investi, plus des canaux inventés.
- Les « créatifs vidéo top performance » viennent maintenant des vrais contenus publiés pour ce client (masqué s'il n'y en a pas), au lieu de deux vidéos d'exemple Google avec des statistiques inventées.
- Le rapport PDF exécutif ne prétend plus à une fausse « Certification Qualité 20-Points » systématiquement à 100 %.
- Badge « All Systems Live » traduit en « Suivi en direct » ; bouton Imprimer/Exporter PDF réduit à une simple icône.
- Composant de graphique à barres inutilisé (jamais importé nulle part, données de démonstration en anglais) supprimé du projet.

**Interface**
- La sidebar était plus large que nécessaire pour ses libellés — réduite pour coller à son contenu.
- Le contenu principal restait à largeur fixe même quand la sidebar était réduite, laissant un vide inutile ; il utilise maintenant tout l'espace disponible.
- Quelques montants encore affichés en convention anglaise (`$X/mo`, `$X setup`) corrigés en convention québécoise (`X $/mois`, `X $ mise en place`).

---

## 2026-08-12 — Typographie, alignement et descriptions d'usage

**Typographie**
- Nouvelle paire de polices : Georgia pour les titres, Helvetica Neue pour le texte courant (remplace Times New Roman / Inter).

**Vue d'ensemble**
- La carte « Revenu récurrent (MRR) » et la carte « Bien démarrer sur Minerva » sont maintenant toujours de la même hauteur — elles font partie de la même rangée de la grille au lieu de deux colonnes empilées indépendamment.
- Chacun des 4 raccourcis (Nouveau lead, Nouveau client, Planifier un reel, Voir les alertes) a maintenant une courte description sous son nom.

**Descriptions d'usage**
- Ajout ou réécriture d'une phrase d'usage concrète (quoi cliquer, quoi glisser) sous le titre de chaque section principale : Leads, Clients, Projets, Réels, Académie, Équipe, Facturation, et les 3 pages du portail client.

---

## 2026-08-12 — Chantier 7 (début) : mode sombre et pages de connexion en anglais

**Trouvaille majeure**
- Les pages Connexion et Créer un compte étaient restées entièrement en anglais depuis le début (« Log in to your account », « Sign up with Google », placeholder « jdoe.mobbin@gmail.com » qui référençait l'outil de design Mobbin) — traduites au complet.
- La page d'accueil de l'équipe (onboarding) offrait un sélecteur de devise USD/EUR qui ne faisait littéralement rien (l'app est CAD seulement partout ailleurs) — retiré.
- Le formulaire de création de compte affichait un badge « Strong » à côté du mot de passe peu importe ce qui était tapé — retiré plutôt que de laisser une fausse indication.

**Mode sombre**
- Une bonne dizaine d'endroits utilisaient encore du blanc, du gris ou des couleurs hexadécimales en dur (`bg-white`, `bg-[#00a800]`, `text-gray-700`, etc.) au lieu des jetons `mv-*` — invisibles ou illisibles en mode sombre. Corrigés dans les pages de connexion/inscription/accueil, le Kanban CRM, la fiche de lead, et le bandeau du haut.
- Les couleurs distinctes du Kanban CRM (Qualification en bleu, Proposition en violet) ont maintenant leur variante sombre plutôt que de rester pâles sur fond sombre.

**Nettoyage**
- Trois fichiers de l'ancien bloc sidebar shadcn (jamais utilisés depuis la reconstruction sur mesure) supprimés : `search-form.tsx`, `ui/sidebar.tsx`, `ui/sheet.tsx`.

---

## 2026-08-12 — Chantier 7 (suite) : recherche ⌘K élargie et vraies notifications push

**Recherche ⌘K**
- La recherche couvre maintenant aussi les SOPs de l'Académie (titre + description) et les contenus/reels (titre + légende), plus seulement les clients, projets et leads.

**Notifications push**
- La cloche du bandeau active maintenant un vrai abonnement Web Push (norme VAPID) en plus de la permission du navigateur — l'appareil reçoit des notifications même app fermée.
- Nouvelle route `POST /api/push/send` (authentifiée) qui envoie réellement les notifications aux appareils abonnés et retire automatiquement les abonnements expirés.
- Premier déclencheur réel branché : la création d'un nouveau lead notifie l'équipe. Le même mécanisme peut être réutilisé pour d'autres événements (projet en retard, etc.).

**Export CRM**
- L'export CSV du pipeline de leads (déjà fonctionnel, données réelles) couvre le besoin d'export Excel — aucun exporteur redondant ajouté.

*Nouvelle migration en attente : `20260812000014` (`push_subscriptions`). Sans elle, la cloche fonctionne (permission + notification locale) mais l'abonnement au vrai push échoue silencieusement en arrière-plan.*

---

## 2026-08-12 — Chantier 7 (fin) : facturation honnête, vrais liens Stripe, audit responsive

**Trouvaille majeure**
- La page Facturation affichait un historique de 4 « factures » entièrement inventées pour des clients qui n'existent pas (Apex Roofing, Clinique Dentaire Élite, etc.), un bouton « Simuler un Paiement Stripe » qui ne faisait que déclencher un faux événement interne, un « Taux de Recouvrement » fixé à 98.4 % sans aucune donnée réelle derrière, un statut « Stripe Connected » affiché pour tous les clients peu importe la réalité, et le mot « Centurion » dans une colonne visible. Tout ça retiré.
- À la place : un vrai bouton « Lien Stripe » par client qui appelle l'API Stripe (Price + Payment Link créés à la volée pour le MRR exact du client) via une nouvelle route `POST /api/stripe/create-payment-link`. Nécessite `STRIPE_SECRET_KEY` — échoue honnêtement (message clair, pas de faux lien) tant que la clé n'est pas configurée.

**Audit responsive (téléphone, 375px)**
- Les tableaux Kanban (CRM Leads, Projets, Réels) s'empilaient en 4 à 6 colonnes pleine largeur sur mobile, rendant la page immensément longue à faire défiler. Passés en défilement horizontal (comme sur desktop/tablette), chaque colonne gardant une largeur confortable.
- Le calendrier éditorial (Réels + portail client) écrasait ses 7 colonnes en bandes verticales étroites et illisibles sur mobile. Même correctif : défilement horizontal, cellules de taille normale.
- La barre de recherche + filtre de l'Académie écrasait le champ de recherche au point de couper son texte. Empilée verticalement sur mobile.
- La fiche membre de l'Équipe tronquait le nom quand le bouton d'action ne trouvait pas sa place à côté. Le bouton passe maintenant en dessous sur mobile.

**Env requis pour activer le reste** : `STRIPE_SECRET_KEY` (liens de paiement).

---

## 2026-08-12 — Stripe connecté et vérifié en direct

- `STRIPE_SECRET_KEY` (mode test) configurée. Premier lien de paiement réel généré et vérifié de bout en bout pendant la session (Price + Payment Link Stripe véritables, URL `buy.stripe.com` copiée automatiquement).
- Corrigé au passage : le compte Stripe a Managed Payments (taxes automatiques) activé par défaut, ce qui bloquait la création avec une erreur de code de taxe manquant. Désactivé spécifiquement pour ces liens plutôt que d'inventer un code de taxe au hasard.
- Nouvelle table `client_payment_links` (migration `20260812000015`) : chaque lien généré est maintenant conservé et affiché dans une nouvelle section « Liens de Paiement Générés » sur la page Facturation, avec son statut (en attente/payé/expiré).
- Nouveau `POST /api/webhooks/stripe` : quand un client paie réellement, le statut passe à « Payé » automatiquement — à condition d'enregistrer l'URL du webhook dans le Dashboard Stripe et de configurer `STRIPE_WEBHOOK_SECRET`.

*Reste à configurer sur Vercel : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, et éventuellement `STRIPE_WEBHOOK_SECRET`.*

---

## 2026-08-12 — Chantier 5 : rôles, invitations d'équipe, délégation de tâches

**Rôles**
- Un type `Role` inutilisé (`'Admin' | 'Manager' | 'Collaborateur'`) qui ne correspondait à aucune vraie valeur en base (les vrais rôles sont `admin` / `member` / `client`) a été corrigé pour refléter la réalité.
- La liste d'assignés d'un projet retombait sur deux noms inventés (« Alex Tremblay », « Sarah Bouchard ») quand elle était vide — retiré. Ce champ n'était de toute façon affiché nulle part ; la délégation de tâches ci-dessous le remplace par quelque chose de réel.

**Invitations d'équipe**
- Le bouton « Inviter un Collaborateur » sur la page Équipe ne faisait littéralement rien depuis le début — aucun gestionnaire de clic. Remplacé par une vraie fonctionnalité (`/team/invite`, réservée aux admins) : générez un lien valide 14 jours qui attribue automatiquement un rôle (Membre ou Admin) et un département au moment de l'inscription.
- Nouvelle page `/team/join?token=...` pour consommer le lien, sur le même modèle que l'invitation client déjà en place.

**Délégation de tâches**
- Nouvelle section « Tâches » dans la sidebar (avec badge du nombre de tâches qui vous sont assignées). Créez une tâche, assignez-la à un membre de l'équipe, liez-la optionnellement à un projet ou un client, suivez son statut (À faire / En cours / Terminé) par colonnes.
- Recherche ⌘K et menu « Nouveau » mis à jour pour inclure les tâches.

*Nouvelles migrations en attente : `20260812000016` (`team_invites`), `20260812000017` (`tasks`).*

---

## 2026-08-13 — Chantier 8 : nouveautés dans l'app, automatisation CI

**Nouveautés (in-app)**
- Le fichier `CHANGELOG.md` n'était visible que sur GitHub. Nouvelle page « Nouveautés » (accessible depuis le menu utilisateur) qui affiche les mêmes annonces dans l'app, avec image optionnelle par entrée. Publication réservée aux admins (`/changelog/new`).

**Automatisation**
- Nouveau pipeline CI GitHub Actions (`.github/workflows/ci.yml`) : vérifie le typage et le build à chaque push sur `main`. Nécessite que `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` soient ajoutés comme secrets GitHub (Settings → Secrets and variables → Actions) du dépôt — distinct des variables d'environnement Vercel. Sans ça, l'étape de build échouera (sans impact sur le déploiement Vercel, qui reste indépendant).
- Le déploiement automatique des migrations Supabase (pour éliminer le `npm run deploy:supabase` manuel) n'a pas été automatisé — appliquer des changements de schéma en production sur chaque push est un risque d'une autre nature que déployer du code, à valider avec vous avant de le mettre en place.

*Nouvelle migration en attente : `20260813000001` (`changelog_entries`).*
