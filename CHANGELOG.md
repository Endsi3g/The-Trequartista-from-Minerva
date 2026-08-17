# Changelog

Notes de version pour l'équipe Minerva Trequartista. Format minimaliste : date, ce qui a changé, rien de plus.

---

## 2026-08-17 (suite) — Audit complet post-déploiement : middleware, permissions, notifications, trigger CRM

Migrations `20260816000000`/`20260817000000`/`20260817000001` confirmées déployées et vérifiées en direct ; les 10 items de roadmap réels importés dans `minerva_roadmap_items`. Audit statique + navigateur (Chrome, session admin réelle établie sans mot de passe via un lien magique généré par l'API service-role) de l'app en entier, à la recherche de tout ce qui manque pour une app 100 % fonctionnelle.

**Trouvé et corrigé**
- `/produits` et `/voice-agent` étaient accessibles sans connexion — absents du matcher du middleware (`proxy.ts`), contrairement à toutes les autres pages du dashboard. Ajoutés.
- 4 des 7 interrupteurs de `/settings/notifications` ("Nouveaux leads attribués", "Conseils et guides", "Alertes de sécurité", "Mises à jour de facturation") n'avaient aucune colonne en base — ils affichaient un faux toast "Préférence enregistrée" sans rien sauvegarder. Remplacés par un état honnête : badge "Bientôt" désactivé pour les deux premiers, "toujours activé, non désactivable" pour les deux derniers.
- `/settings/notifications` et `/help` étaient des pages orphelines — aucun lien nulle part dans l'app malgré la structure documentée dans CLAUDE.md. Ajoutées au menu Paramètres (`UserMenu`).
- La permission `edit_client_financials` n'était appliquée que côté interface — la policy RLS `clients_write_team` restait `USING(true)` pour tous les utilisateurs authentifiés, y compris les comptes client-portail. Corrigé (migration `20260817000002`, déployée) : `clients_update_scoped`/`clients_delete_scoped` appliquent maintenant `member_can('edit_client_financials')`, exactement comme la page Permissions le promet déjà.
- `convert_lead_to_client_on_won()` réécrit avec les vrais noms de colonnes du schéma actuel (migration `20260817000003`, déployée) — marquer un lead "Gagné" créait jusqu'ici une erreur Postgres et annulait le changement de statut.
- Aucun compte admin n'existait en base (6 profils, tous `member` sauf un `client` de test) — les 5 sections admin-only étaient mortes pour tout le monde, y compris le compte fondateur. Le compte de Kael (theuprisingstudio@gmail.com) a été promu admin.
- Le bouton "Continuer avec Google" plantait avec une erreur Supabase brute non stylée — le fournisseur OAuth Google n'est pas activé côté Supabase alors que le bouton est affiché comme fonctionnel.

**Design** : la photo halftone du panneau gauche de `/login` et `/signup` remplacée par un dégradé organique animé (`components/ui/animated-mesh-background.tsx`), qui dérive lentement en CSS pur, respecte `prefers-reduced-motion`.

**Non corrigé, à traiter** : le bouton Google SSO cassé (fournisseur à activer dans le dashboard Supabase, hors de portée sans accès au projet).

---

## 2026-08-17 (suite 2) — Nettoyage données de test, notifications complètes

**Données de test retirées de la production** : le client "ROI Fix Test 1786580352780", son projet "QA Test Project 1786609702327" (+ ses `client_roi_metrics`/`client_payment_links`/`client_messages`/`project_launch_checks`), et le lead "Push Test Inc" — identifiés précisément par requête (`/test/i` sur les 4 tables clients/leads/projets/tâches), aucune donnée réelle touchée. Portefeuille clients réel confirmé intact après coup (Toitures Beauchemin, 44 leads Reach, 1 projet).

**"Nouveaux leads" et "Conseils et guides" complétés pour de vrai** (migration `20260817000004`, déployée) :
- Nouvelles colonnes `new_leads_enabled`/`tips_tutorials_enabled` sur `notification_preferences`.
- `/api/push/send` accepte maintenant un `preferenceKey` optionnel : exclut de la diffusion tout utilisateur ayant explicitement désactivé cette préférence. La création de lead (`/leads/new`) l'utilise déjà (`preferenceKey: 'new_leads_enabled'`) — c'était jusqu'ici une diffusion à toute l'équipe sans tenir compte d'aucune préférence.
- Constat en creusant le sujet : aucune des 3 préférences déjà "réelles" (Commentaires, Mentions, Nouveautés produit) n'était en fait branchée à un envoi réel non plus — seuls "Nouveau lead" et "Tâche en retard" envoient de vrais push, et ni l'un ni l'autre ne consultait `notification_preferences` avant aujourd'hui. Le rappel de tâches en retard (`/api/cron/task-reminders`) n'a pas encore été raccordé à `task_reminders_enabled` — à faire dans une prochaine passe si on veut que la préférence ait un effet réel partout, pas seulement pour les leads.
- "Conseils et guides" reste sans producteur de contenu (aucun système de tips/tutoriels n'existe dans l'app) — la préférence est maintenant réelle et persistée, mais rien ne l'utilise encore pour envoyer quoi que ce soit, comme "Nouveautés produit" avant elle.

---

## 2026-08-16 — Fondations design v3, présence d'équipe, coordonnées client, tournée de bugs

**Fondations visuelles (v3)**
- Fond crème chaud (`--mv-cream: #F0EDE0`) sur toute l'app, remplaçant le blanc/gris neutre de la v2 — matché directement contre Reach/Flow (les deux produits sœurs).
- Nouvelle police d'affichage **Playfair Display** (chargée via `next/font/google`, variable `--font-playfair`) pour tous les titres — Inter reste la police de corps/UI.
- Système de statut réellement multicolore : vert/ambre/violet/bleu/rouge (`--mv-purple`, `--mv-blue` ajoutés), `Badge` étendu avec les variantes `blue`/`purple`.
- Mode sombre **retiré complètement** (plus de toggle, plus de bloc `.dark` dans `globals.css`, `ThemeProvider`/`ThemeToggle` supprimés).
- Rayons de bordure et ombres alignés sur les valeurs exactes de Reach.

**7 pages de création refaites** (Leads, Tâches, Projets, Audits, Académie, Réels, Invitation équipe) sur le gabarit établi avec `clients/new` : formulaire en cartes sectionnées à deux colonnes + aperçu en direct, remplaçant les anciens formulaires plats à une colonne sans profondeur visuelle.

**Présence d'équipe en temps réel** — nouveau, via Supabase Realtime Presence
- Pile d'avatars dans la topbar (dashboard) + panneau listant chaque membre actif et la page exacte qu'il consulte.
- Badge discret côté portail client ("N membres Minerva en ligne") — volontairement **sans** le chemin de page exact, pour ne jamais exposer aux clients quelle page interne (ou quel autre client) un membre de l'équipe consulte.

**Coordonnées & réseaux sociaux pour les clients** — nouveau
- Téléphone, site web, fiche Google Business, Instagram, Facebook, LinkedIn : ajoutables à la création et modifiables depuis la fiche client (`/clients/[id]`, nouvelle carte "Coordonnées & réseaux").
- Première fonction `updateClient()` du projet — la fiche client n'avait jusqu'ici aucun moyen d'être modifiée après sa création.

**Fenêtre de confirmation stylée** — `ConfirmDialog` (nouveau, via `useConfirm()`) remplace tous les `window.confirm()` du navigateur (suppression de tâche/lead, révocation d'invitation, rejet de compte, réinitialisation de checklist).

**Bugs trouvés et corrigés pendant une tournée Playwright complète (compte client de test entièrement peuplé : client, métriques ROI, projet, tâches, reel, messages)**
- La création de reels échouait silencieusement : le formulaire envoyait `script_notes`, une colonne qui n'existe plus dans `content_posts` depuis une migration antérieure (le vrai champ est `caption`). Le reel n'apparaissait jamais dans le calendrier éditorial, sans aucun message d'erreur.
- La messagerie du portail client (`/portal/questions` et le mini-widget de `/portal`) n'indiquait jamais qui avait écrit un message — aucune identité d'expéditeur, bulle isolée sans repère visuel. Ajout du nom (et avatar côté page dédiée) au-dessus de chaque groupe de messages consécutifs.
- La cloche de notifications interroge la table `alerts` sur **chaque page** depuis un moment — cette table n'a jamais été créée (son producteur, `alert-engine.ts`, avait été supprimé comme code mort lors d'une session précédente sans que ce consommateur soit remarqué). Migration ajoutée ; en attendant son déploiement, la cloche échoue silencieusement (comportement inchangé, mais maintenant compris).
- Carte "Revenu récurrent (MRR)" de l'aperçu : hauteur du graphique élastique (`flex-1`) forçant un vide énorme au-dessus/en dessous des barres quand peu de clients existent — hauteur fixée.
- URL de logo Unsplash morte sur un ancien client de test — nettoyée (repli initiales déjà en place ailleurs).

**Suite du même jour — audit des fonctionnalités manquantes, exécuté**

- **Édition complète de la fiche client** : nom, secteur, statut, MRR, logo et contact — plus seulement les coordonnées/réseaux. Bouton "Modifier la fiche" sur `/clients/[id]`.
- **Appel manuel loggable** sur un lead : bascule Note/Appel dans le tiroir de détail, avec durée et résultat (Répondu, Pas de réponse, Rappeler, Numéro incorrect), formaté proprement dans l'historique de notes.
- **Producteur d'alertes réel** : la cloche calcule maintenant des alertes en direct (projets en retard, liens de paiement expirés) à partir des données déjà chargées, sans dépendre de la table `alerts` en attente de migration — la cloche affiche du vrai contenu dès aujourd'hui.
- **Jalons de projet** (nouveau) : table `project_milestones`, jalons avec titre/échéance/assigné/statut sur `/projects/[id]/roadmap`, remplaçant l'état vide permanent de cette page.
- **Approbation de contenu par le client** (nouveau) : chaque reel du calendrier portail mène à une fiche dédiée (`/portal/calendar/[id]`) avec Approuver / Demander une modification + commentaire, visible côté équipe sur la carte Kanban de `/content-planner`.
- **Trois retouches UI/UX signalées directement** : sidebar réorganisée en 5 groupes sémantiques (Principal, CRM, Livraison, Équipe, Croissance — remplace le fourre-tout "Données") ; badge `lime` recoloré (l'ancien ton `--mv-warm-tint` était quasi invisible sur les cartes blanches) ; poids de police plafonné à 700 dans `app/layout.tsx` (Inter + Playfair Display) — l'app entière paraissait trop grasse, un seul changement de config corrige tous les `font-extrabold`/`font-black` d'un coup.

**Migration en attente** (`20260816000000_pending_consolidated.sql`, mise à jour) : ajoute `clients.contact_phone`/`website_url`/`google_business_url`/`instagram_url`/`facebook_url`/`linkedin_url`, la table `alerts`, la table `project_milestones`, et `content_posts.client_approval`/`client_feedback`. Comme toujours, `npm run deploy:supabase` reste à lancer par un humain — cet environnement n'a pas d'accès direct au projet Supabase live.

**Suite du même jour — audit "regard neuf" du système Acquisition/Croissance + permissions**

- **Vert pré-v3 codé en dur dans 22 fichiers** (`#1E4B33`, jamais migré vers `#059669`) — graphiques, sidebar, avatars par défaut, PDF de proposition, bannière changelog, `manifest.json` PWA. Corrigé partout.
- **Système Acquisition/Audits IA testé de bout en bout** : entièrement honnête (aucune clé API réelle configurée → l'extraction IA échoue proprement avec un message clair), mais donc jamais utilisé en conditions réelles depuis sa construction. Statuts d'audit/proposition traduits en français (affichaient l'enum brut).
- **Système de permissions configurable** (nouveau) : page `/settings/permissions` (admin-only) avec 3 bascules réelles — suppression d'un lead, modification du MRR/statut d'un client, publication d'une SOP Académie. Appliqué à la fois côté interface et côté base de données (RLS via `public.member_can()`), pas seulement un bouton caché. Les admins gardent toujours l'accès complet ; les rôles restent à 3 (admin/membre/client), sans nouveau rôle intermédiaire.
- **Sidebar** : chaque groupe (Principal/CRM/Livraison/Équipe/Croissance/Aujourd'hui) est maintenant repliable individuellement, état mémorisé par section dans le navigateur.

**Migration `20260816000000_pending_consolidated.sql` confirmée déployée** (2026-08-17) — toutes les tables/colonnes vérifiées live.

**Audit de sécurité du système de permissions** — une vraie faille trouvée et corrigée : la policy RLS `content_posts_client_approve` limitait correctement la *ligne* qu'un client peut modifier, mais pas les *colonnes* — un appel REST direct (hors interface) aurait pu modifier le titre, le statut ou la vidéo d'un reel, pas seulement l'approbation. Ajout d'un trigger (`20260817000000_content_posts_client_column_guard.sql`, nouvelle migration séparée puisque le CLI Supabase suit les migrations par nom de fichier, pas par contenu) qui bloque toute modification hors `client_approval`/`client_feedback` de la part d'un compte client.

**22 SOPs importées depuis Notion via Composio MCP** — page « SOPs & Training — Agence » découpée en entrées individuelles consultables (Onboarding, Rôles & Rémunération, Outils & Systèmes, Ventes & Prospection, Gestion de compte, Support & QA — 6 nouvelles catégories ajoutées à l'Académie, contenu réel extrait et nettoyé, aucune donnée inventée).

---

## 2026-08-15 — Bug hunt : intégrité des données, échecs silencieux, portail client

**Portail client (`/portal`) — le plus grave**
- Le "Copilote Client" (chat) était entièrement simulé : aucun appel réseau, juste un délai artificiel affichant "Votre demande a été transmise à votre chef de projet Minerva" — rien n'était réellement transmis. Remplacé par une vraie messagerie branchée sur le canal `client_messages` déjà utilisé par `/portal/questions`.
- Retrait de toutes les données fictives montrées à de vrais clients : graphique de flux entièrement inventé, valeurs de repli codées en dur (142 appels, 18 400 $, 4.2x, 32 %), et une carte affichant le mauvais champ (`total_generated` au lieu de `pipeline_value`).
- `portal/page.tsx` et `portal/layout.tsx` migrés des classes Tailwind brutes (`neutral-*`/`emerald-*`) vers les tokens `--mv-*` du reste de l'app.

**Échecs silencieux corrigés** (l'utilisateur croyait qu'une action avait réussi alors que rien n'avait été sauvegardé)
- Suppression d'un lead, coche/réinitialisation de la checklist de lancement, changement de statut d'un reel, sauvegarde de la configuration Notion : les quatre ignoraient le résultat de l'appel Supabase. Corrigés avec retour en arrière visuel + message d'erreur.
- Ajout d'une confirmation avant de réinitialiser la checklist de lancement (20 points effacés d'un clic auparavant).
- Le tiroir de détail d'un lead gardait les données de l'ancien lead en changeant de sélection sans le fermer — corrigé.

**Autres corrections**
- Photo de logo client cassée (URL Unsplash morte) sans repli — affecte maintenant un avatar de secours partout où un logo client s'affiche.
- Texte illisible (crème sur crème) sur le badge "lime" utilisé à 8 endroits (tags SOP, statut d'audit, etc.).
- Message d'erreur Composio mentionnant littéralement ".env.local" même en environnement déployé.
- En-tête mobile de connexion/inscription : logo et lien "Créer un compte" se chevauchaient à 390px de large.
- Tableaux Clients/Leads/Équipe : se compressaient au lieu de défiler horizontalement sur mobile.
- Couleurs bleu/violet codées en dur dans le Kanban des leads (contraire à la règle d'accent unique) — remplacées par une intensité de vert.

---

## 2026-08-15 — Version 2.1.0 : Voice Agent Pixel-Perfect, Onboarding 5 étapes & ElevenLabs Réel

**Voice Agent Dashboard (`/voice-agent`) — Pixel-Perfect**
- Refonte complète de la page selon la maquette de référence `AI Voice Agent Dashboard UI/UX Design` : header `Dashboard`, 4 StatCards monochromes (Calls Answered 270, Minutes 562, Cost Saved $120, Resolved 127), graphe `Call Volume` avec ligne Inbound sombre et ligne Outbound grise, Reference Line `Jan 16`, liste `Recent Calls` identique à la maquette.
- Volet Copilote ⚡ Operator **supprimé** de la vue d'ensemble et de la page Voice Agent — conformément à la directive explicite.
- Deux onglets : **Dashboard** (monitoring) + **Configuration** (voix ElevenLabs, prompt système, simulateur live).
- Appels récents **cliquables** → modal de transcription complète avec timeline horodatée, bulles agent/prospect et statut.

**ElevenLabs — Intégration Réelle (non simulée)**
- Remplacement de l'ancienne simulation par `@elevenlabs/react` (package officiel `ConversationProvider` + `useConversation`).
- Token de conversation signé côté serveur via `/api/elevenlabs/token` — la clé API brute n'est jamais exposée au navigateur.
- 6 vraies voix ElevenLabs sélectionnables : Rachel, Domi, Bella, Antoni, Arnold, Adam.
- Waveform live réactif à l'état speaking/listening, bouton mute/unmute microphone en temps réel.

**Onboarding — 5 Vraies Étapes avec Thème Vert**
- Reconstruction complète en 5 étapes réelles : Profil (photo, nom, bio), Rôle (intitulé + département), Équipe (taille + invitations), Préférences (page d'accueil, fuseau, langue), Terminé (animation + redirection).
- Barre de progression animée verte `#1E4B33`, boutons et accents verts sur l'ensemble du formulaire.
- Protection du rôle client : redirection automatique vers `/portal` si `role === 'client'`.

**Sidebar Workspace Switcher**
- Cercle/badge noir (LogoMark) remplacé par un avatar carré vert `M` (Minerva, `#1E4B33`).
- Label `Espace de travail` plus lisible.

**Font Pairing**
- Confirmation : Inter (déjà installé et configuré globalement) — style identique à Linear et Notion. Aucune dépendance supplémentaire.

**Vue d'ensemble (`/overview`)**
- Suppression du volet Copilote ⚡ Operator.
- Appels récents cliquables → modal de transcription complète.
- Icônes différenciées : vert pour inbound, neutre pour outbound.

---

## 2026-08-15 — Version 2.0.0 : Nouvelle Interface AI Voice Agent, Refonte du Portail Client & Onboarding Pixel-Perfect

**AI Voice Agent Dashboard (`/overview` & `/voice-agent`)**
- Refonte complète de la vue d'ensemble selon la maquette AI Voice Agent (4 StatCards d'appels et de conversion, double courbe Inbound/Outbound, histogramme d'appels, journal d'appels récents).
- Intégration du volet Copilote IA `⚡ Operator` interactif à droite.
- Création de la console dédiée `/voice-agent` avec configuration des voix ElevenLabs, prompt système et simulateur d'appel vocal en direct.

**Portail Client & Gestion des Rôles (`/portal` & `/portal/join`)**
- Séparation stricte des rôles : les clients invités rejoignent désormais exclusivement le rôle `client` et sont isolés sur leur portail personnalisé.
- Refonte intégrale du Dashboard Client (`/portal`) avec 4 StatCards de performance (leads, appels IA, valeur générée, conversion), flux d'acquisition et volet Copilote Client.
- Nouvelle page d'invitation client sécurisée (`/portal/join`).

**Onboarding & Workspace Switcher**
- Refonte pixel-perfect de l'onboarding (`/onboarding`) conforme à la maquette de référence (étape 1/5, upload d'avatar avec placeholder +, toggle de notifications, mockup complet d'espace de travail).
- Sélecteur minimaliste d'espace de travail (`Minerva Workspace ▾`) en tête de barre latérale et replacement du profil utilisateur en pied de barre.

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

---

## 2026-08-13 — Chantier 5 (approfondissement) : facturation admin seulement, tâches avancées

**Facturation réservée aux admins**
- Première vraie différence de permissions entre rôles dans l'app : n'importe quel membre pouvait auparavant voir tout le détail MRR et générer de vrais liens de paiement Stripe. Désormais réservé aux admins — page bloquée, lien retiré du menu, et la route `/api/stripe/create-payment-link` elle-même refuse la requête (pas seulement l'interface).

**Tâches avancées**
- Une tâche peut maintenant être liée à un lead, pas seulement un projet ou un client.
- Chaque tâche a sa propre page (`/tasks/[id]`) avec un fil de commentaires réel.
- Nouveau : rappel automatique par notification push pour les tâches en retard, via une tâche planifiée Vercel Cron quotidienne (`/api/cron/task-reminders`). Nécessite `CRON_SECRET` (optionnel mais recommandé) en plus des clés VAPID déjà documentées.
- Corrigé au passage : la jointure vers les profils échouait silencieusement côté navigateur (deux clés étrangères ambiguës vers `profiles`) — les tâches ne se chargeaient jamais tant que ce n'était pas précisé.

*Nouvelles migrations en attente : `20260813000002` (permissions facturation), `20260813000003` (lead lié + commentaires de tâches).*

---

## 2026-08-13 — Toutes les migrations déployées ; Chantier 5 : dernier tour

**Migrations** : les 13 migrations en attente ont été appliquées par vos soins. Vérifié en direct : création de tâches, commentaires, sous-tâches, notifications, page Nouveautés — tout fonctionne désormais sans dégradation.

**Charge de travail équipe** — nouvelle page `/team/workload` (admins seulement) : nombre de tâches par membre (à faire / en cours / terminé), avec les tâches en retard mises en évidence et cliquables.

**Révocation d'invitation** — un admin peut maintenant invalider un lien d'invitation avant l'expiration de 14 jours, plutôt que d'attendre.

**Sous-tâches** — chaque tâche a maintenant une liste de sous-tâches à cocher, avec barre de progression.

**Chantier 5 est maintenant complet.** La feuille de route dans `CLAUDE.md` a été renumérotée pour correspondre à la planification d'origine (les 8 chantiers sont tous livrés, mais construits dans un ordre différent — voir `CLAUDE.md` pour le mapping exact).

*Nouvelle migration en attente : `20260813000004` (sous-tâches + révocation d'invitation).*

---

## 2026-08-13 — Audit complet de l'app : ponts manquants et données honnêtes

Balayage systématique de toute l'application (pas un chantier planifié — une demande de « trouve et corrige tout ce qui manque, sans que j'aie à insister »).

**Corrigé**
- Le pipeline CRM était cassé en silence : marquer un lead « Gagné » plantait côté base de données (mauvaises colonnes) et l'échec n'était jamais affiché — le lead restait « Gagné » à l'écran sans qu'aucun client ni projet ne soit créé.
- `/clients` affichait un delta de MRR et un taux de rétention inventés ; retirés. Le repli du logo client était une photo stock — remplacé par un avatar à initiales généré, comme partout ailleurs dans l'app.
- Nouvelle fiche client complète (`/clients/[id]`) : projets, leads, tâches, liens de paiement, contenus et messages du portail, tous réels. Le tableau `/clients` n'y menait nulle part avant.
- Le bouton « Nouveau Projet » ne faisait rien ; nouvelle page `/projects/new`.
- L'upload de photo de profil échouait sans le moindre message d'erreur.
- L'onglet OKR de la fiche de performance était vide en permanence, sans explication, avec un bouton « + Nouvel OKR » mort. Le « Prochain 1-on-1 » est maintenant réellement modifiable (c'était en lecture seule malgré le texte de la page qui promettait de pouvoir le planifier).
- La page Intégrations affichait « Connecté » pour Google Calendar (jamais implémenté, fonction factice supprimée) et l'import vidéo par URL (toujours en échec côté serveur) — statuts corrigés pour refléter la réalité.
- Le Kanban du planificateur de contenu promettait le glisser-déposer depuis toujours ; jamais câblé. C'est fait.
- Police d'affichage remplacée : Georgia (serif) → Sora + Inter.

*Nouvelles migrations en attente : `20260813000005` (correctif du déclencheur lead→client), `20260813000006` (contrainte unique pour le 1-on-1 planifiable).*

---

## 2026-08-13 — Nouveau système d'acquisition & d'audit IA

Nouveau système de bout en bout, en dehors des 8 chantiers d'origine : capture de leads depuis le site Framer, relance SMS automatique, moteur d'audit IA post-appel de diagnostic, générateur de propositions PDF, et livrable web interactif pour le client.

**Capture de leads & relance SMS**
- `/api/leads/step-1` et `/step-2` : webhooks publics pour le formulaire Framer (Étape 1 = prénom + téléphone, Étape 2 = qualification). Le domaine Framer exact doit être renseigné dans `FRAMER_ORIGIN` avant mise en ligne.
- Relance SMS 5 minutes après un abandon à l'Étape 1, planifiée par lead via Upstash QStash plutôt qu'une tâche périodique — timing précis sans plan Vercel payant.
- Un lead qualifié crée automatiquement une vraie carte dans le pipeline CRM (`/leads`).

**Moteur d'audit IA** (`/audits`, admin seulement)
- Transcription collée manuellement (fonctionne toujours) ou récupérée via Granola/Composio (câblage non vérifié en conditions réelles — répond honnêtement « non disponible » en attendant).
- Extraction par Claude : goulots d'étranglement, coûts cachés, compatibilité des outils, initiatives IA avec score impact/effort. Les montants en dollars sont calculés côté serveur à partir des taux horaires configurés (`/settings/audit-reference`), jamais inventés par le modèle.

**Proposition & livrable client**
- PDF généré et envoyé par courriel (Brevo) avec lien de réservation Calendly pour le 2e appel.
- Page client interactive et sécurisée par jeton (`/audit/view`) : diagramme avant/après, matrice impact/effort, réactions et commentaires en direct.

**Tableau de bord** (`/acquisition`, admin seulement) : leads captés, SMS envoyés, taux de qualification, audits complétés, propositions envoyées.

Toutes les clés API (Twilio, Anthropic, Brevo, Calendly, QStash, Composio) restent à configurer — chaque intégration répond honnêtement « non configuré » plutôt que de simuler un succès. Voir `.env.example` pour la liste complète.

*Nouvelles migrations en attente : `20260813000007` (leads entrants), `20260813000008` (audits, propositions, données de référence). Nouveau bucket Storage `proposals` à créer manuellement dans le dashboard Supabase (comme `client-assets`/`team-documents`/`academy-media`).*

---

## 2026-08-15 — Refonte marque Minerva Reach, OAuth Composio réel, 8 nouveaux blocs Paramètres

Rebrand complet aligné sur le produit jumeau Minerva Reach (`minerva-os-lite-desktop`), et huit nouvelles interfaces de paramètres/onboarding reconstruites depuis des maquettes shadcnblocks avec de vraies données à chaque fois.

**Marque : palette Forêt & Crème + Playfair Display / Plus Jakarta Sans**
- Toute la palette `--mv-*` (clair et sombre) recalculée sur les couleurs exactes de Minerva Reach — y compris les graphiques (`components/charts/*`), le PDF de proposition et le diagramme d'audit, qui codaient leurs couleurs en dur.
- Polices Sora/Inter remplacées par Playfair Display (titres) / Plus Jakarta Sans (corps) partout.

**Sidebar reconstruite** sur le modèle de Minerva Reach : items épinglés, catégories repliables (masquées pour les non-admins), section « Aujourd'hui » (clients/projets récents réels), widget « Démarrage » branché sur la vraie progression d'onboarding, menu de compte dans l'en-tête ET dans le coin supérieur droit de la barre du haut.

**Intégrations — vraies connexions OAuth via Composio**
- `/integrations` : grille (pas une liste) de 17 apps réellement utilisées par l'agence (Gmail, Notion, GitHub, Stripe, Supabase, etc.), avec vrais logos (GLINCKER/thesvg), connexion/déconnexion OAuth réelle via `@composio/client` (admin seulement), indicateur vert pulsant pour les connexions actives, filtres par catégorie sous forme de chips horizontales, « Voir plus » pour n'afficher que 6 apps par défaut, squelettes shimmer pendant le chargement.
- Le testeur de webhook ROI (bouton existant, jamais fonctionnel) envoyait les mauvais noms de champs et aucune autorisation — corrigé avec une vraie route de test serveur (admin seulement).
- Import de SOPs Notion vers l'Académie (admin, déclenché manuellement) : sélectionne des pages Notion, importe leur contenu réel en fiches SOP.

**Paramètres refaits** : Profil (édition + aperçu en direct, nouveaux champs bio/localisation/réseaux), Notifications (bascules groupées, vraiment persistées), Membres (recherche, changement de rôle en direct), Onboarding (5 étapes au lieu de 3, la vue de démarrage choisie est maintenant vraiment mémorisée pour les connexions futures).

**Nouveau** : page `/help` (FAQ réelle sur les fonctionnalités de l'app), bandeau automatique annonçant la dernière entrée Nouveautés (lien vers `/changelog`, ne réapparaît pas une fois fermé sauf nouvelle entrée), page Nouveautés redessinée avec version + liste « ce qui est inclus » + navigation latérale, effet de fondu au défilement sur les longues listes (FAQ, nouveautés), écran de chargement personnalisé au démarrage de l'app.

**Corrections suite aux tests en direct**
- L'onboarding vivait par erreur dans le même gabarit que le reste de l'app (sidebar/topbar visibles pendant la configuration du compte) — déplacé vers son propre flux plein écran, avant l'accès à l'espace de travail.
- Accent décoratif unifié en vert partout (le badge « Nouveau » d'Équipe était ambre).
- Les compteurs « 1 » à côté de Clients/Leads/Projets dans la sidebar n'apportaient aucune information utile — retirés.
- Espacement corrigé entre l'icône et « Minerva » dans le fil d'Ariane (trop collés).
- Menu de compte ajouté dans le coin supérieur droit de la barre du haut (en plus de celui du pied de sidebar).

*Nouvelles migrations en attente : `20260815000001` (profils étendus + nouveautés structurées + préférences de notifications), `20260815000002` (suivi d'import Notion), `20260815000003` (vue par défaut du profil). Clé `COMPOSIO_API_KEY` fournie invalide (format ne correspondant pas à une clé projet) — à revérifier dans le dashboard Composio avant que les connexions OAuth ne fonctionnent réellement.*

---

## 2026-08-15 — Refonte du fond d'app, éradication de l'ambre, bug de photo de profil, agent vocal ElevenLabs

**Corrigé**
- La sidebar poussait son pied (Démarrage, Paramètres & Plus, compte) hors de l'écran sur les pages hautes — la coquille de l'app utilisait `min-h-screen` (hauteur minimale, extensible) au lieu de `h-screen` (hauteur fixe), donc toute la page défilait plutôt que juste le contenu central. Corrigé : la sidebar reste fixe, seul le contenu principal défile.
- La photo de profil en haut à droite ne se mettait jamais à jour après modification sur `/profil` : chaque instance de `useCurrentUser()` (sidebar, barre du haut, 14 pages) faisait sa propre requête unique au montage, sans lien entre elles. Remplacé par un contexte partagé (`CurrentUserProvider`) avec `refresh()`, appelé après chaque sauvegarde de profil/avatar.
- Le fond de l'app ne reprenait pas vraiment celui de Minerva Reach : leurs jetons de couleur Forêt & Crème étaient corrects, mais leur coquille d'app réelle utilise un blanc pur + gris neutre (`#f4f4f3`), pas les tons crème. `--mv-surface`/`--mv-cream-soft`/`--mv-border` alignés sur ces valeurs exactes (le crème reste réservé aux pages plein écran comme l'accueil/onboarding).
- Flou de la barre du haut (`backdrop-blur`) retiré — fond opaque uni.
- L'accent ambre/orange restant (23 fichiers, badges, jauges, graphiques) est maintenant du vert partout, y compris les états d'avertissement — une seule couleur d'accent dans toute l'app.
- `/leads` et `/projets` chargeaient sans aucun état de chargement (flash de contenu vide) — squelettes ajoutés.

**Nouveau**
- Animation d'entrée (fondu + léger décalage, via Motion) sur les 8 pages principales.
- Agent vocal Minerva (ElevenLabs Conversational AI) intégré dans `/acquisition` : appel de test en direct dans le navigateur (WebRTC, jeton de session émis côté serveur, clé API jamais exposée au client), vérifié fonctionnel de bout en bout contre l'API réelle. Webhook post-appel (`/api/webhooks/elevenlabs-post-call`) prêt à créer automatiquement un vrai lead qualifié dès qu'un appel se termine, une fois configuré côté ElevenLabs.

**Webhook post-appel ElevenLabs configuré et vérifié en production** — créé via l'API workspace ElevenLabs et rattaché à l'agent (`post_call_webhook_id`), pointant vers `https://minerva-trequista.vercel.app/api/webhooks/elevenlabs-post-call`. Confirmé déployé et actif (rejette correctement les requêtes non signées avec 401).

*À faire : appliquer `npm run deploy:supabase` (accès MCP Supabase disponible mais connecté à un compte différent — Minerva OS Lite/Minerva Flow/Minerva OS/Aurevia, aucun ne correspond au projet Trequartista, donc impossible de le faire à ta place). Corriger `COMPOSIO_API_KEY` — l'installateur CLI officiel exige WSL (non disponible ici) et l'ancien CLI npm (`composio-core`) a son backend de connexion désactivé (410) ; le plus simple reste de recopier la clé depuis Settings → Project Settings → API Keys sur composio.dev. Ajouter `ELEVENLABS_WEBHOOK_SECRET` (valeur dans `.env.local`, jamais commitée) aux variables d'environnement de production Vercel (je n'ai pas accès à ce panneau).*
