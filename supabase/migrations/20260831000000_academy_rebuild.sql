-- Academy rebuild: real ordering/onboarding-path columns on academy_sops,
-- a JSONB block-content column so SOPs render/edit through the same
-- BlockEditor used by /documents instead of a plain read-only markdown pass,
-- and a one-time seed of the previously-hardcoded DEFAULT_ACADEMY_SOPS array
-- (lib/services/supabase-data.ts) so the database becomes the sole source of
-- truth -- that array and its shadowing logic are removed in this same PR.
--
-- content_markdown is kept as a fallback/search source; content_json is the
-- new primary rendering format. Two of the twenty seeded SOPs were rewritten
-- for accuracy before seeding (an MCP-tools list missing the 5 Plane tools
-- added 2026-08-27, and a guide describing a fictional "Claude Code artifact
-- linking" step plus a full features manual for Minerva Reach -- a separate
-- product this repo has no access to and cannot verify).
--
-- read_time_min/author are added as the columns the app's AcademySOP type
-- actually reads; the existing estimated_minutes/author_id columns are left
-- in place unused (grepped: no code references either) rather than dropped,
-- since this environment cannot verify all consumers of a live project.

ALTER TABLE public.academy_sops
    ADD COLUMN IF NOT EXISTS content_json JSONB,
    ADD COLUMN IF NOT EXISTS is_essential BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_onboarding_step BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sort_order INT,
    ADD COLUMN IF NOT EXISTS pillar TEXT,
    ADD COLUMN IF NOT EXISTS read_time_min INT DEFAULT 15,
    ADD COLUMN IF NOT EXISTS author TEXT;

CREATE INDEX IF NOT EXISTS academy_sops_onboarding_idx
    ON public.academy_sops (is_onboarding_step, sort_order)
    WHERE is_onboarding_step = true;

-- Auto-generated from the retired DEFAULT_ACADEMY_SOPS array.
-- content_json computed by lib/utils/markdown-to-blocks.ts from the same
-- content_markdown kept alongside it as a plain-text fallback/search source.

-- sop-anti-friction-master
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Système Anti-Friction : Architecture d’Offre Complète (4 Piliers)',
  'Framework stratégique directeur "Donner d’abord, demander ensuite" appliqué aux 4 piliers : Minerva Flow, Minerva Reach, Agence Sur Mesure et Mes Inspirations.',
  'Stratégie & Offre',
  '# MINERVA — SYSTÈME ANTI-FRICTION : ARCHITECTURE D''OFFRE COMPLÈTE

> Framework dérivé de l''analyse "avocat du diable" sur l''offre d''appel restaurateurs.  
> Appliqué à chaque pilier de l''agence : Flow, Reach, Agence Sur Mesure, Mes Inspirations.

---

## PRINCIPE DIRECTEUR

Chaque pilier partage le même défaut structurel par défaut : **il demande avant de donner**. Le prospect doit fournir ses chiffres, son temps, sa confiance — avant d''avoir reçu une seule preuve de valeur. Ce framework inverse systématiquement l''ordre : **donner d''abord, demander ensuite**.

Les 4 failles s''appliquent à chaque pilier différemment, mais le remède est toujours le même :  
→ Réduire l''effort du prospect à zéro sur le premier contact  
→ Livrer la moitié du travail avant qu''il ait dit oui  
→ Neutraliser le risque opérationnel dans l''offre elle-même  
→ Rendre la passerelle vers le niveau suivant évidente et naturelle

---

## PILIER 1 — MINERVA FLOW (SaaS Restos & Cafés)

### Faille #1 — Friction de la donnée
- **Le piège :** Demander relevés Uber Eats, exports de caisse, ou coûts de staff avant de montrer quoi que ce soit.  
- **Correction :** Audit public proactif. Prix menu sur Google Maps / site web vs prix majorés sur UberEats. Volume estimé à partir des avis Google (fourchette basse, assumée transparemment). Livraison : vidéo 60 secondes personnalisée avec chiffre précis.  
- **Message :** *« On a regardé votre menu sur Uber Eats. Sur votre [plat signature], vous perdez environ X$ par commande. On a simulé ça en une minute — voici le lien. »*

### Faille #2 — Rapport qui prend la poussière
- **Le piège :** Envoyer un beau PDF d''audit que le proprio regarde une fois et range.  
- **Correction :** Avec l''audit, envoyer un lien vers son menu **déjà pré-configuré en démo** sur Minerva Flow (5 plats, interface réelle, rien de public). Pas un livrable — une démo vivante. Il voit son restaurant dans l''outil avant d''avoir signé quoi que ce soit.  
- **Précaution :** Framer comme une démo, pas comme un acte unilatéral. *« On a pris 5 minutes pour recréer vos plats signature dans l''interface — c''est juste pour que vous visualisiez. Rien n''est en ligne. »*

### Faille #3 — Peur du bug pendant le rush
- **Le piège :** Positionner Minerva Flow comme remplacement du système existant. Le proprio imagine son samedi soir en chaos.  
- **Correction :** Canal parallèle exclusivement pour clients fidèles/emporter. Protocole test de 5 minutes avec l''équipe présente. Inclure dans l''offre : une fiche plastifiée d''une page pour le comptoir + option d''un briefing d''équipe de 15 min (en personne ou vidéo) avant le premier service.  
- **Message :** *« On branche une commande test sur votre imprimante actuelle. Si ça prend plus de 5 minutes ou que votre équipe hésite — vous ne lancez rien. »*

### Faille #4 — Pas de passerelle naturelle vers l''agence
- **Le piège :** Résoudre le problème de commission → le client est content → aucune raison de payer plus.  
- **Correction :** Repositionner l''upsell agence en **rétention, pas acquisition**. *« Minerva Flow vous économise 30% par commande. Maintenant : comment on fait pour que vos clients Uber commandent directement chez vous la prochaine fois ? »* Les clients existent déjà. Il s''agit de les récupérer — pas d''en trouver de nouveaux. C''est une conversation infiniment plus facile.  
- **Upsell naturel :** Optimisation fiche Google Business + QR codes sur emballages + campagne SMS clients existants.

### Règles d''exécution spécifiques — Flow
- **Timing de contact :** Mardi ou mercredi, 14h30–16h. Jamais vendredi soir, jamais lundi matin.
- **Canal :** Visite physique pour les indépendants (Plateau, Villeray, Rosemont). Instagram DM en backup.
- **Preuve sociale :** Toujours un nom local. *« On travaille déjà avec X café dans Rosemont. »* Aucune référence nationale générique.
- **Staff :** Le vrai bloquant n''est pas le proprio — c''est la caissière ou le cuisinier. L''offre inclut un protocole d''onboarding équipe dès le jour 1.

---

## PILIER 2 — MINERVA REACH (Prospection Automatisée Québec)

### Faille #1 — Friction de la donnée
- **Le piège :** Demander l''accès au CRM, une liste de prospects, ou les critères de ciblage avant de commencer.  
- **Correction :** Construire la première liste **pour eux** depuis des sources publiques (LinkedIn, Google Maps, Pages Jaunes, Sites sectoriels QC) avant le premier appel. Livrer une liste de 50 prospects qualifiés avec contexte (taille, secteur, signal d''achat récent) comme pré-cadeau de la conversation.  
- **Message :** *« Avant qu''on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre ICP et qui ont un signal d''achat actif. Voici la liste — c''est notre façon de vous montrer comment on travaille. »*

### Faille #2 — Rapport qui prend la poussière
- **Le piège :** Livrer une liste de prospects → le client la regarde → personne ne prospecte.  
- **Correction :** Ne jamais livrer une liste seule. La liste est toujours accompagnée de **messages déjà rédigés et prêts à envoyer**, adaptés à chaque segment. Idéalement : les 10 premiers messages sont envoyés dans la semaine du lancement, avant même que le client ait eu le temps de procrastiner.  
- **Règle :** Le livrable de Minerva Reach n''est jamais une liste — c''est des **réponses reçues**.

### Faille #3 — Peur du spam et de la réputation
- **Le piège :** L''entrepreneur craint que ses contacts LinkedIn soient bombardés de messages automatiques et que sa réputation en prenne un coup.  
- **Correction :** Démarrer avec un batch de 10 messages 100% manuels et personnalisés, soumis à validation avant envoi. Le client approuve le ton, le contenu et les cibles. L''automatisation ne démarre qu''après que les premiers retours prouvent que le message fonctionne.  
- **Message :** *« Les 10 premiers messages, on les rédige ensemble et vous les validez un par un. On n''envoie rien en automatique avant que vous ayez vu que ça convertit. »*

### Faille #4 — Reach génère des leads que personne ne close
- **Le piège :** Minerva Reach amène des conversations → le client ne sait pas quoi répondre → les leads refroidissent.  
- **Correction :** Inclure dans l''offre Reach un **playbook de réponse** (3–5 scripts de follow-up par type de réponse reçue) + une session mensuelle de 30 min pour affiner les angles selon les retours terrain.  
- **Passerelle naturelle :** Reach génère des leads qualifiés → l''agence Sur Mesure peut prendre en charge la conversion si le client n''a pas la bande passante pour closer.

### Règles d''exécution spécifiques — Reach
- **ICP de Reach :** Entrepreneurs et PME Québec, pas les grands comptes. Le message doit sonner local, pas corporate.
- **Ton des messages :** Jamais de « Je me permets de vous contacter… » — opener direct sur un pain point observé publiquement (offre d''emploi récente, avis Google négatif, expansion récente).
- **Volume :** Commencer par 20–30 envois/semaine, pas 200. La qualité de la réponse prime sur le volume brut.
- **Mesure :** KPI principal = taux de réponse positive (pas taux d''ouverture). Tout le reste est vanity metric.

---

## PILIER 3 — AGENCE SUR MESURE (Implémentations Personnalisées)

### Faille #1 — Friction de la donnée
- **Le piège :** Demander un brief complet, un accès aux outils, et une réunion de discovery de 2 heures avant de montrer quoi que ce soit.  
- **Correction :** Remplacer la réunion de discovery par un **audit de surface en 30 minutes** basé sur ce qui est visible publiquement (site web, réseaux, Google, outils déclarés). Arriver avec des observations déjà formulées plutôt que des questions à remplir.  
- **Message :** *« Avant qu''on se parle, on a passé 30 minutes sur votre setup actuel. On a identifié 3 endroits où vous perdez du temps ou de l''argent. On veut vous les montrer — pas vous vendre quelque chose. »*

### Faille #2 — Le spec document que personne n''implémente
- **Le piège :** Phase de discovery longue → document de spécifications → devis → validation → début des travaux 3 semaines plus tard. Le client a perdu confiance ou d''intérêt.  
- **Correction :** **Semaine 1 = prototype fonctionnel, pas un document.** Même petit, même incomplet — quelque chose qui marche et qu''ils peuvent toucher. La confiance s''établit sur le concret, pas sur les promesses.  
- **Règle :** Ne jamais livrer un document avant un artefact. Le document documente ce qui existe, pas ce qui va exister.

### Faille #3 — Peur de la dépendance et de la complexité
- **Le piège :** Le client (CEO, entrepreneur) craint que la solution soit trop complexe, qu''elle nécessite un développeur permanent pour la maintenir, ou qu''il ne comprenne jamais comment ça marche.  
- **Correction :** Construire avec les outils qu''il utilise déjà quand c''est possible (Notion, Google Sheets, Make/n8n, Supabase). Documenter chaque livrable avec une vidéo Loom de 5 minutes max. Inclure dans tout contrat un "mode solo" : une section du livrable qu''il peut modifier lui-même sans toucher au reste.  
- **Message :** *« On construit pour que vous soyez autonome. Si on disparaît demain, vous ne perdez pas l''outil. »*

### Faille #4 — Build one-shot sans récurrence
- **Le piège :** Livrer un projet custom → encaisser → plus de relation. Aucune raison de revenir.  
- **Correction :** Intégrer dans tout projet sur mesure un **module de suivi mensuel léger** : 1 heure/mois de revue des métriques, ajustements mineurs, et identification des prochains leviers. Tarif : 300–500$/mois. Ce n''est pas du support — c''est du co-pilotage.  
- **Passerelle naturelle :** Agence Sur Mesure → abonnement Minerva Flow si le client est dans la restauration, ou recommandation Reach si le client a besoin d''acquisition.

### Règles d''exécution spécifiques — Agence
- **Cibler des entrepreneurs déjà convaincus de la technologie**, pas ceux qu''il faut convaincre en premier. Aller chercher les early adopters, pas le marché de masse.
- **Prix :** Ne jamais donner un prix avant d''avoir montré un prototype. Le prototype justifie le prix.
- **Preuve :** Un cas client documenté publiquement (avec leur accord) vaut 10 témoignages anonymes. Viser à documenter chaque projet sur Mes Inspirations.

---

## PILIER 4 — MES INSPIRATIONS (Marque Média & Contenu)

### Faille #1 — Friction pour accéder à la valeur
- **Le piège :** Mettre du contenu premium derrière un formulaire, une newsletter, ou un compte à créer avant que l''audience ait vu la valeur.  
- **Correction :** Valeur totale en accès libre d''abord. Le CTA arrive à la fin, pas au début. L''audience doit avoir reçu quelque chose d''utile avant qu''on lui demande une action.  
- **Règle :** Chaque vidéo / post / contenu doit pouvoir être consommé entièrement sans friction. La conversion est une couche au-dessus, pas une barrière d''entrée.

### Faille #2 — Contenu qui génère des vues mais pas de clients
- **Le piège :** Créer du contenu inspirationnel ou éducatif sans lien clair avec un produit ou une offre concrète.  
- **Correction :** Chaque pièce de contenu est associée à **un seul CTA lié à un pilier précis** (Flow, Reach, ou Agence). Pas de CTA générique « suivez-moi ». Le contenu documente le chemin — l''offre capture ceux qui veulent aller plus vite.  
- **Format prioritaire :** Documenter les cas clients en temps réel. *« Voici comment on a branché Minerva Flow dans ce café de Rosemont — et ce qu''ils ont économisé en 30 jours. »* C''est à la fois du contenu, de la preuve sociale, et de la prospection indirecte.

### Faille #3 — L''audience perçoit la vente comme de la trahison
- **Le piège :** Construire une audience sur du contenu inspirationnel, puis pitcher un produit → sentiment de manipulation, perte de confiance.  
- **Correction :** **Vendre dès le début, ouvertement.** Mes Inspirations est une marque média *et* la vitrine de Minerva. Ce n''est pas un secret. L''audience qui suit sait qu''on construit une entreprise — c''est précisément ce qui est intéressant à suivre. La transparence sur l''intention commerciale construit plus de confiance que de la cacher.  
- **Cadre :** *Build in public* — montrer les chiffres, les échecs, les décisions, les clients. Pas de performance de succès.

### Faille #4 — Le média ne se connecte pas aux autres piliers
- **Le piège :** Mes Inspirations grandit en silo — belle audience, mais zéro synchro avec Flow, Reach ou l''Agence.  
- **Correction :** Mes Inspirations est le **moteur de preuve sociale** pour les 3 autres piliers. Chaque client Flow signé = une vidéo de cas client. Chaque projet Agence livré = un before/after documenté. Chaque campagne Reach réussie = un breakdown chiffré. Le contenu n''est pas séparé du business — il **est** le business visible.

### Règles d''exécution spécifiques — Mes Inspirations
- **Format court prioritaire :** Shorts / Reels de 60–90 secondes sur un insight précis. Un insight = une vidéo. Pas de compilations.
- **Hook :** Toujours partir d''un chiffre ou d''une situation concrète, jamais d''un concept. *« Ce café perdait 1 400$/mois sans le savoir »* bat *« Voici pourquoi les restos doivent se digitaliser »*.
- **Fréquence :** 2 pièces de contenu par semaine minimum. La régularité bat la perfection.
- **Distribution :** YouTube Shorts en premier (SEO long terme), repurposé sur Instagram Reels et LinkedIn.

---

## LA BOUCLE D''OFFRE UNIFIÉE — COMMENT LES PILIERS S''ENCHAÎNENT

```
MES INSPIRATIONS
(Contenu — génère confiance + preuve sociale)
         ↓ attire leads froids
MINERVA REACH
(Prospection — identifie + contacte les leads chauds)
         ↓ qualifie et génère des RDV
MINERVA FLOW
(SaaS — premier produit, entrée de gamme, preuve de valeur rapide)
         ↓ crée le besoin de trafic + systèmes
AGENCE SUR MESURE
(Implémentation — upsell naturel pour ceux qui veulent aller plus loin)
         ↓ génère des cas clients documentés
MES INSPIRATIONS
(Le cycle recommence avec des preuves réelles)
```

**La règle d''or :** Aucun pilier ne se vend seul. Chaque pilier alimente le suivant. Le contenu sans produit est du bruit. Le produit sans contenu est invisible. L''agence sans cas clients est indifférenciée.

---

## RÈGLES TRANSVERSALES — APPLICABLES À TOUS LES PILIERS

| Règle | Application concrète |
|---|---|
| **Donner avant de demander** | Audit, démo, prototype, liste — toujours en premier |
| **Estimer = transparence sur la méthode** | Jamais un chiffre sans expliquer comment il a été calculé |
| **Preuve locale avant preuve générique** | Un nom à Montréal vaut 10 références nationales |
| **Staff / équipe inclus dans l''offre** | L''onboarding de l''équipe du client fait partie du livrable |
| **Timing de contact** | Mardi–mercredi 14h30–16h pour les restos. Matin pour les entrepreneurs. |
| **Upsell = rétention, pas acquisition** | Toujours partir des clients existants du prospect, pas de la croissance |
| **Documenter chaque cas client** | Chaque client signé = contenu Mes Inspirations potentiel |
| **Risque inversé systématique** | Chaque offre inclut une porte de sortie claire si ça ne fonctionne pas |

---

## MATRICE DE PRIORITÉ D''EXÉCUTION

| Pilier | Action #1 (semaine 1) | Action #2 (mois 1) | Indicateur de succès |
|---|---|---|---|
| **Flow** | 3 audits publics proactifs envoyés | 1 test opérationnel branché | 1 client payant actif |
| **Reach** | Liste de 50 prospects construite | 10 messages validés + envoyés | 3 réponses positives |
| **Agence** | 1 audit de surface livré sans rendez-vous | Prototype J+7 présenté | 1 contrat signé |
| **Mes Inspirations** | 2 vidéos courtes publiées | 1 cas client documenté | 100 vues organiques / vidéo |
',
  '{"blocks":[{"id":"heading_1-mtgonsdl-1","type":"heading_1","content":"MINERVA — SYSTÈME ANTI-FRICTION : ARCHITECTURE D''OFFRE COMPLÈTE"},{"id":"quote-mtgonsdm-2","type":"quote","content":"Framework dérivé de l''analyse \"avocat du diable\" sur l''offre d''appel restaurateurs."},{"id":"quote-mtgonsdm-3","type":"quote","content":"Appliqué à chaque pilier de l''agence : Flow, Reach, Agence Sur Mesure, Mes Inspirations."},{"id":"div-mtgonsdm-4","type":"divider","content":""},{"id":"heading_2-mtgonsdm-5","type":"heading_2","content":"PRINCIPE DIRECTEUR"},{"id":"paragraph-mtgonsdm-6","type":"paragraph","content":"Chaque pilier partage le même défaut structurel par défaut : il demande avant de donner. Le prospect doit fournir ses chiffres, son temps, sa confiance — avant d''avoir reçu une seule preuve de valeur. Ce framework inverse systématiquement l''ordre : donner d''abord, demander ensuite."},{"id":"paragraph-mtgonsdm-7","type":"paragraph","content":"Les 4 failles s''appliquent à chaque pilier différemment, mais le remède est toujours le même :"},{"id":"paragraph-mtgonsdm-8","type":"paragraph","content":"→ Réduire l''effort du prospect à zéro sur le premier contact"},{"id":"paragraph-mtgonsdm-9","type":"paragraph","content":"→ Livrer la moitié du travail avant qu''il ait dit oui"},{"id":"paragraph-mtgonsdm-10","type":"paragraph","content":"→ Neutraliser le risque opérationnel dans l''offre elle-même"},{"id":"paragraph-mtgonsdm-11","type":"paragraph","content":"→ Rendre la passerelle vers le niveau suivant évidente et naturelle"},{"id":"div-mtgonsdm-12","type":"divider","content":""},{"id":"heading_2-mtgonsdm-13","type":"heading_2","content":"PILIER 1 — MINERVA FLOW (SaaS Restos & Cafés)"},{"id":"heading_3-mtgonsdm-14","type":"heading_3","content":"Faille #1 — Friction de la donnée"},{"id":"bullet_list-mtgonsdm-15","type":"bullet_list","content":"Le piège : Demander relevés Uber Eats, exports de caisse, ou coûts de staff avant de montrer quoi que ce soit."},{"id":"bullet_list-mtgonsdm-16","type":"bullet_list","content":"Correction : Audit public proactif. Prix menu sur Google Maps / site web vs prix majorés sur UberEats. Volume estimé à partir des avis Google (fourchette basse, assumée transparemment). Livraison : vidéo 60 secondes personnalisée avec chiffre précis."},{"id":"bullet_list-mtgonsdm-17","type":"bullet_list","content":"Message : « On a regardé votre menu sur Uber Eats. Sur votre [plat signature], vous perdez environ X$ par commande. On a simulé ça en une minute — voici le lien. »"},{"id":"heading_3-mtgonsdm-18","type":"heading_3","content":"Faille #2 — Rapport qui prend la poussière"},{"id":"bullet_list-mtgonsdm-19","type":"bullet_list","content":"Le piège : Envoyer un beau PDF d''audit que le proprio regarde une fois et range."},{"id":"bullet_list-mtgonsdm-20","type":"bullet_list","content":"Correction : Avec l''audit, envoyer un lien vers son menu déjà pré-configuré en démo sur Minerva Flow (5 plats, interface réelle, rien de public). Pas un livrable — une démo vivante. Il voit son restaurant dans l''outil avant d''avoir signé quoi que ce soit."},{"id":"bullet_list-mtgonsdm-21","type":"bullet_list","content":"Précaution : Framer comme une démo, pas comme un acte unilatéral. « On a pris 5 minutes pour recréer vos plats signature dans l''interface — c''est juste pour que vous visualisiez. Rien n''est en ligne. »"},{"id":"heading_3-mtgonsdm-22","type":"heading_3","content":"Faille #3 — Peur du bug pendant le rush"},{"id":"bullet_list-mtgonsdm-23","type":"bullet_list","content":"Le piège : Positionner Minerva Flow comme remplacement du système existant. Le proprio imagine son samedi soir en chaos."},{"id":"bullet_list-mtgonsdm-24","type":"bullet_list","content":"Correction : Canal parallèle exclusivement pour clients fidèles/emporter. Protocole test de 5 minutes avec l''équipe présente. Inclure dans l''offre : une fiche plastifiée d''une page pour le comptoir + option d''un briefing d''équipe de 15 min (en personne ou vidéo) avant le premier service."},{"id":"bullet_list-mtgonsdm-25","type":"bullet_list","content":"Message : « On branche une commande test sur votre imprimante actuelle. Si ça prend plus de 5 minutes ou que votre équipe hésite — vous ne lancez rien. »"},{"id":"heading_3-mtgonsdm-26","type":"heading_3","content":"Faille #4 — Pas de passerelle naturelle vers l''agence"},{"id":"bullet_list-mtgonsdm-27","type":"bullet_list","content":"Le piège : Résoudre le problème de commission → le client est content → aucune raison de payer plus."},{"id":"bullet_list-mtgonsdm-28","type":"bullet_list","content":"Correction : Repositionner l''upsell agence en rétention, pas acquisition. « Minerva Flow vous économise 30% par commande. Maintenant : comment on fait pour que vos clients Uber commandent directement chez vous la prochaine fois ? » Les clients existent déjà. Il s''agit de les récupérer — pas d''en trouver de nouveaux. C''est une conversation infiniment plus facile."},{"id":"bullet_list-mtgonsdm-29","type":"bullet_list","content":"Upsell naturel : Optimisation fiche Google Business + QR codes sur emballages + campagne SMS clients existants."},{"id":"heading_3-mtgonsdm-30","type":"heading_3","content":"Règles d''exécution spécifiques — Flow"},{"id":"bullet_list-mtgonsdm-31","type":"bullet_list","content":"Timing de contact : Mardi ou mercredi, 14h30–16h. Jamais vendredi soir, jamais lundi matin."},{"id":"bullet_list-mtgonsdm-32","type":"bullet_list","content":"Canal : Visite physique pour les indépendants (Plateau, Villeray, Rosemont). Instagram DM en backup."},{"id":"bullet_list-mtgonsdm-33","type":"bullet_list","content":"Preuve sociale : Toujours un nom local. « On travaille déjà avec X café dans Rosemont. » Aucune référence nationale générique."},{"id":"bullet_list-mtgonsdm-34","type":"bullet_list","content":"Staff : Le vrai bloquant n''est pas le proprio — c''est la caissière ou le cuisinier. L''offre inclut un protocole d''onboarding équipe dès le jour 1."},{"id":"div-mtgonsdm-35","type":"divider","content":""},{"id":"heading_2-mtgonsdm-36","type":"heading_2","content":"PILIER 2 — MINERVA REACH (Prospection Automatisée Québec)"},{"id":"heading_3-mtgonsdm-37","type":"heading_3","content":"Faille #1 — Friction de la donnée"},{"id":"bullet_list-mtgonsdm-38","type":"bullet_list","content":"Le piège : Demander l''accès au CRM, une liste de prospects, ou les critères de ciblage avant de commencer."},{"id":"bullet_list-mtgonsdm-39","type":"bullet_list","content":"Correction : Construire la première liste pour eux depuis des sources publiques (LinkedIn, Google Maps, Pages Jaunes, Sites sectoriels QC) avant le premier appel. Livrer une liste de 50 prospects qualifiés avec contexte (taille, secteur, signal d''achat récent) comme pré-cadeau de la conversation."},{"id":"bullet_list-mtgonsdm-40","type":"bullet_list","content":"Message : « Avant qu''on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre ICP et qui ont un signal d''achat actif. Voici la liste — c''est notre façon de vous montrer comment on travaille. »"},{"id":"heading_3-mtgonsdm-41","type":"heading_3","content":"Faille #2 — Rapport qui prend la poussière"},{"id":"bullet_list-mtgonsdm-42","type":"bullet_list","content":"Le piège : Livrer une liste de prospects → le client la regarde → personne ne prospecte."},{"id":"bullet_list-mtgonsdm-43","type":"bullet_list","content":"Correction : Ne jamais livrer une liste seule. La liste est toujours accompagnée de messages déjà rédigés et prêts à envoyer, adaptés à chaque segment. Idéalement : les 10 premiers messages sont envoyés dans la semaine du lancement, avant même que le client ait eu le temps de procrastiner."},{"id":"bullet_list-mtgonsdm-44","type":"bullet_list","content":"Règle : Le livrable de Minerva Reach n''est jamais une liste — c''est des réponses reçues."},{"id":"heading_3-mtgonsdm-45","type":"heading_3","content":"Faille #3 — Peur du spam et de la réputation"},{"id":"bullet_list-mtgonsdm-46","type":"bullet_list","content":"Le piège : L''entrepreneur craint que ses contacts LinkedIn soient bombardés de messages automatiques et que sa réputation en prenne un coup."},{"id":"bullet_list-mtgonsdm-47","type":"bullet_list","content":"Correction : Démarrer avec un batch de 10 messages 100% manuels et personnalisés, soumis à validation avant envoi. Le client approuve le ton, le contenu et les cibles. L''automatisation ne démarre qu''après que les premiers retours prouvent que le message fonctionne."},{"id":"bullet_list-mtgonsdm-48","type":"bullet_list","content":"Message : « Les 10 premiers messages, on les rédige ensemble et vous les validez un par un. On n''envoie rien en automatique avant que vous ayez vu que ça convertit. »"},{"id":"heading_3-mtgonsdm-49","type":"heading_3","content":"Faille #4 — Reach génère des leads que personne ne close"},{"id":"bullet_list-mtgonsdm-50","type":"bullet_list","content":"Le piège : Minerva Reach amène des conversations → le client ne sait pas quoi répondre → les leads refroidissent."},{"id":"bullet_list-mtgonsdm-51","type":"bullet_list","content":"Correction : Inclure dans l''offre Reach un playbook de réponse (3–5 scripts de follow-up par type de réponse reçue) + une session mensuelle de 30 min pour affiner les angles selon les retours terrain."},{"id":"bullet_list-mtgonsdm-52","type":"bullet_list","content":"Passerelle naturelle : Reach génère des leads qualifiés → l''agence Sur Mesure peut prendre en charge la conversion si le client n''a pas la bande passante pour closer."},{"id":"heading_3-mtgonsdm-53","type":"heading_3","content":"Règles d''exécution spécifiques — Reach"},{"id":"bullet_list-mtgonsdm-54","type":"bullet_list","content":"ICP de Reach : Entrepreneurs et PME Québec, pas les grands comptes. Le message doit sonner local, pas corporate."},{"id":"bullet_list-mtgonsdm-55","type":"bullet_list","content":"Ton des messages : Jamais de « Je me permets de vous contacter… » — opener direct sur un pain point observé publiquement (offre d''emploi récente, avis Google négatif, expansion récente)."},{"id":"bullet_list-mtgonsdm-56","type":"bullet_list","content":"Volume : Commencer par 20–30 envois/semaine, pas 200. La qualité de la réponse prime sur le volume brut."},{"id":"bullet_list-mtgonsdm-57","type":"bullet_list","content":"Mesure : KPI principal = taux de réponse positive (pas taux d''ouverture). Tout le reste est vanity metric."},{"id":"div-mtgonsdm-58","type":"divider","content":""},{"id":"heading_2-mtgonsdm-59","type":"heading_2","content":"PILIER 3 — AGENCE SUR MESURE (Implémentations Personnalisées)"},{"id":"heading_3-mtgonsdm-60","type":"heading_3","content":"Faille #1 — Friction de la donnée"},{"id":"bullet_list-mtgonsdm-61","type":"bullet_list","content":"Le piège : Demander un brief complet, un accès aux outils, et une réunion de discovery de 2 heures avant de montrer quoi que ce soit."},{"id":"bullet_list-mtgonsdm-62","type":"bullet_list","content":"Correction : Remplacer la réunion de discovery par un audit de surface en 30 minutes basé sur ce qui est visible publiquement (site web, réseaux, Google, outils déclarés). Arriver avec des observations déjà formulées plutôt que des questions à remplir."},{"id":"bullet_list-mtgonsdm-63","type":"bullet_list","content":"Message : « Avant qu''on se parle, on a passé 30 minutes sur votre setup actuel. On a identifié 3 endroits où vous perdez du temps ou de l''argent. On veut vous les montrer — pas vous vendre quelque chose. »"},{"id":"heading_3-mtgonsdm-64","type":"heading_3","content":"Faille #2 — Le spec document que personne n''implémente"},{"id":"bullet_list-mtgonsdm-65","type":"bullet_list","content":"Le piège : Phase de discovery longue → document de spécifications → devis → validation → début des travaux 3 semaines plus tard. Le client a perdu confiance ou d''intérêt."},{"id":"bullet_list-mtgonsdm-66","type":"bullet_list","content":"Correction : Semaine 1 = prototype fonctionnel, pas un document. Même petit, même incomplet — quelque chose qui marche et qu''ils peuvent toucher. La confiance s''établit sur le concret, pas sur les promesses."},{"id":"bullet_list-mtgonsdm-67","type":"bullet_list","content":"Règle : Ne jamais livrer un document avant un artefact. Le document documente ce qui existe, pas ce qui va exister."},{"id":"heading_3-mtgonsdm-68","type":"heading_3","content":"Faille #3 — Peur de la dépendance et de la complexité"},{"id":"bullet_list-mtgonsdm-69","type":"bullet_list","content":"Le piège : Le client (CEO, entrepreneur) craint que la solution soit trop complexe, qu''elle nécessite un développeur permanent pour la maintenir, ou qu''il ne comprenne jamais comment ça marche."},{"id":"bullet_list-mtgonsdm-70","type":"bullet_list","content":"Correction : Construire avec les outils qu''il utilise déjà quand c''est possible (Notion, Google Sheets, Make/n8n, Supabase). Documenter chaque livrable avec une vidéo Loom de 5 minutes max. Inclure dans tout contrat un \"mode solo\" : une section du livrable qu''il peut modifier lui-même sans toucher au reste."},{"id":"bullet_list-mtgonsdm-71","type":"bullet_list","content":"Message : « On construit pour que vous soyez autonome. Si on disparaît demain, vous ne perdez pas l''outil. »"},{"id":"heading_3-mtgonsdm-72","type":"heading_3","content":"Faille #4 — Build one-shot sans récurrence"},{"id":"bullet_list-mtgonsdm-73","type":"bullet_list","content":"Le piège : Livrer un projet custom → encaisser → plus de relation. Aucune raison de revenir."},{"id":"bullet_list-mtgonsdm-74","type":"bullet_list","content":"Correction : Intégrer dans tout projet sur mesure un module de suivi mensuel léger : 1 heure/mois de revue des métriques, ajustements mineurs, et identification des prochains leviers. Tarif : 300–500$/mois. Ce n''est pas du support — c''est du co-pilotage."},{"id":"bullet_list-mtgonsdm-75","type":"bullet_list","content":"Passerelle naturelle : Agence Sur Mesure → abonnement Minerva Flow si le client est dans la restauration, ou recommandation Reach si le client a besoin d''acquisition."},{"id":"heading_3-mtgonsdm-76","type":"heading_3","content":"Règles d''exécution spécifiques — Agence"},{"id":"bullet_list-mtgonsdm-77","type":"bullet_list","content":"Cibler des entrepreneurs déjà convaincus de la technologie, pas ceux qu''il faut convaincre en premier. Aller chercher les early adopters, pas le marché de masse."},{"id":"bullet_list-mtgonsdm-78","type":"bullet_list","content":"Prix : Ne jamais donner un prix avant d''avoir montré un prototype. Le prototype justifie le prix."},{"id":"bullet_list-mtgonsdm-79","type":"bullet_list","content":"Preuve : Un cas client documenté publiquement (avec leur accord) vaut 10 témoignages anonymes. Viser à documenter chaque projet sur Mes Inspirations."},{"id":"div-mtgonsdm-80","type":"divider","content":""},{"id":"heading_2-mtgonsdm-81","type":"heading_2","content":"PILIER 4 — MES INSPIRATIONS (Marque Média & Contenu)"},{"id":"heading_3-mtgonsdm-82","type":"heading_3","content":"Faille #1 — Friction pour accéder à la valeur"},{"id":"bullet_list-mtgonsdm-83","type":"bullet_list","content":"Le piège : Mettre du contenu premium derrière un formulaire, une newsletter, ou un compte à créer avant que l''audience ait vu la valeur."},{"id":"bullet_list-mtgonsdm-84","type":"bullet_list","content":"Correction : Valeur totale en accès libre d''abord. Le CTA arrive à la fin, pas au début. L''audience doit avoir reçu quelque chose d''utile avant qu''on lui demande une action."},{"id":"bullet_list-mtgonsdm-85","type":"bullet_list","content":"Règle : Chaque vidéo / post / contenu doit pouvoir être consommé entièrement sans friction. La conversion est une couche au-dessus, pas une barrière d''entrée."},{"id":"heading_3-mtgonsdm-86","type":"heading_3","content":"Faille #2 — Contenu qui génère des vues mais pas de clients"},{"id":"bullet_list-mtgonsdm-87","type":"bullet_list","content":"Le piège : Créer du contenu inspirationnel ou éducatif sans lien clair avec un produit ou une offre concrète."},{"id":"bullet_list-mtgonsdm-88","type":"bullet_list","content":"Correction : Chaque pièce de contenu est associée à un seul CTA lié à un pilier précis (Flow, Reach, ou Agence). Pas de CTA générique « suivez-moi ». Le contenu documente le chemin — l''offre capture ceux qui veulent aller plus vite."},{"id":"bullet_list-mtgonsdm-89","type":"bullet_list","content":"Format prioritaire : Documenter les cas clients en temps réel. « Voici comment on a branché Minerva Flow dans ce café de Rosemont — et ce qu''ils ont économisé en 30 jours. » C''est à la fois du contenu, de la preuve sociale, et de la prospection indirecte."},{"id":"heading_3-mtgonsdm-90","type":"heading_3","content":"Faille #3 — L''audience perçoit la vente comme de la trahison"},{"id":"bullet_list-mtgonsdm-91","type":"bullet_list","content":"Le piège : Construire une audience sur du contenu inspirationnel, puis pitcher un produit → sentiment de manipulation, perte de confiance."},{"id":"bullet_list-mtgonsdm-92","type":"bullet_list","content":"Correction : Vendre dès le début, ouvertement. Mes Inspirations est une marque média et la vitrine de Minerva. Ce n''est pas un secret. L''audience qui suit sait qu''on construit une entreprise — c''est précisément ce qui est intéressant à suivre. La transparence sur l''intention commerciale construit plus de confiance que de la cacher."},{"id":"bullet_list-mtgonsdm-93","type":"bullet_list","content":"Cadre : Build in public — montrer les chiffres, les échecs, les décisions, les clients. Pas de performance de succès."},{"id":"heading_3-mtgonsdm-94","type":"heading_3","content":"Faille #4 — Le média ne se connecte pas aux autres piliers"},{"id":"bullet_list-mtgonsdm-95","type":"bullet_list","content":"Le piège : Mes Inspirations grandit en silo — belle audience, mais zéro synchro avec Flow, Reach ou l''Agence."},{"id":"bullet_list-mtgonsdm-96","type":"bullet_list","content":"Correction : Mes Inspirations est le moteur de preuve sociale pour les 3 autres piliers. Chaque client Flow signé = une vidéo de cas client. Chaque projet Agence livré = un before/after documenté. Chaque campagne Reach réussie = un breakdown chiffré. Le contenu n''est pas séparé du business — il est le business visible."},{"id":"heading_3-mtgonsdm-97","type":"heading_3","content":"Règles d''exécution spécifiques — Mes Inspirations"},{"id":"bullet_list-mtgonsdm-98","type":"bullet_list","content":"Format court prioritaire : Shorts / Reels de 60–90 secondes sur un insight précis. Un insight = une vidéo. Pas de compilations."},{"id":"bullet_list-mtgonsdm-99","type":"bullet_list","content":"Hook : Toujours partir d''un chiffre ou d''une situation concrète, jamais d''un concept. « Ce café perdait 1 400$/mois sans le savoir » bat « Voici pourquoi les restos doivent se digitaliser »."},{"id":"bullet_list-mtgonsdm-100","type":"bullet_list","content":"Fréquence : 2 pièces de contenu par semaine minimum. La régularité bat la perfection."},{"id":"bullet_list-mtgonsdm-101","type":"bullet_list","content":"Distribution : YouTube Shorts en premier (SEO long terme), repurposé sur Instagram Reels et LinkedIn."},{"id":"div-mtgonsdm-102","type":"divider","content":""},{"id":"heading_2-mtgonsdm-103","type":"heading_2","content":"LA BOUCLE D''OFFRE UNIFIÉE — COMMENT LES PILIERS S''ENCHAÎNENT"},{"id":"code-mtgonsdm-104","type":"code_block","content":"MES INSPIRATIONS\n(Contenu — génère confiance + preuve sociale)\n         ↓ attire leads froids\nMINERVA REACH\n(Prospection — identifie + contacte les leads chauds)\n         ↓ qualifie et génère des RDV\nMINERVA FLOW\n(SaaS — premier produit, entrée de gamme, preuve de valeur rapide)\n         ↓ crée le besoin de trafic + systèmes\nAGENCE SUR MESURE\n(Implémentation — upsell naturel pour ceux qui veulent aller plus loin)\n         ↓ génère des cas clients documentés\nMES INSPIRATIONS\n(Le cycle recommence avec des preuves réelles)"},{"id":"paragraph-mtgonsdm-105","type":"paragraph","content":"La règle d''or : Aucun pilier ne se vend seul. Chaque pilier alimente le suivant. Le contenu sans produit est du bruit. Le produit sans contenu est invisible. L''agence sans cas clients est indifférenciée."},{"id":"div-mtgonsdm-106","type":"divider","content":""},{"id":"heading_2-mtgonsdm-107","type":"heading_2","content":"RÈGLES TRANSVERSALES — APPLICABLES À TOUS LES PILIERS"},{"id":"table-mtgonsdn-108","type":"table","content":"","tableData":[["Règle","Application concrète"],["Donner avant de demander","Audit, démo, prototype, liste — toujours en premier"],["Estimer = transparence sur la méthode","Jamais un chiffre sans expliquer comment il a été calculé"],["Preuve locale avant preuve générique","Un nom à Montréal vaut 10 références nationales"],["Staff / équipe inclus dans l''offre","L''onboarding de l''équipe du client fait partie du livrable"],["Timing de contact","Mardi–mercredi 14h30–16h pour les restos. Matin pour les entrepreneurs."],["Upsell = rétention, pas acquisition","Toujours partir des clients existants du prospect, pas de la croissance"],["Documenter chaque cas client","Chaque client signé = contenu Mes Inspirations potentiel"],["Risque inversé systématique","Chaque offre inclut une porte de sortie claire si ça ne fonctionne pas"]]},{"id":"div-mtgonsdn-109","type":"divider","content":""},{"id":"heading_2-mtgonsdn-110","type":"heading_2","content":"MATRICE DE PRIORITÉ D''EXÉCUTION"},{"id":"table-mtgonsdn-111","type":"table","content":"","tableData":[["Pilier","Action #1 (semaine 1)","Action #2 (mois 1)","Indicateur de succès"],["Flow","3 audits publics proactifs envoyés","1 test opérationnel branché","1 client payant actif"],["Reach","Liste de 50 prospects construite","10 messages validés + envoyés","3 réponses positives"],["Agence","1 audit de surface livré sans rendez-vous","Prototype J+7 présenté","1 contrat signé"],["Mes Inspirations","2 vidéos courtes publiées","1 cas client documenté","100 vues organiques / vidéo"]]}]}'::jsonb,
  15,
  'Direction Minerva',
  true,
  true,
  true,
  2,
  'transversal',
  15
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Système Anti-Friction : Architecture d’Offre Complète (4 Piliers)');

-- sop-minerva-flow-dossier-produit
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Minerva Flow : Dossier Produit, Vision & Offre Pilote',
  'Spécification complète du produit Minerva Flow — ICP, fonctionnalités clés, roadmap, business model et offre pilote (90 jours).',
  'Outils & Systèmes',
  '# Minerva Flow — Dossier Produit, Vision & Offre Pilote

## 🌊 Concept en 1 phrase
Minerva Flow est un système de gestion complet pour permettre aux restaurants et cafés de gérer l''ensemble de leurs opérations quotidiennes dans un seul endroit moderne : simple, visuel et performant.

---

## 🎯 Problème résolu
Les restaurants & cafés utilisent souvent de nombreux outils fragmentés, complexes ou peu adaptés à la réalité de leur métier. Flow centralise tout dans un seul espace conçu pour leur réalité.

---

## 👤 ICP (Ideal Customer Profile)
- **Restaurants** (service aux tables, comptoir, rapide)
- **Cafés & Bistrots**
- **Restaurants-cafés**
- **Établissements alimentaires** qui veulent mieux gérer leurs opérations quotidiennes

---

## ⚡ Key Features (Fonctionnalités clés)
- [x] **Saisie des revenus par journée** (chiffre d''affaires en temps réel)
- [x] **Gestion des dépenses & coûts opérationnels**
- [x] **Suivi des marges commerciales & rentabilité**
- [x] **Gestion de l''inventaire & stocks**
- [x] **Gestion des employés & horaires**
- [x] **Rapports et graphiques visuels**
- [x] **Multi-enseignes & multi-points de vente**
- [x] **Accès offre sur mesure**
- [ ] **Commande directe à partir de système d''un QR code**

---

## 🎨 Expérience utilisateur (UX/UI)
- **Interface très fluide et navigable**
- **Graphiques clairs et visuels**
- **Rapports simples à comprendre** sans jargon technique
- **Informations faciles à lire** même pour un utilisateur non technicien
- **Produit pensé pour être partageable en équipe** en invitant d''autres membres utilisateurs

---

## 🚀 Différenciation & Positionnement
- **Focus net :** Se concentrer réellement et uniquement sur la réalité spécifique des restaurants et cafés.
- **Approche visuelle et ergonomique :** Une grande spécialité moderne, pas un générique POS vieillot.
- **Idée stratégique :** Flow doit devenir un produit qui se markete par sa propre qualité — assez fort, beau et fluide pour que les utilisateurs aient envie de le recommander à d''autres restos.

---

## 🗺️ Roadmap (Feuille de route)

### 0–3 mois (Phase Terrain & Feedback)
- Faire tester l''application à des restaurants et cafés pilotes
- Obtenir du feedback réel du terrain
- Perfectionner le produit jusqu''à ce qu''il soit parfaitement adapté aux coups de feu en cuisine

### 3–12 mois (Consolidation & Valeur)
- Renforcer les fonctions les plus utiles
- Stabiliser l''expérience et les intégrations
- Améliorer la valeur commerciale du produit

### 1–3 ans (Échelle & Référence)
- Faire de Flow une référence dans sa niche
- Développer un produit assez fort pour se recommander presque par lui-même
- Créer une solution à la fois operational, visuelle et stratégique

---

## 💼 Business Model (Modèle Économique)
- **Paiement sur abonnement** (SaaS = mensuel)
- **Tarification accessible** selon le restaurant (minimum et maximum)
- **Flexibilité** selon le besoin, la taille ou le niveau de personnalisation

---

## 📣 Go-to-Market (Stratégie d''Acquisition)
- Démarrage direct auprès des restaurants — boucle de recommandation / bouche-à-oreille
- Qualité du produit comme moteur principal d''acquisition
- Preuve sociale forte : restaurants mis en valeur + expérience réelle
- Démonstrations directes des fonctionnalités clés

---

## 🎁 Offre Pilote (90 jours) — Premiers clients

**Objectif de la phase d''embarquement :** 3 à 5 restaurants et cafés pilotes pour valider le produit et générer les premières études de cas.

| Élément | Détail |
| :--- | :--- |
| **Prix** | **0 $** (gratuit pendant 90 jours) |
| **Engagement** | Retour d''expérience complet et étude de cas (1 à 2 heures de feedback / semaine) |
| **Places disponibles** | 3 à 5 places maximum |
| **Garantie** | Si la valeur n''est pas au rendez-vous après 90 jours, aucun frais, jamais. |

---

### 📝 Mises à jour & Notes d''exécution
- **Mise à jour (15 juillet 2026) :** Le module de commande directe (paiement sur place, sans commission) est à l''essai en mode *Connect-ready* — non pas pour tout remplacer dans l''ancien système, mais pour tester à l''essai sans risque.
- **Positionnement du pilote :** Générateur de meilleure rentabilité + Combiner l''expérience de menu + Commande directe (seulement sur place, 0% commission).
- ⚠️ **Principe "Non pas tout changer" :** Le système est un canal complémentaire, pas un POS total à remplacer immédiatement. Au moment d''imprimer la commande sur place ou via QR code, rien ne saute.
- **Session d''essai (24 juillet 2026) :** Flow — 150/150 remplis, en cas réels et automatisés (parcours complet, numérotation, bag de préparation) avant mise en service réelle.',
  '{"blocks":[{"id":"heading_1-mtgonsdn-112","type":"heading_1","content":"Minerva Flow — Dossier Produit, Vision & Offre Pilote"},{"id":"heading_2-mtgonsdn-113","type":"heading_2","content":"🌊 Concept en 1 phrase"},{"id":"paragraph-mtgonsdn-114","type":"paragraph","content":"Minerva Flow est un système de gestion complet pour permettre aux restaurants et cafés de gérer l''ensemble de leurs opérations quotidiennes dans un seul endroit moderne : simple, visuel et performant."},{"id":"div-mtgonsdn-115","type":"divider","content":""},{"id":"heading_2-mtgonsdn-116","type":"heading_2","content":"🎯 Problème résolu"},{"id":"paragraph-mtgonsdn-117","type":"paragraph","content":"Les restaurants & cafés utilisent souvent de nombreux outils fragmentés, complexes ou peu adaptés à la réalité de leur métier. Flow centralise tout dans un seul espace conçu pour leur réalité."},{"id":"div-mtgonsdn-118","type":"divider","content":""},{"id":"heading_2-mtgonsdn-119","type":"heading_2","content":"👤 ICP (Ideal Customer Profile)"},{"id":"bullet_list-mtgonsdn-120","type":"bullet_list","content":"Restaurants (service aux tables, comptoir, rapide)"},{"id":"bullet_list-mtgonsdn-121","type":"bullet_list","content":"Cafés & Bistrots"},{"id":"bullet_list-mtgonsdn-122","type":"bullet_list","content":"Restaurants-cafés"},{"id":"bullet_list-mtgonsdn-123","type":"bullet_list","content":"Établissements alimentaires qui veulent mieux gérer leurs opérations quotidiennes"},{"id":"div-mtgonsdn-124","type":"divider","content":""},{"id":"heading_2-mtgonsdn-125","type":"heading_2","content":"⚡ Key Features (Fonctionnalités clés)"},{"id":"todo_list-mtgonsdn-126","type":"todo_list","content":"Saisie des revenus par journée (chiffre d''affaires en temps réel)","checked":true},{"id":"todo_list-mtgonsdn-127","type":"todo_list","content":"Gestion des dépenses & coûts opérationnels","checked":true},{"id":"todo_list-mtgonsdn-128","type":"todo_list","content":"Suivi des marges commerciales & rentabilité","checked":true},{"id":"todo_list-mtgonsdn-129","type":"todo_list","content":"Gestion de l''inventaire & stocks","checked":true},{"id":"todo_list-mtgonsdn-130","type":"todo_list","content":"Gestion des employés & horaires","checked":true},{"id":"todo_list-mtgonsdn-131","type":"todo_list","content":"Rapports et graphiques visuels","checked":true},{"id":"todo_list-mtgonsdn-132","type":"todo_list","content":"Multi-enseignes & multi-points de vente","checked":true},{"id":"todo_list-mtgonsdn-133","type":"todo_list","content":"Accès offre sur mesure","checked":true},{"id":"todo_list-mtgonsdn-134","type":"todo_list","content":"Commande directe à partir de système d''un QR code","checked":false},{"id":"div-mtgonsdn-135","type":"divider","content":""},{"id":"heading_2-mtgonsdn-136","type":"heading_2","content":"🎨 Expérience utilisateur (UX/UI)"},{"id":"bullet_list-mtgonsdn-137","type":"bullet_list","content":"Interface très fluide et navigable"},{"id":"bullet_list-mtgonsdn-138","type":"bullet_list","content":"Graphiques clairs et visuels"},{"id":"bullet_list-mtgonsdn-139","type":"bullet_list","content":"Rapports simples à comprendre sans jargon technique"},{"id":"bullet_list-mtgonsdn-140","type":"bullet_list","content":"Informations faciles à lire même pour un utilisateur non technicien"},{"id":"bullet_list-mtgonsdn-141","type":"bullet_list","content":"Produit pensé pour être partageable en équipe en invitant d''autres membres utilisateurs"},{"id":"div-mtgonsdn-142","type":"divider","content":""},{"id":"heading_2-mtgonsdn-143","type":"heading_2","content":"🚀 Différenciation & Positionnement"},{"id":"bullet_list-mtgonsdn-144","type":"bullet_list","content":"Focus net : Se concentrer réellement et uniquement sur la réalité spécifique des restaurants et cafés."},{"id":"bullet_list-mtgonsdn-145","type":"bullet_list","content":"Approche visuelle et ergonomique : Une grande spécialité moderne, pas un générique POS vieillot."},{"id":"bullet_list-mtgonsdn-146","type":"bullet_list","content":"Idée stratégique : Flow doit devenir un produit qui se markete par sa propre qualité — assez fort, beau et fluide pour que les utilisateurs aient envie de le recommander à d''autres restos."},{"id":"div-mtgonsdn-147","type":"divider","content":""},{"id":"heading_2-mtgonsdn-148","type":"heading_2","content":"🗺️ Roadmap (Feuille de route)"},{"id":"heading_3-mtgonsdn-149","type":"heading_3","content":"0–3 mois (Phase Terrain & Feedback)"},{"id":"bullet_list-mtgonsdn-150","type":"bullet_list","content":"Faire tester l''application à des restaurants et cafés pilotes"},{"id":"bullet_list-mtgonsdn-151","type":"bullet_list","content":"Obtenir du feedback réel du terrain"},{"id":"bullet_list-mtgonsdn-152","type":"bullet_list","content":"Perfectionner le produit jusqu''à ce qu''il soit parfaitement adapté aux coups de feu en cuisine"},{"id":"heading_3-mtgonsdn-153","type":"heading_3","content":"3–12 mois (Consolidation & Valeur)"},{"id":"bullet_list-mtgonsdn-154","type":"bullet_list","content":"Renforcer les fonctions les plus utiles"},{"id":"bullet_list-mtgonsdn-155","type":"bullet_list","content":"Stabiliser l''expérience et les intégrations"},{"id":"bullet_list-mtgonsdn-156","type":"bullet_list","content":"Améliorer la valeur commerciale du produit"},{"id":"heading_3-mtgonsdn-157","type":"heading_3","content":"1–3 ans (Échelle & Référence)"},{"id":"bullet_list-mtgonsdn-158","type":"bullet_list","content":"Faire de Flow une référence dans sa niche"},{"id":"bullet_list-mtgonsdn-159","type":"bullet_list","content":"Développer un produit assez fort pour se recommander presque par lui-même"},{"id":"bullet_list-mtgonsdn-160","type":"bullet_list","content":"Créer une solution à la fois operational, visuelle et stratégique"},{"id":"div-mtgonsdn-161","type":"divider","content":""},{"id":"heading_2-mtgonsdn-162","type":"heading_2","content":"💼 Business Model (Modèle Économique)"},{"id":"bullet_list-mtgonsdn-163","type":"bullet_list","content":"Paiement sur abonnement (SaaS = mensuel)"},{"id":"bullet_list-mtgonsdn-164","type":"bullet_list","content":"Tarification accessible selon le restaurant (minimum et maximum)"},{"id":"bullet_list-mtgonsdn-165","type":"bullet_list","content":"Flexibilité selon le besoin, la taille ou le niveau de personnalisation"},{"id":"div-mtgonsdn-166","type":"divider","content":""},{"id":"heading_2-mtgonsdn-167","type":"heading_2","content":"📣 Go-to-Market (Stratégie d''Acquisition)"},{"id":"bullet_list-mtgonsdn-168","type":"bullet_list","content":"Démarrage direct auprès des restaurants — boucle de recommandation / bouche-à-oreille"},{"id":"bullet_list-mtgonsdn-169","type":"bullet_list","content":"Qualité du produit comme moteur principal d''acquisition"},{"id":"bullet_list-mtgonsdn-170","type":"bullet_list","content":"Preuve sociale forte : restaurants mis en valeur + expérience réelle"},{"id":"bullet_list-mtgonsdn-171","type":"bullet_list","content":"Démonstrations directes des fonctionnalités clés"},{"id":"div-mtgonsdn-172","type":"divider","content":""},{"id":"heading_2-mtgonsdn-173","type":"heading_2","content":"🎁 Offre Pilote (90 jours) — Premiers clients"},{"id":"paragraph-mtgonsdn-174","type":"paragraph","content":"Objectif de la phase d''embarquement : 3 à 5 restaurants et cafés pilotes pour valider le produit et générer les premières études de cas."},{"id":"table-mtgonsdn-175","type":"table","content":"","tableData":[["Élément","Détail"],["Prix","0 $ (gratuit pendant 90 jours)"],["Engagement","Retour d''expérience complet et étude de cas (1 à 2 heures de feedback / semaine)"],["Places disponibles","3 à 5 places maximum"],["Garantie","Si la valeur n''est pas au rendez-vous après 90 jours, aucun frais, jamais."]]},{"id":"div-mtgonsdn-176","type":"divider","content":""},{"id":"heading_3-mtgonsdn-177","type":"heading_3","content":"📝 Mises à jour & Notes d''exécution"},{"id":"bullet_list-mtgonsdn-178","type":"bullet_list","content":"Mise à jour (15 juillet 2026) : Le module de commande directe (paiement sur place, sans commission) est à l''essai en mode Connect-ready — non pas pour tout remplacer dans l''ancien système, mais pour tester à l''essai sans risque."},{"id":"bullet_list-mtgonsdn-179","type":"bullet_list","content":"Positionnement du pilote : Générateur de meilleure rentabilité + Combiner l''expérience de menu + Commande directe (seulement sur place, 0% commission)."},{"id":"bullet_list-mtgonsdn-180","type":"bullet_list","content":"⚠️ Principe \"Non pas tout changer\" : Le système est un canal complémentaire, pas un POS total à remplacer immédiatement. Au moment d''imprimer la commande sur place ou via QR code, rien ne saute."},{"id":"bullet_list-mtgonsdn-181","type":"bullet_list","content":"Session d''essai (24 juillet 2026) : Flow — 150/150 remplis, en cas réels et automatisés (parcours complet, numérotation, bag de préparation) avant mise en service réelle."}]}'::jsonb,
  10,
  'Direction Minerva',
  true,
  false,
  false,
  101,
  'flow',
  10
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Minerva Flow : Dossier Produit, Vision & Offre Pilote');

-- sop-restaurant-margin-recovery
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Pilier 1 (Flow) : Acquisition Restauration & Démo Directe 0% Commission',
  'Les 4 failles critiques et contre-pieds radicaux pour convertir les restaurateurs grâce à l’audit public et la commande directe à 0% de commission.',
  'Ventes & Prospection',
  '## Pilier 1 — Minerva Flow (SaaS Restos & Cafés)

### Principe Fondamental
Réduire l''effort du restaurateur à zéro en utilisant des données 100% publiques pour calculer ses pertes Uber Eats / DoorDash, puis lui livrer son menu pré-configuré dans une démo vivante à 0% de commission.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : La Friction de la Donnée
- **Le piège :** Demander relevés Uber Eats, exports de caisse, ou coûts de staff avant de montrer quoi que ce soit.
- **Correction :** Audit public proactif. Prix menu sur Google Maps / site web vs prix majorés sur UberEats. Volume estimé à partir des avis Google. Livraison en vidéo 60 secondes avec chiffre précis.
- **Opener de prospection :** *« On a regardé votre menu sur Uber Eats. Sur votre [plat signature], vous perdez environ X$ par commande. On a simulé ça en une minute — voici le lien. »*

#### 2. Faille #2 : Le Rapport qui Prend la Poussière
- **Le piège :** Envoyer un PDF d''audit statique.
- **Correction :** Livrer un lien vers son menu déjà configuré en démo sur Minerva Flow (5 plats réels). Il visualise son restaurant avant d''avoir signé quoi que ce soit.
- **Précaution :** *« On a pris 5 minutes pour recréer vos plats signature dans l''interface — c''est juste pour que vous visualisiez. Rien n''est en ligne. »*

#### 3. Faille #3 : La Peur du Bug pendant le Coup de Feu
- **Le piège :** Positionner l''outil comme remplacement du POS en place.
- **Correction :** Canal parallèle pour clients fidèles / emporter. Protocole test 5 minutes en cuisine sur imprimante thermique avec fiche plastifiée au comptoir.

#### 4. Faille #4 : L''Absence de Passerelle vers l''Agence
- **Le piège :** Résoudre la commission puis arrêter la relation.
- **Correction :** Upsell axé rétention : SEO Local Google Maps, QR codes sur emballages et campagnes SMS clients existants.

---

### Règles d''Exécution & Timing
- **Timing :** Mardi ou mercredi, 14h30–16h (creux de service).
- **Canal :** Visite physique dans les quartiers cibles (Plateau, Villeray, Rosemont, Mile-End) avec DM Instagram en appui.
- **Staff inclus :** Fiche comptoir plastifiée 1 page + briefing 15 min de l''équipe avant le premier service.',
  '{"blocks":[{"id":"heading_2-mtgonsdn-182","type":"heading_2","content":"Pilier 1 — Minerva Flow (SaaS Restos & Cafés)"},{"id":"heading_3-mtgonsdn-183","type":"heading_3","content":"Principe Fondamental"},{"id":"paragraph-mtgonsdn-184","type":"paragraph","content":"Réduire l''effort du restaurateur à zéro en utilisant des données 100% publiques pour calculer ses pertes Uber Eats / DoorDash, puis lui livrer son menu pré-configuré dans une démo vivante à 0% de commission."},{"id":"div-mtgonsdn-185","type":"divider","content":""},{"id":"heading_3-mtgonsdn-186","type":"heading_3","content":"Les 4 Failles & Contre-Pieds Radicaux"},{"id":"paragraph-mtgonsdn-187","type":"paragraph","content":"#### 1. Faille #1 : La Friction de la Donnée"},{"id":"bullet_list-mtgonsdn-188","type":"bullet_list","content":"Le piège : Demander relevés Uber Eats, exports de caisse, ou coûts de staff avant de montrer quoi que ce soit."},{"id":"bullet_list-mtgonsdn-189","type":"bullet_list","content":"Correction : Audit public proactif. Prix menu sur Google Maps / site web vs prix majorés sur UberEats. Volume estimé à partir des avis Google. Livraison en vidéo 60 secondes avec chiffre précis."},{"id":"bullet_list-mtgonsdn-190","type":"bullet_list","content":"Opener de prospection : « On a regardé votre menu sur Uber Eats. Sur votre [plat signature], vous perdez environ X$ par commande. On a simulé ça en une minute — voici le lien. »"},{"id":"paragraph-mtgonsdn-191","type":"paragraph","content":"#### 2. Faille #2 : Le Rapport qui Prend la Poussière"},{"id":"bullet_list-mtgonsdn-192","type":"bullet_list","content":"Le piège : Envoyer un PDF d''audit statique."},{"id":"bullet_list-mtgonsdn-193","type":"bullet_list","content":"Correction : Livrer un lien vers son menu déjà configuré en démo sur Minerva Flow (5 plats réels). Il visualise son restaurant avant d''avoir signé quoi que ce soit."},{"id":"bullet_list-mtgonsdn-194","type":"bullet_list","content":"Précaution : « On a pris 5 minutes pour recréer vos plats signature dans l''interface — c''est juste pour que vous visualisiez. Rien n''est en ligne. »"},{"id":"paragraph-mtgonsdn-195","type":"paragraph","content":"#### 3. Faille #3 : La Peur du Bug pendant le Coup de Feu"},{"id":"bullet_list-mtgonsdn-196","type":"bullet_list","content":"Le piège : Positionner l''outil comme remplacement du POS en place."},{"id":"bullet_list-mtgonsdn-197","type":"bullet_list","content":"Correction : Canal parallèle pour clients fidèles / emporter. Protocole test 5 minutes en cuisine sur imprimante thermique avec fiche plastifiée au comptoir."},{"id":"paragraph-mtgonsdn-198","type":"paragraph","content":"#### 4. Faille #4 : L''Absence de Passerelle vers l''Agence"},{"id":"bullet_list-mtgonsdn-199","type":"bullet_list","content":"Le piège : Résoudre la commission puis arrêter la relation."},{"id":"bullet_list-mtgonsdn-200","type":"bullet_list","content":"Correction : Upsell axé rétention : SEO Local Google Maps, QR codes sur emballages et campagnes SMS clients existants."},{"id":"div-mtgonsdn-201","type":"divider","content":""},{"id":"heading_3-mtgonsdn-202","type":"heading_3","content":"Règles d''Exécution & Timing"},{"id":"bullet_list-mtgonsdn-203","type":"bullet_list","content":"Timing : Mardi ou mercredi, 14h30–16h (creux de service)."},{"id":"bullet_list-mtgonsdn-204","type":"bullet_list","content":"Canal : Visite physique dans les quartiers cibles (Plateau, Villeray, Rosemont, Mile-End) avec DM Instagram en appui."},{"id":"bullet_list-mtgonsdn-205","type":"bullet_list","content":"Staff inclus : Fiche comptoir plastifiée 1 page + briefing 15 min de l''équipe avant le premier service."}]}'::jsonb,
  8,
  'Direction Minerva',
  true,
  false,
  false,
  102,
  'flow',
  8
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Pilier 1 (Flow) : Acquisition Restauration & Démo Directe 0% Commission');

-- sop-minerva-reach-playbook
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Pilier 2 (Reach) : Prospection 50 Leads QC & Playbook de Réponses',
  'Méthodologie pour pré-qualifier 50 prospects locaux avec signaux d’achat, validation manuelle des 10 premiers messages et scripts de closing.',
  'Ventes & Prospection',
  '## Pilier 2 — Minerva Reach (Prospection Automatisée Québec)

### Principe Fondamental
Ne jamais demander d''accès CRM ou de listes de contacts au prospect. Minerva construit la première liste de 50 prospects qualifiés avec contexte d''achat visible publiquement comme cadeau préalable à la conversation.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : Friction de la Donnée
- **Correction :** Construire la liste de 50 prospects qualifiés depuis LinkedIn, Google Maps, Registre des entreprises du Québec et sites sectoriels avant le premier appel.
- **Message :** *« Avant qu''on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre ICP et qui ont un signal d''achat actif. Voici la liste — c''est notre façon de vous montrer comment on travaille. »*

#### 2. Faille #2 : Rapport qui Prend la Poussière
- **Règle :** Le livrable de Minerva Reach n''est jamais une liste — c''est des **réponses reçues**.
- **Correction :** Accompagner la liste de messages personnalisés déjà rédigés et envoyer les 10 premiers dans la semaine de lancement.

#### 3. Faille #3 : Peur du Spam et de la Réputation
- **Correction :** Batch initial de 10 messages 100% manuels et personnalisés, soumis à validation par le client avant tout envoi.

#### 4. Faille #4 : Leads Chauds Non Closés
- **Correction :** Fournir le Playbook de réponses (scripts par type d''objection) et organiser une session mensuelle de 30 min d''ajustement des angles.

---

### Règles d''Exécution Reach
- **ICP :** PME et entrepreneurs du Québec (ton direct, local, pas de jargon corporatif creux).
- **Volume initial :** 20–30 prises de contact / semaine.
- **KPI principal :** Taux de réponse positive.',
  '{"blocks":[{"id":"heading_2-mtgonsdn-206","type":"heading_2","content":"Pilier 2 — Minerva Reach (Prospection Automatisée Québec)"},{"id":"heading_3-mtgonsdn-207","type":"heading_3","content":"Principe Fondamental"},{"id":"paragraph-mtgonsdn-208","type":"paragraph","content":"Ne jamais demander d''accès CRM ou de listes de contacts au prospect. Minerva construit la première liste de 50 prospects qualifiés avec contexte d''achat visible publiquement comme cadeau préalable à la conversation."},{"id":"div-mtgonsdn-209","type":"divider","content":""},{"id":"heading_3-mtgonsdn-210","type":"heading_3","content":"Les 4 Failles & Contre-Pieds Radicaux"},{"id":"paragraph-mtgonsdn-211","type":"paragraph","content":"#### 1. Faille #1 : Friction de la Donnée"},{"id":"bullet_list-mtgonsdn-212","type":"bullet_list","content":"Correction : Construire la liste de 50 prospects qualifiés depuis LinkedIn, Google Maps, Registre des entreprises du Québec et sites sectoriels avant le premier appel."},{"id":"bullet_list-mtgonsdn-213","type":"bullet_list","content":"Message : « Avant qu''on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre ICP et qui ont un signal d''achat actif. Voici la liste — c''est notre façon de vous montrer comment on travaille. »"},{"id":"paragraph-mtgonsdn-214","type":"paragraph","content":"#### 2. Faille #2 : Rapport qui Prend la Poussière"},{"id":"bullet_list-mtgonsdn-215","type":"bullet_list","content":"Règle : Le livrable de Minerva Reach n''est jamais une liste — c''est des réponses reçues."},{"id":"bullet_list-mtgonsdn-216","type":"bullet_list","content":"Correction : Accompagner la liste de messages personnalisés déjà rédigés et envoyer les 10 premiers dans la semaine de lancement."},{"id":"paragraph-mtgonsdn-217","type":"paragraph","content":"#### 3. Faille #3 : Peur du Spam et de la Réputation"},{"id":"bullet_list-mtgonsdn-218","type":"bullet_list","content":"Correction : Batch initial de 10 messages 100% manuels et personnalisés, soumis à validation par le client avant tout envoi."},{"id":"paragraph-mtgonsdn-219","type":"paragraph","content":"#### 4. Faille #4 : Leads Chauds Non Closés"},{"id":"bullet_list-mtgonsdn-220","type":"bullet_list","content":"Correction : Fournir le Playbook de réponses (scripts par type d''objection) et organiser une session mensuelle de 30 min d''ajustement des angles."},{"id":"div-mtgonsdn-221","type":"divider","content":""},{"id":"heading_3-mtgonsdn-222","type":"heading_3","content":"Règles d''Exécution Reach"},{"id":"bullet_list-mtgonsdn-223","type":"bullet_list","content":"ICP : PME et entrepreneurs du Québec (ton direct, local, pas de jargon corporatif creux)."},{"id":"bullet_list-mtgonsdo-224","type":"bullet_list","content":"Volume initial : 20–30 prises de contact / semaine."},{"id":"bullet_list-mtgonsdo-225","type":"bullet_list","content":"KPI principal : Taux de réponse positive."}]}'::jsonb,
  9,
  'Direction Minerva',
  true,
  false,
  false,
  103,
  'reach',
  9
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Pilier 2 (Reach) : Prospection 50 Leads QC & Playbook de Réponses');

-- sop-agence-prototype-j7
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Pilier 3 (Agence) : Audit Surface 30-Min, Prototype J+7 & Mode Solo',
  'Processus d’implémentation sur mesure sans cahier des charges interminable : prototype concret dès la semaine 1 et suivi mensuel $300-$500/mois.',
  'Gestion de compte',
  '## Pilier 3 — Agence Sur Mesure (Implémentations Personnalisées)

### Principe Fondamental
Remplacer les réunions de discovery interminables de 2 heures par un audit de surface public en 30 minutes, suivi d''un prototype fonctionnel livrable dès la semaine 1 (J+7) pour bâtir la confiance sur du concret.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : Friction de la Donnée
- **Correction :** Audit de surface en 30 minutes basé sur ce qui est public (site, outils déclarés, parcours utilisateur). Arriver avec 3 points de friction déjà documentés.
- **Message :** *« Avant qu''on se parle, on a passé 30 minutes sur votre setup actuel. On a identifié 3 endroits où vous perdez du temps ou de l''argent. On veut vous les montrer — pas vous vendre quelque chose. »*

#### 2. Faille #2 : Le Document de Spécifications que Personne ne Lit
- **Règle :** Semaine 1 = prototype fonctionnel, pas un document. Ne jamais livrer un PDF avant un artefact manipulable.

#### 3. Faille #3 : Peur de la Dépendance Technique
- **Correction :** Construire sur la stack existante du client quand possible. Livrer une vidéo Loom de 5 min et un "Mode Solo" garantissant son autonomie complète en cas d''arrêt.

#### 4. Faille #4 : Le Projet One-Shot sans Récurrence
- **Correction :** Co-pilotage mensuel léger (1h/mois d''analyse des métriques et ajustements) facturé 300–500$/mois.

---

### Règles d''Exécution Agence
- **Cible :** Entrepreneurs déjà convaincus de l''efficacité technologique (early adopters).
- **Prix :** Le prototype justifie le prix ; ne jamais annoncer de devis avant d''avoir montré l''artefact.',
  '{"blocks":[{"id":"heading_2-mtgonsdo-226","type":"heading_2","content":"Pilier 3 — Agence Sur Mesure (Implémentations Personnalisées)"},{"id":"heading_3-mtgonsdo-227","type":"heading_3","content":"Principe Fondamental"},{"id":"paragraph-mtgonsdo-228","type":"paragraph","content":"Remplacer les réunions de discovery interminables de 2 heures par un audit de surface public en 30 minutes, suivi d''un prototype fonctionnel livrable dès la semaine 1 (J+7) pour bâtir la confiance sur du concret."},{"id":"div-mtgonsdo-229","type":"divider","content":""},{"id":"heading_3-mtgonsdo-230","type":"heading_3","content":"Les 4 Failles & Contre-Pieds Radicaux"},{"id":"paragraph-mtgonsdo-231","type":"paragraph","content":"#### 1. Faille #1 : Friction de la Donnée"},{"id":"bullet_list-mtgonsdo-232","type":"bullet_list","content":"Correction : Audit de surface en 30 minutes basé sur ce qui est public (site, outils déclarés, parcours utilisateur). Arriver avec 3 points de friction déjà documentés."},{"id":"bullet_list-mtgonsdo-233","type":"bullet_list","content":"Message : « Avant qu''on se parle, on a passé 30 minutes sur votre setup actuel. On a identifié 3 endroits où vous perdez du temps ou de l''argent. On veut vous les montrer — pas vous vendre quelque chose. »"},{"id":"paragraph-mtgonsdo-234","type":"paragraph","content":"#### 2. Faille #2 : Le Document de Spécifications que Personne ne Lit"},{"id":"bullet_list-mtgonsdo-235","type":"bullet_list","content":"Règle : Semaine 1 = prototype fonctionnel, pas un document. Ne jamais livrer un PDF avant un artefact manipulable."},{"id":"paragraph-mtgonsdo-236","type":"paragraph","content":"#### 3. Faille #3 : Peur de la Dépendance Technique"},{"id":"bullet_list-mtgonsdo-237","type":"bullet_list","content":"Correction : Construire sur la stack existante du client quand possible. Livrer une vidéo Loom de 5 min et un \"Mode Solo\" garantissant son autonomie complète en cas d''arrêt."},{"id":"paragraph-mtgonsdo-238","type":"paragraph","content":"#### 4. Faille #4 : Le Projet One-Shot sans Récurrence"},{"id":"bullet_list-mtgonsdo-239","type":"bullet_list","content":"Correction : Co-pilotage mensuel léger (1h/mois d''analyse des métriques et ajustements) facturé 300–500$/mois."},{"id":"div-mtgonsdo-240","type":"divider","content":""},{"id":"heading_3-mtgonsdo-241","type":"heading_3","content":"Règles d''Exécution Agence"},{"id":"bullet_list-mtgonsdo-242","type":"bullet_list","content":"Cible : Entrepreneurs déjà convaincus de l''efficacité technologique (early adopters)."},{"id":"bullet_list-mtgonsdo-243","type":"bullet_list","content":"Prix : Le prototype justifie le prix ; ne jamais annoncer de devis avant d''avoir montré l''artefact."}]}'::jsonb,
  10,
  'Direction Minerva',
  true,
  false,
  false,
  104,
  'agency',
  10
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Pilier 3 (Agence) : Audit Surface 30-Min, Prototype J+7 & Mode Solo');

-- sop-mes-inspirations-media
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Pilier 4 (Média) : Production Vidéo Cas Clients 60s & CTA Piliers',
  'Framework de scripting Build-in-Public : hooks chiffrés réels, documentation des victoires clients et conversion naturelle vers Flow/Reach/Agence.',
  'Campagnes Ads',
  '## Pilier 4 — Mes Inspirations (Marque Média & Contenu)

### Principe Fondamental
Mes Inspirations est le moteur de preuve sociale pour les 3 autres piliers de Minerva. Chaque client signé ou délivré est documenté en temps réel (Build in Public) avec des chiffres réels pour alimenter le flywheel d''acquisition.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : Friction d''Accès à la Valeur
- **Règle :** Valeur totale en accès libre sans barrière. Le CTA arrive à la fin de la vidéo.

#### 2. Faille #2 : Vues sans Conversion
- **Correction :** Chaque vidéo a un unique CTA relié directement à un pilier (Flow, Reach, ou Agence).

#### 3. Faille #3 : Sentiment de Vente Déguisée
- **Correction :** Vendre dès le départ avec une transparence totale sur le parcours d''entreprise (Build in Public).

#### 4. Faille #4 : Média Déconnecté du Business
- **Correction :** 1 client Flow = 1 vidéo cas client. 1 projet Agence = 1 avant/après chiffré.

---

### Format & Production
- **Durée :** 60 à 90 secondes (1 insight = 1 vidéo).
- **Hook :** Toujours basé sur un chiffre concret (*« Ce café perdait 1 400$/mois sans le savoir... »*).
- **Distribution :** YouTube Shorts en priorité (référencement long terme) puis déclinaison Reels & LinkedIn.',
  '{"blocks":[{"id":"heading_2-mtgonsdo-244","type":"heading_2","content":"Pilier 4 — Mes Inspirations (Marque Média & Contenu)"},{"id":"heading_3-mtgonsdo-245","type":"heading_3","content":"Principe Fondamental"},{"id":"paragraph-mtgonsdo-246","type":"paragraph","content":"Mes Inspirations est le moteur de preuve sociale pour les 3 autres piliers de Minerva. Chaque client signé ou délivré est documenté en temps réel (Build in Public) avec des chiffres réels pour alimenter le flywheel d''acquisition."},{"id":"div-mtgonsdo-247","type":"divider","content":""},{"id":"heading_3-mtgonsdo-248","type":"heading_3","content":"Les 4 Failles & Contre-Pieds Radicaux"},{"id":"paragraph-mtgonsdo-249","type":"paragraph","content":"#### 1. Faille #1 : Friction d''Accès à la Valeur"},{"id":"bullet_list-mtgonsdo-250","type":"bullet_list","content":"Règle : Valeur totale en accès libre sans barrière. Le CTA arrive à la fin de la vidéo."},{"id":"paragraph-mtgonsdo-251","type":"paragraph","content":"#### 2. Faille #2 : Vues sans Conversion"},{"id":"bullet_list-mtgonsdo-252","type":"bullet_list","content":"Correction : Chaque vidéo a un unique CTA relié directement à un pilier (Flow, Reach, ou Agence)."},{"id":"paragraph-mtgonsdo-253","type":"paragraph","content":"#### 3. Faille #3 : Sentiment de Vente Déguisée"},{"id":"bullet_list-mtgonsdo-254","type":"bullet_list","content":"Correction : Vendre dès le départ avec une transparence totale sur le parcours d''entreprise (Build in Public)."},{"id":"paragraph-mtgonsdo-255","type":"paragraph","content":"#### 4. Faille #4 : Média Déconnecté du Business"},{"id":"bullet_list-mtgonsdo-256","type":"bullet_list","content":"Correction : 1 client Flow = 1 vidéo cas client. 1 projet Agence = 1 avant/après chiffré."},{"id":"div-mtgonsdo-257","type":"divider","content":""},{"id":"heading_3-mtgonsdo-258","type":"heading_3","content":"Format & Production"},{"id":"bullet_list-mtgonsdo-259","type":"bullet_list","content":"Durée : 60 à 90 secondes (1 insight = 1 vidéo)."},{"id":"bullet_list-mtgonsdo-260","type":"bullet_list","content":"Hook : Toujours basé sur un chiffre concret (« Ce café perdait 1 400$/mois sans le savoir... »)."},{"id":"bullet_list-mtgonsdo-261","type":"bullet_list","content":"Distribution : YouTube Shorts en priorité (référencement long terme) puis déclinaison Reels & LinkedIn."}]}'::jsonb,
  7,
  'Direction Minerva',
  true,
  false,
  false,
  105,
  'inspirations',
  7
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Pilier 4 (Média) : Production Vidéo Cas Clients 60s & CTA Piliers');

-- sop-framer-delivery
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Process de Livraison Web Framer & Recette 20-Points',
  'Checklist complète pour assurer un déploiement Framer sans faille : SEO, responsive, assets et tracking.',
  'Design Framer',
  '',
  '{"blocks":[]}'::jsonb,
  12,
  'Camille Roy',
  true,
  false,
  false,
  106,
  'agency',
  12
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Process de Livraison Web Framer & Recette 20-Points');

-- sop-minerva-agence-studio-produit
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'Minerva — Agence & Studio Produit : Vue d’Ensemble Stratégique',
  'Écosystème, structure juridique, offre signature restaurants, stratégie marketing, roadmap 12 mois, KPIs, projections financières et gestion des risques de Minerva.',
  'Stratégie & Vision',
  '## Minerva — Agence & Studio Produit

> 🏢 **Montréal, Québec** — Une compagnie hybride qui combine design, systèmes d''automatisation IA et logicielles sur mesure pour les entrepreneurs et les restaurants.

---

## 🌐 Écosystème Minerva

Minerva fonctionne comme une **marque parapluie** (« umbrella brand ») articulée autour de quatre piliers :

### 🏢 Minerva (Agence)
L''entité principale — design, conseil stratégique, sites web Framer, intégration de systèmes.

### 🧠 Minerva OS
Le noyau technique propriétaire — systèmes de gestion, automatisation et tableaux de bord propulsés par l''IA.

### 📡 Minerva Reach
Solution de prospection automatisée spécialisée pour le Québec — tout le cycle de prospection dans une seule app.

### 🌊 Minerva Flow
Cockpit de gestion pour restaurants et cafés — opérations, fournisseurs, inventaire, employés, revenus.

---

## ⚖️ Structure juridique

- **Forme :** Entreprise individuelle enregistrée au Québec (NEQ)
- **Siège :** Montréal, Québec, Canada
- **Fiscalité :** Inscription TPS et TVQ selon le seuil de chiffre d''affaires
- **Propriété intellectuelle :** Minerva conserve la propriété exclusive du code source et des architectures. Les clients bénéficient d''une licence d''exploitation pour leurs plateformes.

---

## 💼 Offre signature — Restaurants & Cafés

**Clientèle cible :** cafés indépendants de niche, restaurants haut de gamme, chaînes locales du Grand Montréal.

| Composante | Description |
| --- | --- |
| **Plateforme Web Framer** | Design sur mesure : accueil, menu dynamique, réservations, galerie, identité |
| **Intégration Minerva OS** | Tableaux de bord, gestion des avis, suivi analytique |
| **Pipeline de contenu** | Création et planification de Reels, Stories, Carrousels automatisés |
| **Accompagnement** | Revues mensuelles et optimisations continues |

---

## 📣 Stratégie marketing

### Canaux prioritaires

| Canal | Orientation | Fréquence |
| --- | --- | --- |
| **Instagram** | Univers visuel Restauration + Éducation Growth/Finance | 1–2/semaine |
| **YouTube / TikTok** | Contenus de fond et capsules sur l''IA, le code, les systèmes | Flux continu |
| **LinkedIn** | Crédibilité B2B, génération de leads décideurs | Hebdomadaire |

### Stratégie d''acquisition B2B (Restaurants)

1. **Criblage :** fichier de 200 profils ICP qualifiés localement
2. **Campagnes directes :** vagues de prospection téléphonique et emails personnalisés
3. **Démos :** prototypes Framer interactifs avant signature
4. **Phase pilote :** 1–2 clients initiaux à conditions préférentielles pour études de cas

---

## 📈 Roadmap stratégique (12 mois)

| Phase | Période | Priorités |
| --- | --- | --- |
| **1. Fondations** | Juillet–Août | Enregistrement légal, charte graphique, vitrine Framer, calendrier éditorial |
| **2. Conquête locale** | Septembre–Novembre | Prospection restaurants, signatures pilotes, déploiement systèmes |
| **3. Lancement SaaS** | Novembre–Février | Spécifications Reach & HelloAdvice, versions V1, bêta test |
| **4. Passage à l''échelle** | Mars–Juin | Stabilisation rétention, accélération budgets publicitaires, croissance MRR |

---

## 🎯 KPI prioritaires (Année 1)

| Indicateur | Cible |
| --- | --- |
| **Contrats restaurants actifs** | 3 |
| **MRR global** | En croissance continue |
| **Utilisateurs actifs mensuels (apps)** | Suivi mensuel |
| **Rétention 30/60/90 jours** | Taux cible à définir |

---

## 📊 Projections financières (Année 1 — scénario intermédiaire)

| Unité d''affaires | Hypothèses | Revenus estimés |
| --- | --- | --- |
| Services Restaurants (Setup) | 3 contrats × 3 000 $ | 9 000 $ |
| Services Restaurants (Récurrent) | 3 abonnements × 250 $/mois | 9 000 $ |
| HelloAdvice SaaS | 100–150 abonnés (~12 $ ARPU) | 14 000 $ – 21 000 $ |
| Minerva Reach SaaS | 50–100 abonnés (~25 $ ARPU) | 15 000 $ – 30 000 $ |
| **TOTAL** | | **38 000 $ – 48 000 $** |

---

## ⚠️ Gestion des risques

| Risque | Mitigation |
| --- | --- |
| **Disponibilité opérationnelle** | Priorisation stricte des livrables essentiels, automatisation maximale |
| **Inertie du marché SaaS** | Lancement MVP pour collecter données et ajuster l''offre rapidement |
| **Conformité réglementaire** | Audit comptable et conseil juridique dès les premiers paliers de revenus |

---

### Voir aussi dans l''Académie
- [Pilier 4 — Mes Inspirations (Marque Média & Contenu)](/academy/sop-mes-inspirations-media)
- [Produits Minerva (roadmap)](/produits)',
  '{"blocks":[{"id":"heading_2-mtgonsdo-262","type":"heading_2","content":"Minerva — Agence & Studio Produit"},{"id":"quote-mtgonsdo-263","type":"quote","content":"🏢 Montréal, Québec — Une compagnie hybride qui combine design, systèmes d''automatisation IA et logicielles sur mesure pour les entrepreneurs et les restaurants."},{"id":"div-mtgonsdo-264","type":"divider","content":""},{"id":"heading_2-mtgonsdo-265","type":"heading_2","content":"🌐 Écosystème Minerva"},{"id":"paragraph-mtgonsdo-266","type":"paragraph","content":"Minerva fonctionne comme une marque parapluie (« umbrella brand ») articulée autour de quatre piliers :"},{"id":"heading_3-mtgonsdo-267","type":"heading_3","content":"🏢 Minerva (Agence)"},{"id":"paragraph-mtgonsdo-268","type":"paragraph","content":"L''entité principale — design, conseil stratégique, sites web Framer, intégration de systèmes."},{"id":"heading_3-mtgonsdo-269","type":"heading_3","content":"🧠 Minerva OS"},{"id":"paragraph-mtgonsdo-270","type":"paragraph","content":"Le noyau technique propriétaire — systèmes de gestion, automatisation et tableaux de bord propulsés par l''IA."},{"id":"heading_3-mtgonsdo-271","type":"heading_3","content":"📡 Minerva Reach"},{"id":"paragraph-mtgonsdo-272","type":"paragraph","content":"Solution de prospection automatisée spécialisée pour le Québec — tout le cycle de prospection dans une seule app."},{"id":"heading_3-mtgonsdo-273","type":"heading_3","content":"🌊 Minerva Flow"},{"id":"paragraph-mtgonsdo-274","type":"paragraph","content":"Cockpit de gestion pour restaurants et cafés — opérations, fournisseurs, inventaire, employés, revenus."},{"id":"div-mtgonsdo-275","type":"divider","content":""},{"id":"heading_2-mtgonsdo-276","type":"heading_2","content":"⚖️ Structure juridique"},{"id":"bullet_list-mtgonsdo-277","type":"bullet_list","content":"Forme : Entreprise individuelle enregistrée au Québec (NEQ)"},{"id":"bullet_list-mtgonsdo-278","type":"bullet_list","content":"Siège : Montréal, Québec, Canada"},{"id":"bullet_list-mtgonsdo-279","type":"bullet_list","content":"Fiscalité : Inscription TPS et TVQ selon le seuil de chiffre d''affaires"},{"id":"bullet_list-mtgonsdo-280","type":"bullet_list","content":"Propriété intellectuelle : Minerva conserve la propriété exclusive du code source et des architectures. Les clients bénéficient d''une licence d''exploitation pour leurs plateformes."},{"id":"div-mtgonsdo-281","type":"divider","content":""},{"id":"heading_2-mtgonsdo-282","type":"heading_2","content":"💼 Offre signature — Restaurants & Cafés"},{"id":"paragraph-mtgonsdo-283","type":"paragraph","content":"Clientèle cible : cafés indépendants de niche, restaurants haut de gamme, chaînes locales du Grand Montréal."},{"id":"table-mtgonsdo-284","type":"table","content":"","tableData":[["Composante","Description"],["Plateforme Web Framer","Design sur mesure : accueil, menu dynamique, réservations, galerie, identité"],["Intégration Minerva OS","Tableaux de bord, gestion des avis, suivi analytique"],["Pipeline de contenu","Création et planification de Reels, Stories, Carrousels automatisés"],["Accompagnement","Revues mensuelles et optimisations continues"]]},{"id":"div-mtgonsdo-285","type":"divider","content":""},{"id":"heading_2-mtgonsdo-286","type":"heading_2","content":"📣 Stratégie marketing"},{"id":"heading_3-mtgonsdo-287","type":"heading_3","content":"Canaux prioritaires"},{"id":"table-mtgonsdo-288","type":"table","content":"","tableData":[["Canal","Orientation","Fréquence"],["Instagram","Univers visuel Restauration + Éducation Growth/Finance","1–2/semaine"],["YouTube / TikTok","Contenus de fond et capsules sur l''IA, le code, les systèmes","Flux continu"],["LinkedIn","Crédibilité B2B, génération de leads décideurs","Hebdomadaire"]]},{"id":"heading_3-mtgonsdo-289","type":"heading_3","content":"Stratégie d''acquisition B2B (Restaurants)"},{"id":"numbered_list-mtgonsdo-290","type":"numbered_list","content":"Criblage : fichier de 200 profils ICP qualifiés localement"},{"id":"numbered_list-mtgonsdo-291","type":"numbered_list","content":"Campagnes directes : vagues de prospection téléphonique et emails personnalisés"},{"id":"numbered_list-mtgonsdo-292","type":"numbered_list","content":"Démos : prototypes Framer interactifs avant signature"},{"id":"numbered_list-mtgonsdo-293","type":"numbered_list","content":"Phase pilote : 1–2 clients initiaux à conditions préférentielles pour études de cas"},{"id":"div-mtgonsdo-294","type":"divider","content":""},{"id":"heading_2-mtgonsdo-295","type":"heading_2","content":"📈 Roadmap stratégique (12 mois)"},{"id":"table-mtgonsdo-296","type":"table","content":"","tableData":[["Phase","Période","Priorités"],["1. Fondations","Juillet–Août","Enregistrement légal, charte graphique, vitrine Framer, calendrier éditorial"],["2. Conquête locale","Septembre–Novembre","Prospection restaurants, signatures pilotes, déploiement systèmes"],["3. Lancement SaaS","Novembre–Février","Spécifications Reach & HelloAdvice, versions V1, bêta test"],["4. Passage à l''échelle","Mars–Juin","Stabilisation rétention, accélération budgets publicitaires, croissance MRR"]]},{"id":"div-mtgonsdo-297","type":"divider","content":""},{"id":"heading_2-mtgonsdo-298","type":"heading_2","content":"🎯 KPI prioritaires (Année 1)"},{"id":"table-mtgonsdo-299","type":"table","content":"","tableData":[["Indicateur","Cible"],["Contrats restaurants actifs","3"],["MRR global","En croissance continue"],["Utilisateurs actifs mensuels (apps)","Suivi mensuel"],["Rétention 30/60/90 jours","Taux cible à définir"]]},{"id":"div-mtgonsdo-300","type":"divider","content":""},{"id":"heading_2-mtgonsdo-301","type":"heading_2","content":"📊 Projections financières (Année 1 — scénario intermédiaire)"},{"id":"table-mtgonsdo-302","type":"table","content":"","tableData":[["Unité d''affaires","Hypothèses","Revenus estimés"],["Services Restaurants (Setup)","3 contrats × 3 000 $","9 000 $"],["Services Restaurants (Récurrent)","3 abonnements × 250 $/mois","9 000 $"],["HelloAdvice SaaS","100–150 abonnés (~12 $ ARPU)","14 000 $ – 21 000 $"],["Minerva Reach SaaS","50–100 abonnés (~25 $ ARPU)","15 000 $ – 30 000 $"],["TOTAL","","38 000 $ – 48 000 $"]]},{"id":"div-mtgonsdo-303","type":"divider","content":""},{"id":"heading_2-mtgonsdo-304","type":"heading_2","content":"⚠️ Gestion des risques"},{"id":"table-mtgonsdo-305","type":"table","content":"","tableData":[["Risque","Mitigation"],["Disponibilité opérationnelle","Priorisation stricte des livrables essentiels, automatisation maximale"],["Inertie du marché SaaS","Lancement MVP pour collecter données et ajuster l''offre rapidement"],["Conformité réglementaire","Audit comptable et conseil juridique dès les premiers paliers de revenus"]]},{"id":"div-mtgonsdo-306","type":"divider","content":""},{"id":"heading_3-mtgonsdo-307","type":"heading_3","content":"Voir aussi dans l''Académie"},{"id":"bullet_list-mtgonsdo-308","type":"bullet_list","content":"Pilier 4 — Mes Inspirations (Marque Média & Contenu) (/academy/sop-mes-inspirations-media)"},{"id":"bullet_list-mtgonsdo-309","type":"bullet_list","content":"Produits Minerva (roadmap) (/produits)"}]}'::jsonb,
  10,
  'Direction Minerva',
  true,
  false,
  false,
  107,
  NULL,
  10
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Minerva — Agence & Studio Produit : Vue d’Ensemble Stratégique');

-- sop-ai-01-foundations
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-IA-01 : Fondations du AI Engineering Moderne & Systèmes Agentiques',
  'Théorie et pratique des LLMs en production : Context Windows, Context Engineering, Function Calling, boucles ReAct et optimisation des tokens.',
  'IA & Ingénierie',
  '# SOP-IA-01 : Fondations du AI Engineering Moderne & Systèmes Agentiques

**Catégorie :** IA & Ingénierie  
**Public cible :** Développeurs Fullstack, Ingénieurs IA, Tech Leads Minerva  
**Temps de lecture :** 25 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Du Prompt Engineering au System & Context Engineering

Le passage de l''expérimentation naïve de modèles de langage (LLMs) à l''ingénierie logicielle robuste exige d''abandonner l''idée que « prompter » suffit. Le **AI Engineering** traite le modèle comme une unité de calcul probabiliste (une fonction non déterministe) devant être orchestrée dans une boucle logicielle déterministe.

```
┌───────────────────────────────────────────────────────────┐
│                    CONTEXT WINDOW                         │
│ ┌───────────────────────┬───────────────────────────────┐ │
│ │ System Instructions   │ In-Context Examples (Few-Shot)│ │
│ ├───────────────────────┼───────────────────────────────┤ │
│ │ Tool Definitions      │ Dynamic Retrieved RAG State   │ │
│ ├───────────────────────┼───────────────────────────────┤ │
│ │ Conversation History  │ User Turn & Scratchpad        │ │
│ └───────────────────────┴───────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### Mécanique Fondamentale des LLMs
- **Autorégression & Tokenisation** : Les modèles génèrent du texte token par token selon la distribution de probabilité conditionnelle P(w_t | w_1, ..., w_{t-1}).
- **Attention & Limites de Contexte** : Bien que les fenêtres de contexte modernes atteignent 128k à 2M tokens (Gemini 2.0, Claude 3.7 Sonnet, GPT-4o), le phénomène de **« Lost in the Middle »** persiste : l''attention est maximale sur le début (System prompt) et la fin immédiate du contexte.
- **Règle Minerva** : Placez toujours les contraintes non négociables et les types de retour au tout début et répétez les contraintes critiques juste avant le token de fin d''instruction.

---

## 2. Context Engineering & Sorties Structurées

Pour intégrer un LLM dans une application TypeScript / Next.js, la sortie doit être typée et validable à l''exécution.

### Typage Stricte avec Zod & JSON Schema
Tout appel de modèle générant des données métier (ex: extraction d''audit, propositions, scoring CRM) doit passer par un schéma Zod :

```typescript
import { z } from ''zod'';

export const LeadAuditExtractionSchema = z.object({
  restaurant_name: z.string().min(1),
  primary_bottleneck: z.enum([
    ''staff_shortage'',
    ''high_food_cost'',
    ''low_turnover'',
    ''delivery_margins'',
  ]),
  estimated_monthly_leakage_cad: z.number().nonnegative(),
  recommended_initiatives: z.array(
    z.object({
      title: z.string(),
      pillar: z.enum([''flow'', ''reach'', ''agency'', ''inspirations'']),
      impact_score: z.number().min(1).max(10),
      effort_days: z.number().int().positive(),
    })
  ).min(1),
});

export type LeadAuditExtraction = z.infer<typeof LeadAuditExtractionSchema>;
```

### Règles d''Or du Context Engineering :
1. **Éviter le bruit inutile** : Supprimez les balises HTML ou CSS superflues des contextes injectés.
2. **Normalisation temporelle** : Fournissez toujours l''horodatage courant explicite (`ISO-8601`).
3. **Idempotence des prompts** : Structurer les entrées avec des délimiteurs clairs (`<CONTEXT>`, `<RULES>`, `<TASK>`).

---

## 3. Function Calling & Tool Augmentation

Le Function Calling (ou Tool Use) est le mécanisme par lequel le modèle émet une intention d''exécuter une fonction externe en générant un objet JSON conforme à un schéma d''arguments.

### Cycle d''Exécution d''un Tool :
1. **Déclaration** : L''hôte fournit la liste des outils (nom, description, paramètres JSON Schema).
2. **Génération d''appel** : Le LLM décide d''appeler un outil et renvoie `tool_calls: [{ name, arguments }]` au lieu d''une réponse textuelle finale.
3. **Exécution hôte** : Le runtime (Node.js/Edge) exécute la fonction réelle (requête SQL Supabase, appel API, sandbox bash).
4. **Injection du résultat** : Le résultat est renvoyé au LLM dans un message de type `tool_result`.
5. **Synthèse ou nouvel appel** : Le modèle interprète le résultat pour répondre à l''utilisateur ou lancer un autre outil.

---

## 4. Architectures Agentiques & Boucles Autonomes

Un agent est un LLM équipé de :
- **Mémoire** (court terme via contexte, long terme via base de données/embeddings)
- **Outils** (lecture/écriture de fichiers, exécution de scripts, appels API)
- **Boucle de contrôle** (Planification, Réflexion, Arrêt conditionnel)

### Le Pattern ReAct (Reason + Act)
L''agent alterne continuellement trois phases :
1. **Thought (Pensée)** : Décomposition du problème, analyse de l''état courant.
2. **Action (Action)** : Sélection de l''outil et génération des paramètres d''appel.
3. **Observation (Observation)** : Lecture de la sortie de l''outil et mise à jour de l''état.

---

## 5. Token Economics, Latency & Caching

### Stratégies d''Optimisation :
1. **Prompt Caching** : Les préfixes de contexte statiques permettent d''économiser jusqu''à **90% du coût** et **80% de la latence**.
2. **Modèles Hybrides & Cascading** :
   - Tâches simples (classification, extraction) → Petits modèles rapides (*Gemini 2.0 Flash*, *Claude 3.5 Haiku*).
   - Tâches complexes (architecture, refactorings profonds, audits d''affaires) → Grands modèles de raisonnement (*Claude 3.7 Sonnet*, *Gemini 2.0 Pro*).
3. **Streaming** : Toujours activer le streaming UI pour une latence perçue inférieure à 400ms.',
  '{"blocks":[{"id":"heading_1-mtgonsdo-310","type":"heading_1","content":"SOP-IA-01 : Fondations du AI Engineering Moderne & Systèmes Agentiques"},{"id":"paragraph-mtgonsdo-311","type":"paragraph","content":"Catégorie : IA & Ingénierie"},{"id":"paragraph-mtgonsdo-312","type":"paragraph","content":"Public cible : Développeurs Fullstack, Ingénieurs IA, Tech Leads Minerva"},{"id":"paragraph-mtgonsdo-313","type":"paragraph","content":"Temps de lecture : 25 minutes"},{"id":"paragraph-mtgonsdo-314","type":"paragraph","content":"Auteur : Équipe Technique Minerva"},{"id":"div-mtgonsdo-315","type":"divider","content":""},{"id":"heading_2-mtgonsdo-316","type":"heading_2","content":"1. Du Prompt Engineering au System & Context Engineering"},{"id":"paragraph-mtgonsdo-317","type":"paragraph","content":"Le passage de l''expérimentation naïve de modèles de langage (LLMs) à l''ingénierie logicielle robuste exige d''abandonner l''idée que « prompter » suffit. Le AI Engineering traite le modèle comme une unité de calcul probabiliste (une fonction non déterministe) devant être orchestrée dans une boucle logicielle déterministe."},{"id":"code-mtgonsdo-318","type":"code_block","content":"┌───────────────────────────────────────────────────────────┐\n│                    CONTEXT WINDOW                         │\n│ ┌───────────────────────┬───────────────────────────────┐ │\n│ │ System Instructions   │ In-Context Examples (Few-Shot)│ │\n│ ├───────────────────────┼───────────────────────────────┤ │\n│ │ Tool Definitions      │ Dynamic Retrieved RAG State   │ │\n│ ├───────────────────────┼───────────────────────────────┤ │\n│ │ Conversation History  │ User Turn & Scratchpad        │ │\n│ └───────────────────────┴───────────────────────────────┘ │\n└───────────────────────────────────────────────────────────┘"},{"id":"heading_3-mtgonsdo-319","type":"heading_3","content":"Mécanique Fondamentale des LLMs"},{"id":"bullet_list-mtgonsdo-320","type":"bullet_list","content":"Autorégression & Tokenisation : Les modèles génèrent du texte token par token selon la distribution de probabilité conditionnelle P(w_t | w_1, ..., w_{t-1})."},{"id":"bullet_list-mtgonsdo-321","type":"bullet_list","content":"Attention & Limites de Contexte : Bien que les fenêtres de contexte modernes atteignent 128k à 2M tokens (Gemini 2.0, Claude 3.7 Sonnet, GPT-4o), le phénomène de « Lost in the Middle » persiste : l''attention est maximale sur le début (System prompt) et la fin immédiate du contexte."},{"id":"bullet_list-mtgonsdo-322","type":"bullet_list","content":"Règle Minerva : Placez toujours les contraintes non négociables et les types de retour au tout début et répétez les contraintes critiques juste avant le token de fin d''instruction."},{"id":"div-mtgonsdo-323","type":"divider","content":""},{"id":"heading_2-mtgonsdo-324","type":"heading_2","content":"2. Context Engineering & Sorties Structurées"},{"id":"paragraph-mtgonsdo-325","type":"paragraph","content":"Pour intégrer un LLM dans une application TypeScript / Next.js, la sortie doit être typée et validable à l''exécution."},{"id":"heading_3-mtgonsdo-326","type":"heading_3","content":"Typage Stricte avec Zod & JSON Schema"},{"id":"paragraph-mtgonsdo-327","type":"paragraph","content":"Tout appel de modèle générant des données métier (ex: extraction d''audit, propositions, scoring CRM) doit passer par un schéma Zod :"},{"id":"code-mtgonsdo-328","type":"code_block","content":"import { z } from ''zod'';\n\nexport const LeadAuditExtractionSchema = z.object({\n  restaurant_name: z.string().min(1),\n  primary_bottleneck: z.enum([\n    ''staff_shortage'',\n    ''high_food_cost'',\n    ''low_turnover'',\n    ''delivery_margins'',\n  ]),\n  estimated_monthly_leakage_cad: z.number().nonnegative(),\n  recommended_initiatives: z.array(\n    z.object({\n      title: z.string(),\n      pillar: z.enum([''flow'', ''reach'', ''agency'', ''inspirations'']),\n      impact_score: z.number().min(1).max(10),\n      effort_days: z.number().int().positive(),\n    })\n  ).min(1),\n});\n\nexport type LeadAuditExtraction = z.infer<typeof LeadAuditExtractionSchema>;","codeLanguage":"typescript"},{"id":"heading_3-mtgonsdo-329","type":"heading_3","content":"Règles d''Or du Context Engineering :"},{"id":"numbered_list-mtgonsdo-330","type":"numbered_list","content":"Éviter le bruit inutile : Supprimez les balises HTML ou CSS superflues des contextes injectés."},{"id":"numbered_list-mtgonsdo-331","type":"numbered_list","content":"Normalisation temporelle : Fournissez toujours l''horodatage courant explicite (ISO-8601)."},{"id":"numbered_list-mtgonsdo-332","type":"numbered_list","content":"Idempotence des prompts : Structurer les entrées avec des délimiteurs clairs (<CONTEXT>, <RULES>, <TASK>)."},{"id":"div-mtgonsdo-333","type":"divider","content":""},{"id":"heading_2-mtgonsdo-334","type":"heading_2","content":"3. Function Calling & Tool Augmentation"},{"id":"paragraph-mtgonsdo-335","type":"paragraph","content":"Le Function Calling (ou Tool Use) est le mécanisme par lequel le modèle émet une intention d''exécuter une fonction externe en générant un objet JSON conforme à un schéma d''arguments."},{"id":"heading_3-mtgonsdo-336","type":"heading_3","content":"Cycle d''Exécution d''un Tool :"},{"id":"numbered_list-mtgonsdo-337","type":"numbered_list","content":"Déclaration : L''hôte fournit la liste des outils (nom, description, paramètres JSON Schema)."},{"id":"numbered_list-mtgonsdo-338","type":"numbered_list","content":"Génération d''appel : Le LLM décide d''appeler un outil et renvoie tool_calls: [{ name, arguments }] au lieu d''une réponse textuelle finale."},{"id":"numbered_list-mtgonsdo-339","type":"numbered_list","content":"Exécution hôte : Le runtime (Node.js/Edge) exécute la fonction réelle (requête SQL Supabase, appel API, sandbox bash)."},{"id":"numbered_list-mtgonsdo-340","type":"numbered_list","content":"Injection du résultat : Le résultat est renvoyé au LLM dans un message de type tool_result."},{"id":"numbered_list-mtgonsdo-341","type":"numbered_list","content":"Synthèse ou nouvel appel : Le modèle interprète le résultat pour répondre à l''utilisateur ou lancer un autre outil."},{"id":"div-mtgonsdo-342","type":"divider","content":""},{"id":"heading_2-mtgonsdo-343","type":"heading_2","content":"4. Architectures Agentiques & Boucles Autonomes"},{"id":"paragraph-mtgonsdo-344","type":"paragraph","content":"Un agent est un LLM équipé de :"},{"id":"bullet_list-mtgonsdo-345","type":"bullet_list","content":"Mémoire (court terme via contexte, long terme via base de données/embeddings)"},{"id":"bullet_list-mtgonsdo-346","type":"bullet_list","content":"Outils (lecture/écriture de fichiers, exécution de scripts, appels API)"},{"id":"bullet_list-mtgonsdo-347","type":"bullet_list","content":"Boucle de contrôle (Planification, Réflexion, Arrêt conditionnel)"},{"id":"heading_3-mtgonsdo-348","type":"heading_3","content":"Le Pattern ReAct (Reason + Act)"},{"id":"paragraph-mtgonsdo-349","type":"paragraph","content":"L''agent alterne continuellement trois phases :"},{"id":"numbered_list-mtgonsdo-350","type":"numbered_list","content":"Thought (Pensée) : Décomposition du problème, analyse de l''état courant."},{"id":"numbered_list-mtgonsdo-351","type":"numbered_list","content":"Action (Action) : Sélection de l''outil et génération des paramètres d''appel."},{"id":"numbered_list-mtgonsdo-352","type":"numbered_list","content":"Observation (Observation) : Lecture de la sortie de l''outil et mise à jour de l''état."},{"id":"div-mtgonsdo-353","type":"divider","content":""},{"id":"heading_2-mtgonsdo-354","type":"heading_2","content":"5. Token Economics, Latency & Caching"},{"id":"heading_3-mtgonsdo-355","type":"heading_3","content":"Stratégies d''Optimisation :"},{"id":"numbered_list-mtgonsdo-356","type":"numbered_list","content":"Prompt Caching : Les préfixes de contexte statiques permettent d''économiser jusqu''à 90% du coût et 80% de la latence."},{"id":"numbered_list-mtgonsdo-357","type":"numbered_list","content":"Modèles Hybrides & Cascading :"},{"id":"bullet_list-mtgonsdo-358","type":"bullet_list","content":"Tâches simples (classification, extraction) → Petits modèles rapides (Gemini 2.0 Flash, Claude 3.5 Haiku)."},{"id":"bullet_list-mtgonsdo-359","type":"bullet_list","content":"Tâches complexes (architecture, refactorings profonds, audits d''affaires) → Grands modèles de raisonnement (Claude 3.7 Sonnet, Gemini 2.0 Pro)."},{"id":"numbered_list-mtgonsdo-360","type":"numbered_list","content":"Streaming : Toujours activer le streaming UI pour une latence perçue inférieure à 400ms."}]}'::jsonb,
  25,
  'Équipe Technique Minerva',
  true,
  true,
  false,
  108,
  'transversal',
  25
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-IA-01 : Fondations du AI Engineering Moderne & Systèmes Agentiques');

-- sop-ai-02-antigravity-expert
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-IA-02 : Guide Expert Antigravity IDE, Subagents & Écosystème',
  'Maîtrise d’Antigravity IDE 2.0 : Slash commands (/goal, /grill-me, /learn), orchestration de subagents, Planning Mode et Custom Skills.',
  'IA & Ingénierie',
  '# SOP-IA-02 : Guide Expert Antigravity IDE, Subagents & Écosystème

**Catégorie :** IA & Ingénierie  
**Public cible :** Développeurs Fullstack, Tech Leads Minerva  
**Temps de lecture :** 30 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Architecture Globale d''Antigravity IDE

**Google Antigravity (AGY)** est un environnement de développement agentique conçu pour la programmation en binôme humain-agent et l''exécution de tâches autonomes de grande envergure.

### Composants Majeurs :
1. **Primary Agent (Lead Agent)** : Responsable du dialogue avec le développeur, de la recherche, de la planification et de l''orchestration des tâches.
2. **Subagents Spécialisés** : Agents autonomes instanciés pour des tâches ciblées (exploration, tests, validation UI via `browser_subagent`).
3. **Knowledge Items (KI)** : Mémoire institutionnelle (`<appDataDir>\knowledge`) résumant les patterns éprouvés du repo.
4. **Customisations Root** : Système hiérarchique de règles (`AGENTS.md`, `rules/`), compétences (`skills/`) et plugins (`plugins/`).

---

## 2. Commandes Slash & Protocoles Avancés

### `/grill-me` (Alignement Architectural Préalable)
- **Objectif** : Conduire une interview interactive pointilleuse avant de toucher au code pour lever toute ambiguïté architecturale.
- **Protocole** : L''agent explore la codebase, pose les questions bloquantes une par une avec une option recommandée `(Recommended)` et génère le plan d''implémentation.

### `/goal` (Exécution Autonome Complète)
- **Objectif** : Lancer un agent en mode objectif jusqu''à résolution complète sans interruption prématurée.

### `/learn` (Persistance des Apprentissages)
- **Objectif** : Enregistrer une règle de comportement ou une solution à un bug complexe pour qu''elle devienne permanente.

---

## 3. Subagents & Browser Subagent

L''agent dispose d''une instance Chromium intégrée capable de naviguer sur `http://localhost:3000`, tester des formulaires, enregistrer des vidéos WebP et capturer les erreurs de console.

---

## 4. Planning Mode & Cycle de Livraison

Le Planning Mode impose un cadre strict pour toutes les tâches complexes :
1. **Recherche & Exploration** (interdiction de modifier les sources).
2. **Rédaction de `implementation_plan.md`**.
3. **Validation Humaine Explicite**.
4. **Exécution Atomique & Vérification**.
5. **Rédaction de `walkthrough.md`**.',
  '{"blocks":[{"id":"heading_1-mtgonsdo-361","type":"heading_1","content":"SOP-IA-02 : Guide Expert Antigravity IDE, Subagents & Écosystème"},{"id":"paragraph-mtgonsdp-362","type":"paragraph","content":"Catégorie : IA & Ingénierie"},{"id":"paragraph-mtgonsdp-363","type":"paragraph","content":"Public cible : Développeurs Fullstack, Tech Leads Minerva"},{"id":"paragraph-mtgonsdp-364","type":"paragraph","content":"Temps de lecture : 30 minutes"},{"id":"paragraph-mtgonsdp-365","type":"paragraph","content":"Auteur : Équipe Technique Minerva"},{"id":"div-mtgonsdp-366","type":"divider","content":""},{"id":"heading_2-mtgonsdp-367","type":"heading_2","content":"1. Architecture Globale d''Antigravity IDE"},{"id":"paragraph-mtgonsdp-368","type":"paragraph","content":"Google Antigravity (AGY) est un environnement de développement agentique conçu pour la programmation en binôme humain-agent et l''exécution de tâches autonomes de grande envergure."},{"id":"heading_3-mtgonsdp-369","type":"heading_3","content":"Composants Majeurs :"},{"id":"numbered_list-mtgonsdp-370","type":"numbered_list","content":"Primary Agent (Lead Agent) : Responsable du dialogue avec le développeur, de la recherche, de la planification et de l''orchestration des tâches."},{"id":"numbered_list-mtgonsdp-371","type":"numbered_list","content":"Subagents Spécialisés : Agents autonomes instanciés pour des tâches ciblées (exploration, tests, validation UI via browser_subagent)."},{"id":"numbered_list-mtgonsdp-372","type":"numbered_list","content":"Knowledge Items (KI) : Mémoire institutionnelle (<appDataDir>\\knowledge) résumant les patterns éprouvés du repo."},{"id":"numbered_list-mtgonsdp-373","type":"numbered_list","content":"Customisations Root : Système hiérarchique de règles (AGENTS.md, rules/), compétences (skills/) et plugins (plugins/)."},{"id":"div-mtgonsdp-374","type":"divider","content":""},{"id":"heading_2-mtgonsdp-375","type":"heading_2","content":"2. Commandes Slash & Protocoles Avancés"},{"id":"heading_3-mtgonsdp-376","type":"heading_3","content":"/grill-me (Alignement Architectural Préalable)"},{"id":"bullet_list-mtgonsdp-377","type":"bullet_list","content":"Objectif : Conduire une interview interactive pointilleuse avant de toucher au code pour lever toute ambiguïté architecturale."},{"id":"bullet_list-mtgonsdp-378","type":"bullet_list","content":"Protocole : L''agent explore la codebase, pose les questions bloquantes une par une avec une option recommandée (Recommended) et génère le plan d''implémentation."},{"id":"heading_3-mtgonsdp-379","type":"heading_3","content":"/goal (Exécution Autonome Complète)"},{"id":"bullet_list-mtgonsdp-380","type":"bullet_list","content":"Objectif : Lancer un agent en mode objectif jusqu''à résolution complète sans interruption prématurée."},{"id":"heading_3-mtgonsdp-381","type":"heading_3","content":"/learn (Persistance des Apprentissages)"},{"id":"bullet_list-mtgonsdp-382","type":"bullet_list","content":"Objectif : Enregistrer une règle de comportement ou une solution à un bug complexe pour qu''elle devienne permanente."},{"id":"div-mtgonsdp-383","type":"divider","content":""},{"id":"heading_2-mtgonsdp-384","type":"heading_2","content":"3. Subagents & Browser Subagent"},{"id":"paragraph-mtgonsdp-385","type":"paragraph","content":"L''agent dispose d''une instance Chromium intégrée capable de naviguer sur http://localhost:3000, tester des formulaires, enregistrer des vidéos WebP et capturer les erreurs de console."},{"id":"div-mtgonsdp-386","type":"divider","content":""},{"id":"heading_2-mtgonsdp-387","type":"heading_2","content":"4. Planning Mode & Cycle de Livraison"},{"id":"paragraph-mtgonsdp-388","type":"paragraph","content":"Le Planning Mode impose un cadre strict pour toutes les tâches complexes :"},{"id":"numbered_list-mtgonsdp-389","type":"numbered_list","content":"Recherche & Exploration (interdiction de modifier les sources)."},{"id":"numbered_list-mtgonsdp-390","type":"numbered_list","content":"Rédaction de implementation_plan.md."},{"id":"numbered_list-mtgonsdp-391","type":"numbered_list","content":"Validation Humaine Explicite."},{"id":"numbered_list-mtgonsdp-392","type":"numbered_list","content":"Exécution Atomique & Vérification."},{"id":"numbered_list-mtgonsdp-393","type":"numbered_list","content":"Rédaction de walkthrough.md."}]}'::jsonb,
  30,
  'Équipe Technique Minerva',
  true,
  true,
  false,
  109,
  'transversal',
  30
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-IA-02 : Guide Expert Antigravity IDE, Subagents & Écosystème');

-- sop-ai-03-claude-code-expert
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-IA-03 : Guide Expert Claude Code & Terminal Agentique',
  'Utilisation avancée du CLI Claude Code : gestion du contexte (/compact, /cost), configuration CLAUDE.md, refactorings multi-fichiers et git workflows.',
  'IA & Ingénierie',
  '# SOP-IA-03 : Guide Expert Claude Code & Terminal Agentique

**Catégorie :** IA & Ingénierie  
**Public cible :** Développeurs Fullstack, DevOps, Ingénieurs IA  
**Temps de lecture :** 25 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Introduction à Claude Code

**Claude Code** est l''agent de programmation en ligne de commande (CLI) développé par Anthropic. Il s''exécute directement dans le terminal, accède à Git, modifie les fichiers, exécute des commandes shell et interagit avec des serveurs MCP.

```bash
# Installation globale
npm install -g @anthropic-ai/claude-code

# Authentification et lancement
claude
```

---

## 2. Commandes & Flags Clés

| Commande / Flag | Rôle & Comportement |
| :--- | :--- |
| `claude` | Ouvre une session interactive de chat |
| `claude -p "prompt"` | Mode **Headless** (one-shot) pour scripts et CI |
| `claude --dangerously-skip-permissions` | Désactive les demandes de confirmation pour shell et fichiers |
| `claude --verbose` | Affiche le détail des requêtes et tokens |

---

## 3. Gestion du Contexte & Commandes Internes

- **`/compact`** : Résume l''historique de la session pour libérer des tokens tout en conservant les acquis architecturaux.
- **`/cost`** : Affiche la consommation exacte en tokens et en dollars.
- **`/clear`** : Réinitialise l''historique sans quitter le CLI.

---

## 4. Architecture de Mémoire `CLAUDE.md`

Le fichier `CLAUDE.md` à la racine du dépôt définit les contraintes et règles permanentes :
- Stack technique (Next.js 16, Supabase, Tailwind).
- Règle stricte *Real Data Only*.
- Commandes de validation (`npx tsc --noEmit`, `npx playwright test`).',
  '{"blocks":[{"id":"heading_1-mtgonsdp-394","type":"heading_1","content":"SOP-IA-03 : Guide Expert Claude Code & Terminal Agentique"},{"id":"paragraph-mtgonsdp-395","type":"paragraph","content":"Catégorie : IA & Ingénierie"},{"id":"paragraph-mtgonsdp-396","type":"paragraph","content":"Public cible : Développeurs Fullstack, DevOps, Ingénieurs IA"},{"id":"paragraph-mtgonsdp-397","type":"paragraph","content":"Temps de lecture : 25 minutes"},{"id":"paragraph-mtgonsdp-398","type":"paragraph","content":"Auteur : Équipe Technique Minerva"},{"id":"div-mtgonsdp-399","type":"divider","content":""},{"id":"heading_2-mtgonsdp-400","type":"heading_2","content":"1. Introduction à Claude Code"},{"id":"paragraph-mtgonsdp-401","type":"paragraph","content":"Claude Code est l''agent de programmation en ligne de commande (CLI) développé par Anthropic. Il s''exécute directement dans le terminal, accède à Git, modifie les fichiers, exécute des commandes shell et interagit avec des serveurs MCP."},{"id":"code-mtgonsdp-402","type":"code_block","content":"# Installation globale\nnpm install -g @anthropic-ai/claude-code\n\n# Authentification et lancement\nclaude","codeLanguage":"bash"},{"id":"div-mtgonsdp-403","type":"divider","content":""},{"id":"heading_2-mtgonsdp-404","type":"heading_2","content":"2. Commandes & Flags Clés"},{"id":"table-mtgonsdp-405","type":"table","content":"","tableData":[["Commande / Flag","Rôle & Comportement"],["claude","Ouvre une session interactive de chat"],["claude -p \"prompt\"","Mode Headless (one-shot) pour scripts et CI"],["claude --dangerously-skip-permissions","Désactive les demandes de confirmation pour shell et fichiers"],["claude --verbose","Affiche le détail des requêtes et tokens"]]},{"id":"div-mtgonsdp-406","type":"divider","content":""},{"id":"heading_2-mtgonsdp-407","type":"heading_2","content":"3. Gestion du Contexte & Commandes Internes"},{"id":"bullet_list-mtgonsdp-408","type":"bullet_list","content":"/compact : Résume l''historique de la session pour libérer des tokens tout en conservant les acquis architecturaux."},{"id":"bullet_list-mtgonsdp-409","type":"bullet_list","content":"/cost : Affiche la consommation exacte en tokens et en dollars."},{"id":"bullet_list-mtgonsdp-410","type":"bullet_list","content":"/clear : Réinitialise l''historique sans quitter le CLI."},{"id":"div-mtgonsdp-411","type":"divider","content":""},{"id":"heading_2-mtgonsdp-412","type":"heading_2","content":"4. Architecture de Mémoire CLAUDE.md"},{"id":"paragraph-mtgonsdp-413","type":"paragraph","content":"Le fichier CLAUDE.md à la racine du dépôt définit les contraintes et règles permanentes :"},{"id":"bullet_list-mtgonsdp-414","type":"bullet_list","content":"Stack technique (Next.js 16, Supabase, Tailwind)."},{"id":"bullet_list-mtgonsdp-415","type":"bullet_list","content":"Règle stricte Real Data Only."},{"id":"bullet_list-mtgonsdp-416","type":"bullet_list","content":"Commandes de validation (npx tsc --noEmit, npx playwright test)."}]}'::jsonb,
  25,
  'Équipe Technique Minerva',
  true,
  true,
  false,
  110,
  'transversal',
  25
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-IA-03 : Guide Expert Claude Code & Terminal Agentique');

-- sop-ai-04-minerva-mcp-server
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-IA-04 : Minerva MCP Server & Tool Augmentation',
  'Architecture Model Context Protocol v2 : Endpoint Next.js /api/mcp, Bearer auth sécurisée, requêtes Supabase réelles et création de nouveaux outils MCP.',
  'IA & Ingénierie',
  '# SOP-IA-04 : Minerva MCP Server & Tool Augmentation

**Catégorie :** IA & Ingénierie  
**Public cible :** Développeurs Backend & Fullstack, Architectes IA  
**Temps de lecture :** 20 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Fondations du Model Context Protocol (MCP v2)

Le standard ouvert MCP permet d''exposer des données et des outils à des agents IA via JSON-RPC 2.0.

> [!IMPORTANT]
> Minerva implémente **MCP v2** via `@modelcontextprotocol/server` et `mcp-handler` sur la route `app/api/mcp/route.ts`.

---

## 2. Architecture & Sécurité

- **Vérification de Token à Temps Constant** : Comparaison cryptographique sécurisée via `timingSafeEqual` contre `MCP_SERVER_TOKEN` et `MCP_HERMES_TOKEN`.
- **Rate-Limiting** : 60 req/min par IP via `lib/rate-limit.ts`.
- **Audit Logs** : Chaque appel d''outil consigne un log dans la table `audit_logs`.

---

## 3. Outils Disponibles

**Outils de lecture (chantier initial, 2026-08-21) :**
- `minerva_get_leads` : Prospects CRM réels.
- `minerva_get_kpi` : MRR total, pipeline total et nombre de clients actifs (volontairement sans ROAS/CPL — pas de table de tracking publicitaire réelle, jamais de chiffre inventé).
- `minerva_list_sops` : Liste des SOPs de l''Académie.
- `minerva_get_clients` : Liste des clients et statuts.
- `minerva_get_projects` : Projets et avancements en cours.

**Outils Plane ajoutés au chantier d''intégration (2026-08-27) :**
- `minerva_plane_list_issues` : Tickets Plane filtrés par état/priorité.
- `minerva_plane_create_issue` : Création d''un ticket Plane depuis un agent IA.
- `minerva_plane_update_issue` : Mise à jour d''un ticket existant.
- `minerva_plane_list_cycles` : Sprints/cycles actifs.
- `minerva_plane_sync_task` : Synchronise une tâche Minerva ↔ un ticket Plane.

---

## 4. Configuration d''un Client MCP

Dans votre `.mcp.json` :
```json
{
  "mcpServers": {
    "minerva-trequartista": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote-client",
        "https://trequartista.minerva-agency.ca/api/mcp",
        "--header",
        "Authorization: Bearer VOTRE_MCP_SERVER_TOKEN"
      ]
    }
  }
}
```',
  '{"blocks":[{"id":"heading_1-mtgonsdp-417","type":"heading_1","content":"SOP-IA-04 : Minerva MCP Server & Tool Augmentation"},{"id":"paragraph-mtgonsdp-418","type":"paragraph","content":"Catégorie : IA & Ingénierie"},{"id":"paragraph-mtgonsdp-419","type":"paragraph","content":"Public cible : Développeurs Backend & Fullstack, Architectes IA"},{"id":"paragraph-mtgonsdp-420","type":"paragraph","content":"Temps de lecture : 20 minutes"},{"id":"paragraph-mtgonsdp-421","type":"paragraph","content":"Auteur : Équipe Technique Minerva"},{"id":"div-mtgonsdp-422","type":"divider","content":""},{"id":"heading_2-mtgonsdp-423","type":"heading_2","content":"1. Fondations du Model Context Protocol (MCP v2)"},{"id":"paragraph-mtgonsdp-424","type":"paragraph","content":"Le standard ouvert MCP permet d''exposer des données et des outils à des agents IA via JSON-RPC 2.0."},{"id":"quote-mtgonsdp-425","type":"quote","content":"[!IMPORTANT]"},{"id":"quote-mtgonsdp-426","type":"quote","content":"Minerva implémente MCP v2 via @modelcontextprotocol/server et mcp-handler sur la route app/api/mcp/route.ts."},{"id":"div-mtgonsdp-427","type":"divider","content":""},{"id":"heading_2-mtgonsdp-428","type":"heading_2","content":"2. Architecture & Sécurité"},{"id":"bullet_list-mtgonsdp-429","type":"bullet_list","content":"Vérification de Token à Temps Constant : Comparaison cryptographique sécurisée via timingSafeEqual contre MCP_SERVER_TOKEN et MCP_HERMES_TOKEN."},{"id":"bullet_list-mtgonsdp-430","type":"bullet_list","content":"Rate-Limiting : 60 req/min par IP via lib/rate-limit.ts."},{"id":"bullet_list-mtgonsdp-431","type":"bullet_list","content":"Audit Logs : Chaque appel d''outil consigne un log dans la table audit_logs."},{"id":"div-mtgonsdp-432","type":"divider","content":""},{"id":"heading_2-mtgonsdp-433","type":"heading_2","content":"3. Outils Disponibles"},{"id":"paragraph-mtgonsdp-434","type":"paragraph","content":"Outils de lecture (chantier initial, 2026-08-21) :"},{"id":"bullet_list-mtgonsdp-435","type":"bullet_list","content":"minerva_get_leads : Prospects CRM réels."},{"id":"bullet_list-mtgonsdp-436","type":"bullet_list","content":"minerva_get_kpi : MRR total, pipeline total et nombre de clients actifs (volontairement sans ROAS/CPL — pas de table de tracking publicitaire réelle, jamais de chiffre inventé)."},{"id":"bullet_list-mtgonsdp-437","type":"bullet_list","content":"minerva_list_sops : Liste des SOPs de l''Académie."},{"id":"bullet_list-mtgonsdp-438","type":"bullet_list","content":"minerva_get_clients : Liste des clients et statuts."},{"id":"bullet_list-mtgonsdp-439","type":"bullet_list","content":"minerva_get_projects : Projets et avancements en cours."},{"id":"paragraph-mtgonsdp-440","type":"paragraph","content":"Outils Plane ajoutés au chantier d''intégration (2026-08-27) :"},{"id":"bullet_list-mtgonsdp-441","type":"bullet_list","content":"minerva_plane_list_issues : Tickets Plane filtrés par état/priorité."},{"id":"bullet_list-mtgonsdp-442","type":"bullet_list","content":"minerva_plane_create_issue : Création d''un ticket Plane depuis un agent IA."},{"id":"bullet_list-mtgonsdp-443","type":"bullet_list","content":"minerva_plane_update_issue : Mise à jour d''un ticket existant."},{"id":"bullet_list-mtgonsdp-444","type":"bullet_list","content":"minerva_plane_list_cycles : Sprints/cycles actifs."},{"id":"bullet_list-mtgonsdp-445","type":"bullet_list","content":"minerva_plane_sync_task : Synchronise une tâche Minerva ↔ un ticket Plane."},{"id":"div-mtgonsdp-446","type":"divider","content":""},{"id":"heading_2-mtgonsdp-447","type":"heading_2","content":"4. Configuration d''un Client MCP"},{"id":"paragraph-mtgonsdp-448","type":"paragraph","content":"Dans votre .mcp.json :"},{"id":"code-mtgonsdp-449","type":"code_block","content":"{\n  \"mcpServers\": {\n    \"minerva-trequartista\": {\n      \"command\": \"npx\",\n      \"args\": [\n        \"-y\",\n        \"mcp-remote-client\",\n        \"https://trequartista.minerva-agency.ca/api/mcp\",\n        \"--header\",\n        \"Authorization: Bearer VOTRE_MCP_SERVER_TOKEN\"\n      ]\n    }\n  }\n}","codeLanguage":"json"}]}'::jsonb,
  20,
  'Équipe Technique Minerva',
  true,
  true,
  false,
  111,
  'transversal',
  20
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-IA-04 : Minerva MCP Server & Tool Augmentation');

-- sop-ai-05-workflow-dev-ai-first
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-IA-05 : Workflow de Développement "AI-First" chez Minerva',
  'Méthodologie officielle de développement : Cycle Spec-to-Code en 5 étapes, politique Real Data Only, migrations Supabase sécurisées et tests Playwright.',
  'IA & Ingénierie',
  '# SOP-IA-05 : Workflow de Développement "AI-First" chez Minerva

**Catégorie :** IA & Ingénierie  
**Public cible :** Toute l''équipe technique Minerva  
**Temps de lecture :** 25 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Le Manifeste AI-First

L''ingénieur agit comme un **Tech Lead et Architecte Système** supervisant des agents IA pour concevoir, implémenter et tester le code à grande vitesse et haute fiabilité.

---

## 2. Le Cycle Spec-to-Code en 5 Étapes

1. **Spécification & /grill-me** : Exploration de l''existant et clarification des contraintes.
2. **Plan Architectural** : Validation obligatoire du `implementation_plan.md`.
3. **Implémentation Atomique** : Types TypeScript -> Services -> Composants -> Pages.
4. **Tests & Visual QA** : Exécution de `npx tsc --noEmit` et tests E2E Playwright.
5. **Walkthrough & Déploiement** : Synthèse dans `walkthrough.md` et PR propre.

---

## 3. Règle d''Or : Real Data Only

- Aucun mock ou fausse statistique en base.
- Dégradation gracieuse propre en cas de clé d''API tierce manquante.
- Migrations Supabase idempotentes et horodatées (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN IF NOT EXISTS`).',
  '{"blocks":[{"id":"heading_1-mtgonsdp-450","type":"heading_1","content":"SOP-IA-05 : Workflow de Développement \"AI-First\" chez Minerva"},{"id":"paragraph-mtgonsdp-451","type":"paragraph","content":"Catégorie : IA & Ingénierie"},{"id":"paragraph-mtgonsdp-452","type":"paragraph","content":"Public cible : Toute l''équipe technique Minerva"},{"id":"paragraph-mtgonsdp-453","type":"paragraph","content":"Temps de lecture : 25 minutes"},{"id":"paragraph-mtgonsdp-454","type":"paragraph","content":"Auteur : Équipe Technique Minerva"},{"id":"div-mtgonsdp-455","type":"divider","content":""},{"id":"heading_2-mtgonsdp-456","type":"heading_2","content":"1. Le Manifeste AI-First"},{"id":"paragraph-mtgonsdp-457","type":"paragraph","content":"L''ingénieur agit comme un Tech Lead et Architecte Système supervisant des agents IA pour concevoir, implémenter et tester le code à grande vitesse et haute fiabilité."},{"id":"div-mtgonsdp-458","type":"divider","content":""},{"id":"heading_2-mtgonsdp-459","type":"heading_2","content":"2. Le Cycle Spec-to-Code en 5 Étapes"},{"id":"numbered_list-mtgonsdp-460","type":"numbered_list","content":"Spécification & /grill-me : Exploration de l''existant et clarification des contraintes."},{"id":"numbered_list-mtgonsdp-461","type":"numbered_list","content":"Plan Architectural : Validation obligatoire du implementation_plan.md."},{"id":"numbered_list-mtgonsdp-462","type":"numbered_list","content":"Implémentation Atomique : Types TypeScript -> Services -> Composants -> Pages."},{"id":"numbered_list-mtgonsdp-463","type":"numbered_list","content":"Tests & Visual QA : Exécution de npx tsc --noEmit et tests E2E Playwright."},{"id":"numbered_list-mtgonsdp-464","type":"numbered_list","content":"Walkthrough & Déploiement : Synthèse dans walkthrough.md et PR propre."},{"id":"div-mtgonsdp-465","type":"divider","content":""},{"id":"heading_2-mtgonsdp-466","type":"heading_2","content":"3. Règle d''Or : Real Data Only"},{"id":"bullet_list-mtgonsdp-467","type":"bullet_list","content":"Aucun mock ou fausse statistique en base."},{"id":"bullet_list-mtgonsdp-468","type":"bullet_list","content":"Dégradation gracieuse propre en cas de clé d''API tierce manquante."},{"id":"bullet_list-mtgonsdp-469","type":"bullet_list","content":"Migrations Supabase idempotentes et horodatées (CREATE TABLE IF NOT EXISTS, ALTER TABLE ADD COLUMN IF NOT EXISTS)."}]}'::jsonb,
  25,
  'Équipe Technique Minerva',
  true,
  true,
  false,
  112,
  'transversal',
  25
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-IA-05 : Workflow de Développement "AI-First" chez Minerva');

-- sop-ai-06-rag-vector-search
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-IA-06 : RAG Avancé, Vector Search & Stratégies Hybrides',
  'Vector Search avec pgvector sous Supabase, chunking sémantique, recherche hybride FTS + dense avec Reciprocal Rank Fusion et évaluation RAGAS.',
  'IA & Ingénierie',
  '# SOP-IA-06 : RAG Avancé, Vector Search & Stratégies Hybrides

**Catégorie :** IA & Ingénierie  
**Public cible :** Ingénieurs IA, Développeurs Backend, Architectes Data  
**Temps de lecture :** 25 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Arbre de Décision IA

- **In-Context** : Contexte court (< 100k tokens), données ponctuelles.
- **RAG (pgvector)** : Base de connaissances vivante, documents volumineux, faible hallucination.
- **Fine-Tuning** : Fixation de style et de syntaxe très spécialisée.

---

## 2. pgvector sous Supabase

```sql
-- Activer l''extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table vectorielle
CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    content_chunk TEXT NOT NULL,
    metadata JSONB DEFAULT ''{}''::jsonb,
    embedding vector(1536)
);

-- Index HNSW
CREATE INDEX IF NOT EXISTS document_embeddings_hnsw_idx 
ON public.document_embeddings 
USING hnsw (embedding vector_cosine_ops);
```

---

## 3. Recherche Hybride & Reranking

Combinaison de la recherche plein texte (PostgreSQL FTS) et de la recherche vectorielle cosinus via **Reciprocal Rank Fusion (RRF)** pour capturer à la fois la sémantique et les mots-clés exacts.',
  '{"blocks":[{"id":"heading_1-mtgonsdp-470","type":"heading_1","content":"SOP-IA-06 : RAG Avancé, Vector Search & Stratégies Hybrides"},{"id":"paragraph-mtgonsdp-471","type":"paragraph","content":"Catégorie : IA & Ingénierie"},{"id":"paragraph-mtgonsdp-472","type":"paragraph","content":"Public cible : Ingénieurs IA, Développeurs Backend, Architectes Data"},{"id":"paragraph-mtgonsdp-473","type":"paragraph","content":"Temps de lecture : 25 minutes"},{"id":"paragraph-mtgonsdp-474","type":"paragraph","content":"Auteur : Équipe Technique Minerva"},{"id":"div-mtgonsdp-475","type":"divider","content":""},{"id":"heading_2-mtgonsdp-476","type":"heading_2","content":"1. Arbre de Décision IA"},{"id":"bullet_list-mtgonsdp-477","type":"bullet_list","content":"In-Context : Contexte court (< 100k tokens), données ponctuelles."},{"id":"bullet_list-mtgonsdp-478","type":"bullet_list","content":"RAG (pgvector) : Base de connaissances vivante, documents volumineux, faible hallucination."},{"id":"bullet_list-mtgonsdp-479","type":"bullet_list","content":"Fine-Tuning : Fixation de style et de syntaxe très spécialisée."},{"id":"div-mtgonsdp-480","type":"divider","content":""},{"id":"heading_2-mtgonsdp-481","type":"heading_2","content":"2. pgvector sous Supabase"},{"id":"code-mtgonsdp-482","type":"code_block","content":"-- Activer l''extension\nCREATE EXTENSION IF NOT EXISTS vector;\n\n-- Table vectorielle\nCREATE TABLE IF NOT EXISTS public.document_embeddings (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,\n    content_chunk TEXT NOT NULL,\n    metadata JSONB DEFAULT ''{}''::jsonb,\n    embedding vector(1536)\n);\n\n-- Index HNSW\nCREATE INDEX IF NOT EXISTS document_embeddings_hnsw_idx \nON public.document_embeddings \nUSING hnsw (embedding vector_cosine_ops);","codeLanguage":"sql"},{"id":"div-mtgonsdp-483","type":"divider","content":""},{"id":"heading_2-mtgonsdp-484","type":"heading_2","content":"3. Recherche Hybride & Reranking"},{"id":"paragraph-mtgonsdp-485","type":"paragraph","content":"Combinaison de la recherche plein texte (PostgreSQL FTS) et de la recherche vectorielle cosinus via Reciprocal Rank Fusion (RRF) pour capturer à la fois la sémantique et les mots-clés exacts."}]}'::jsonb,
  25,
  'Équipe Technique Minerva',
  true,
  true,
  false,
  113,
  'transversal',
  25
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-IA-06 : RAG Avancé, Vector Search & Stratégies Hybrides');

-- sop-ops-01-onboarding-30min
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-OPS-01 : Onboarding 30 Minutes Chrono pour Nouveau Membre',
  'Comprendre l’agence, ton rôle et les outils en 30 minutes chrono. Tout pour devenir autonome dès le jour 1.',
  'Onboarding',
  '# SOP-OPS-01 : Onboarding 30 Minutes Chrono pour Nouveau Membre

**Catégorie :** Onboarding  
**Public cible :** Toute nouvelle recrue (Prospecteur, Account Manager, Créateur de contenu, Support & QA)  
**Temps de lecture :** 15 minutes  
**Auteur :** Direction Minerva  

---

## 🎯 Objectif de l''Onboarding

Comprendre l''agence, ton rôle et les outils en **30 minutes chrono**. Tout est structuré pour que tu sois autonome immédiatement, sans supervision constante.

---

## 🧭 Min 0–5 : L''Agence en Bref

- **Qui on est :** Minerva est une agence-studio hybride basée à Montréal. On combine design, automatisation IA et solutions logicielles sur mesure pour les entrepreneurs et les restaurants.
- **Notre écosystème :**
  - **Minerva (Agence)** : Design, stratégie, sites web Framer, intégration de systèmes.
  - **Minerva OS** : Noyau technique propriétaire — automatisation et dashboards IA.
  - **Minerva Reach** : Solution logicielle de prospection automatisée pour le Québec.
  - **Minerva Flow** : Cockpit de gestion pour restaurants et cafés.
- **Notre modèle :** **100% commission**. Pas de salaire fixe. Chacun gagne selon son travail réel. Plus tu performes, plus tu gagnes.
- **La vision du fondateur :** Minerva (le fondateur) se concentre sur la programmation et la stratégie (la tête qui réfléchit). L''équipe exécute.

---

## 🎯 Min 5–15 : Ton Rôle & Attentes

### Les Rôles Disponibles :
| Rôle | Mission Principale | Rémunération |
| :--- | :--- | :--- |
| 📡 **Prospecteur** | Identifier et contacter des prospects qualifiés, booker des meetings de démo | **30% du deal fermé** (ex: deal à 3 000 $ → 900 $) |
| 🧑‍💼 **Account Manager** | Gérer la relation client après signature, onboarding, suivi, rétention et upsells | **15% du MRR client** (ex: 3 clients à 250 $ MRR → 112 $/mois) |
| 💻 **Lead Développeur Full-Stack** | Architecture technique, livraison des prototypes J+7, intégrations Next.js & Supabase | Forfait par sprint / **25-30% du projet build** |
| 🤖 **Ingénieur IA & Automatisation** | Conception des pipelines Reach, webhooks, connecteurs MCP et agents vocaux | Forfait par automatisation ou flux IA |
| 🎨 **Architecte Web & Expert Framer** | Conception UI/UX, intégrations Framer ultrarapides, animations & charte graphique | Forfait par projet web / vitrine |
| 🎬 **Créateur de contenu** | Produire des vidéos (Reels/TikToks/Shorts), posts et visuels | Forfait par projet (défini avant démarrage) |
| 🛠️ **Support & QA** | Répondre aux tickets, tester les 20 points de conformité QC, documenter les bugs | Forfait par tâche / ticket |

---

## 🛠️ Min 15–25 : Les Outils et l''Application

### Les Outils Clés :
- **Minerva (Cette Application)** : Le cockpit central de l''agence (CRM, Tâches, Réels, Académie, Facturation).
- **Minerva Reach** : Application de prospection (recherche Google Maps, emails, pipeline).
- **Minerva Flow** : Le cockpit vendu aux restaurateurs (opérations, inventaire, employés, revenus).
- **Framer** : Plateforme de design et déploiement de sites web ultra-rapides.

### Priorités des Tâches :
- **P0** : Urgent, à traiter aujourd''hui (dans les 2h pour le support).
- **P1** : Important, à traiter cette semaine.
- **P2** : Amélioration continue, quand le temps le permet.

---

## ✅ Min 25–30 : Ta Première Mission

- [ ] Lire cette page d''onboarding au complet.
- [ ] Explorer les sections clés de l''app : Tâches (`/tasks`), CRM (`/leads`), Réseau (`/contacts`) et Académie (`/academy`).
- [ ] Comprendre le système de priorités P0/P1/P2.
- [ ] Identifier 1 tâche que tu peux accomplir cette semaine.
- [ ] Planifier un check-in de 15 minutes avec le fondateur pour valider le démarrage.',
  '{"blocks":[{"id":"heading_1-mtgonsdp-486","type":"heading_1","content":"SOP-OPS-01 : Onboarding 30 Minutes Chrono pour Nouveau Membre"},{"id":"paragraph-mtgonsdp-487","type":"paragraph","content":"Catégorie : Onboarding"},{"id":"paragraph-mtgonsdp-488","type":"paragraph","content":"Public cible : Toute nouvelle recrue (Prospecteur, Account Manager, Créateur de contenu, Support & QA)"},{"id":"paragraph-mtgonsdp-489","type":"paragraph","content":"Temps de lecture : 15 minutes"},{"id":"paragraph-mtgonsdp-490","type":"paragraph","content":"Auteur : Direction Minerva"},{"id":"div-mtgonsdp-491","type":"divider","content":""},{"id":"heading_2-mtgonsdp-492","type":"heading_2","content":"🎯 Objectif de l''Onboarding"},{"id":"paragraph-mtgonsdp-493","type":"paragraph","content":"Comprendre l''agence, ton rôle et les outils en 30 minutes chrono. Tout est structuré pour que tu sois autonome immédiatement, sans supervision constante."},{"id":"div-mtgonsdp-494","type":"divider","content":""},{"id":"heading_2-mtgonsdp-495","type":"heading_2","content":"🧭 Min 0–5 : L''Agence en Bref"},{"id":"bullet_list-mtgonsdp-496","type":"bullet_list","content":"Qui on est : Minerva est une agence-studio hybride basée à Montréal. On combine design, automatisation IA et solutions logicielles sur mesure pour les entrepreneurs et les restaurants."},{"id":"bullet_list-mtgonsdp-497","type":"bullet_list","content":"Notre écosystème :"},{"id":"bullet_list-mtgonsdp-498","type":"bullet_list","content":"Minerva (Agence) : Design, stratégie, sites web Framer, intégration de systèmes."},{"id":"bullet_list-mtgonsdp-499","type":"bullet_list","content":"Minerva OS : Noyau technique propriétaire — automatisation et dashboards IA."},{"id":"bullet_list-mtgonsdp-500","type":"bullet_list","content":"Minerva Reach : Solution logicielle de prospection automatisée pour le Québec."},{"id":"bullet_list-mtgonsdp-501","type":"bullet_list","content":"Minerva Flow : Cockpit de gestion pour restaurants et cafés."},{"id":"bullet_list-mtgonsdp-502","type":"bullet_list","content":"Notre modèle : 100% commission. Pas de salaire fixe. Chacun gagne selon son travail réel. Plus tu performes, plus tu gagnes."},{"id":"bullet_list-mtgonsdp-503","type":"bullet_list","content":"La vision du fondateur : Minerva (le fondateur) se concentre sur la programmation et la stratégie (la tête qui réfléchit). L''équipe exécute."},{"id":"div-mtgonsdp-504","type":"divider","content":""},{"id":"heading_2-mtgonsdp-505","type":"heading_2","content":"🎯 Min 5–15 : Ton Rôle & Attentes"},{"id":"heading_3-mtgonsdp-506","type":"heading_3","content":"Les Rôles Disponibles :"},{"id":"table-mtgonsdp-507","type":"table","content":"","tableData":[["Rôle","Mission Principale","Rémunération"],["📡 Prospecteur","Identifier et contacter des prospects qualifiés, booker des meetings de démo","30% du deal fermé (ex: deal à 3 000 $ → 900 $)"],["🧑‍💼 Account Manager","Gérer la relation client après signature, onboarding, suivi, rétention et upsells","15% du MRR client (ex: 3 clients à 250 $ MRR → 112 $/mois)"],["💻 Lead Développeur Full-Stack","Architecture technique, livraison des prototypes J+7, intégrations Next.js & Supabase","Forfait par sprint / 25-30% du projet build"],["🤖 Ingénieur IA & Automatisation","Conception des pipelines Reach, webhooks, connecteurs MCP et agents vocaux","Forfait par automatisation ou flux IA"],["🎨 Architecte Web & Expert Framer","Conception UI/UX, intégrations Framer ultrarapides, animations & charte graphique","Forfait par projet web / vitrine"],["🎬 Créateur de contenu","Produire des vidéos (Reels/TikToks/Shorts), posts et visuels","Forfait par projet (défini avant démarrage)"],["🛠️ Support & QA","Répondre aux tickets, tester les 20 points de conformité QC, documenter les bugs","Forfait par tâche / ticket"]]},{"id":"div-mtgonsdp-508","type":"divider","content":""},{"id":"heading_2-mtgonsdp-509","type":"heading_2","content":"🛠️ Min 15–25 : Les Outils et l''Application"},{"id":"heading_3-mtgonsdp-510","type":"heading_3","content":"Les Outils Clés :"},{"id":"bullet_list-mtgonsdp-511","type":"bullet_list","content":"Minerva (Cette Application) : Le cockpit central de l''agence (CRM, Tâches, Réels, Académie, Facturation)."},{"id":"bullet_list-mtgonsdp-512","type":"bullet_list","content":"Minerva Reach : Application de prospection (recherche Google Maps, emails, pipeline)."},{"id":"bullet_list-mtgonsdp-513","type":"bullet_list","content":"Minerva Flow : Le cockpit vendu aux restaurateurs (opérations, inventaire, employés, revenus)."},{"id":"bullet_list-mtgonsdp-514","type":"bullet_list","content":"Framer : Plateforme de design et déploiement de sites web ultra-rapides."},{"id":"heading_3-mtgonsdp-515","type":"heading_3","content":"Priorités des Tâches :"},{"id":"bullet_list-mtgonsdp-516","type":"bullet_list","content":"P0 : Urgent, à traiter aujourd''hui (dans les 2h pour le support)."},{"id":"bullet_list-mtgonsdp-517","type":"bullet_list","content":"P1 : Important, à traiter cette semaine."},{"id":"bullet_list-mtgonsdp-518","type":"bullet_list","content":"P2 : Amélioration continue, quand le temps le permet."},{"id":"div-mtgonsdp-519","type":"divider","content":""},{"id":"heading_2-mtgonsdp-520","type":"heading_2","content":"✅ Min 25–30 : Ta Première Mission"},{"id":"todo_list-mtgonsdp-521","type":"todo_list","content":"Lire cette page d''onboarding au complet.","checked":false},{"id":"todo_list-mtgonsdp-522","type":"todo_list","content":"Explorer les sections clés de l''app : Tâches (/tasks), CRM (/leads), Réseau (/contacts) et Académie (/academy).","checked":false},{"id":"todo_list-mtgonsdp-523","type":"todo_list","content":"Comprendre le système de priorités P0/P1/P2.","checked":false},{"id":"todo_list-mtgonsdp-524","type":"todo_list","content":"Identifier 1 tâche que tu peux accomplir cette semaine.","checked":false},{"id":"todo_list-mtgonsdp-525","type":"todo_list","content":"Planifier un check-in de 15 minutes avec le fondateur pour valider le démarrage.","checked":false}]}'::jsonb,
  15,
  'Direction Minerva',
  true,
  true,
  true,
  1,
  'transversal',
  15
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-OPS-01 : Onboarding 30 Minutes Chrono pour Nouveau Membre');

-- sop-ops-02-remuneration-commissions
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-OPS-02 : Modèle de Rémunération 100% Commission & Rôles d’Équipe',
  'Grille de commissions transparentes (30% prospecteur, 15% MRR account manager, forfaits tech & delivery) et modalités de paiement.',
  'Rôles & Rémunération',
  '# SOP-OPS-02 : Modèle de Rémunération 100% Commission & Rôles d''Équipe

**Catégorie :** Rôles & Rémunération  
**Public cible :** Toute l''équipe Minerva  
**Temps de lecture :** 15 minutes  
**Auteur :** Direction Minerva  

---

## 1. Principe Général : 100% Commission & Alignement de Valeur

Chez Minerva, nous croyons à un modèle équitable où la rémunération est directement indexée sur la valeur produite et le travail accompli :
- **Pas de salaire fixe ni de plafond de gains**.
- **Chaque rôle dispose d''un barème de commission clair et transparent**.
- **Gagnant-gagnant** : Plus tu contribues au succès des clients et de l''agence, plus tes revenus augmentent.

---

## 2. Structure Détaillée par Rôle

| Rôle | Base de Calcul | Taux de Commission / Forfait | Exemple Concret |
| :--- | :--- | :--- | :--- |
| 📡 **Prospecteur** | Valeur du contrat / deal fermé | **30%** du montant total | Contrat agence ou setup à 3 000 $ → **900 $ CAD** |
| 🧑‍💼 **Account Manager** | MRR récurrent du client géré | **15%** du MRR mensuel | 5 clients à 350 $/mois MRR → **262,50 $/mois** récurrents |
| 💻 **Lead Développeur Full-Stack** | Forfait sprint ou % du projet sur-mesure | **25% à 30%** du projet build | Projet custom à 5 000 $ → **1 250 $ à 1 500 $ CAD** |
| 🤖 **Ingénieur IA & Automatisation** | Forfait par pipeline / workflow déployé | Variable (selon complexité) | Setup workflow Voice AI + CRM → Forfait convenu |
| 🎨 **Architecte Web & Framer** | Forfait par site web / portail client | Variable (défini au devis) | Vitrine Framer livrée sous 7j → Forfait projet |
| 🎬 **Créateur de contenu** | Forfait par projet ou livrable | Variable (défini au brief) | Lot de 4 vidéos montées → Tarif convenu au projet |
| 🛠️ **Support & QA** | Forfait par tâche ou ticket P0/P1 | Variable (défini par lot) | Résolution de tickets de test / validation |

---

## 3. Modalités & Calendrier de Paiement

1. **Condition de versement** : Les commissions sont exigibles dès l''encaissement effectif des fonds auprès du client.
2. **Périodicité** : Versement mensuel le **1er de chaque mois** pour l''ensemble des encaissements du mois précédent.
3. **Transparence** : Tout le suivi des commissions et facturations est auditable dans l''onglet Facturation (`/invoices`) et l''espace Équipe (`/team`).',
  '{"blocks":[{"id":"heading_1-mtgonsdp-526","type":"heading_1","content":"SOP-OPS-02 : Modèle de Rémunération 100% Commission & Rôles d''Équipe"},{"id":"paragraph-mtgonsdp-527","type":"paragraph","content":"Catégorie : Rôles & Rémunération"},{"id":"paragraph-mtgonsdp-528","type":"paragraph","content":"Public cible : Toute l''équipe Minerva"},{"id":"paragraph-mtgonsdp-529","type":"paragraph","content":"Temps de lecture : 15 minutes"},{"id":"paragraph-mtgonsdp-530","type":"paragraph","content":"Auteur : Direction Minerva"},{"id":"div-mtgonsdp-531","type":"divider","content":""},{"id":"heading_2-mtgonsdp-532","type":"heading_2","content":"1. Principe Général : 100% Commission & Alignement de Valeur"},{"id":"paragraph-mtgonsdp-533","type":"paragraph","content":"Chez Minerva, nous croyons à un modèle équitable où la rémunération est directement indexée sur la valeur produite et le travail accompli :"},{"id":"bullet_list-mtgonsdp-534","type":"bullet_list","content":"Pas de salaire fixe ni de plafond de gains."},{"id":"bullet_list-mtgonsdp-535","type":"bullet_list","content":"Chaque rôle dispose d''un barème de commission clair et transparent."},{"id":"bullet_list-mtgonsdp-536","type":"bullet_list","content":"Gagnant-gagnant : Plus tu contribues au succès des clients et de l''agence, plus tes revenus augmentent."},{"id":"div-mtgonsdp-537","type":"divider","content":""},{"id":"heading_2-mtgonsdp-538","type":"heading_2","content":"2. Structure Détaillée par Rôle"},{"id":"table-mtgonsdp-539","type":"table","content":"","tableData":[["Rôle","Base de Calcul","Taux de Commission / Forfait","Exemple Concret"],["📡 Prospecteur","Valeur du contrat / deal fermé","30% du montant total","Contrat agence ou setup à 3 000 $ → 900 $ CAD"],["🧑‍💼 Account Manager","MRR récurrent du client géré","15% du MRR mensuel","5 clients à 350 $/mois MRR → 262,50 $/mois récurrents"],["💻 Lead Développeur Full-Stack","Forfait sprint ou % du projet sur-mesure","25% à 30% du projet build","Projet custom à 5 000 $ → 1 250 $ à 1 500 $ CAD"],["🤖 Ingénieur IA & Automatisation","Forfait par pipeline / workflow déployé","Variable (selon complexité)","Setup workflow Voice AI + CRM → Forfait convenu"],["🎨 Architecte Web & Framer","Forfait par site web / portail client","Variable (défini au devis)","Vitrine Framer livrée sous 7j → Forfait projet"],["🎬 Créateur de contenu","Forfait par projet ou livrable","Variable (défini au brief)","Lot de 4 vidéos montées → Tarif convenu au projet"],["🛠️ Support & QA","Forfait par tâche ou ticket P0/P1","Variable (défini par lot)","Résolution de tickets de test / validation"]]},{"id":"div-mtgonsdp-540","type":"divider","content":""},{"id":"heading_2-mtgonsdp-541","type":"heading_2","content":"3. Modalités & Calendrier de Paiement"},{"id":"numbered_list-mtgonsdp-542","type":"numbered_list","content":"Condition de versement : Les commissions sont exigibles dès l''encaissement effectif des fonds auprès du client."},{"id":"numbered_list-mtgonsdp-543","type":"numbered_list","content":"Périodicité : Versement mensuel le 1er de chaque mois pour l''ensemble des encaissements du mois précédent."},{"id":"numbered_list-mtgonsdp-544","type":"numbered_list","content":"Transparence : Tout le suivi des commissions et facturations est auditable dans l''onglet Facturation (/invoices) et l''espace Équipe (/team)."}]}'::jsonb,
  15,
  'Direction Minerva',
  true,
  true,
  true,
  3,
  'transversal',
  15
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-OPS-02 : Modèle de Rémunération 100% Commission & Rôles d’Équipe');

-- sop-ops-03-prospection-scripts
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-OPS-03 : Playbook Prospection & Scripts de Vente (Cold Call, Cold Email, DMs)',
  'Scripts complets de prospection téléphonique, email et DMs réseaux sociaux avec arguments et réponses types.',
  'Ventes & Prospection',
  '# SOP-OPS-03 : Playbook Prospection & Scripts de Vente

**Catégorie :** Ventes & Prospection  
**Public cible :** Prospecteurs, Fondateur, Équipe Sales  
**Temps de lecture :** 20 minutes  
**Auteur :** Équipe Commerciale Minerva  

---

## 1. Le Cycle de Prospection Standard en 5 Étapes

1. **Recherche (30 min)** : Trouver 10 prospects qualifiés sur Google Maps / LinkedIn.
2. **Création CRM (15 min)** : Créer chaque fiche dans l''application Reach / CRM.
3. **Outreach (20 min)** : Envoyer la séquence de 5 touches.
4. **Suivi (10 min/jour)** : Mettre à jour les statuts et relancer.
5. **Meeting Démo** : Transférer le prospect qualifié à Minerva pour la démo.

---

## 2. Scripts Prêts à l''Emploi

### 📞 Script Cold Call Téléphonique (30 Secondes)

> *« Bonjour [Prénom], c’est [Ton Nom] de Minerva. On aide les [type d’établissement, ex: restaurants indépendants de Montréal] à [bénéfice clé, ex: récupérer leurs marges sur les livraisons et moderniser leur système de commande]. J’ai remarqué que vous [observation précise, ex: avez d’excellents avis Google mais un menu en PDF peu lisible sur mobile]. Vous auriez 15 minutes cette semaine pour que je vous montre rapidement comment ça fonctionne ? »*

---

### ✉️ Script Cold Email Personnalisé

```text
Objet : Question rapide sur [Nom du restaurant] — Minerva

Bonjour [Prénom],

J''ai vu que vous gérez [Nom de l''établissement] et je me suis dit que [problème probable : marges UberEats / manque de temps pour la gestion] devait vous parler.

On aide les restaurants et cafés à [bénéfice : automatiser leur gestion et booster leurs commandes directes] avec nos outils Minerva Flow, sans la friction des logiciels traditionnels.

Si vous êtes curieux, je peux vous montrer une simulation de 15 minutes cette semaine. Dites-moi ce qui vous arrange !

Bonne journée,
[Ton Nom] — Minerva
```

---

### 📩 DM de Recrutement (Réponse au commentaire « MINERVA »)

> *« Salut ! Merci pour ton intérêt 🙌 Minerva, c''est une agence-studio à Montréal. On bâtit des solutions logicielles (apps SaaS, systèmes d''automatisation) pour les entrepreneurs et les restos. On cherche du monde qui veut builder avec nous, pas juste exécuter.*  
> *Modèle 100% commission — plus tu performes, plus tu gagnes. Pas de plafond.*  
> *Voici les rôles dispo et les taux :*  
> *📡 Prospecteur (30% par deal fermé)*  
> *🧑‍💼 Account Manager (15% du MRR client)*  
> *🎬 Créateur de contenu (forfait par projet)*  
> *🛠️ Support & QA (forfait par tâche)*  
> *Si un rôle t''intéresse, dis-moi lequel et je t''envoie le détail + la prochaine étape. Pas d''entrevue traditionnelle — on commence par une tâche test payée pour voir si le fit est là. Tu veux essayer ? »*

---

### 📩 DMs Réponse aux Ressources TOF

- **Mot-clé « PLAN »** : Envoi de la ressource pour découper une idée en version lançable en 7 jours (règle du 70%).
- **Mot-clé « SYSTEME »** : Envoi du système de structuration des semaines de travail sans motivation.
- **Mot-clé « TEST »** : Envoi de la méthode de validation d''idée en 7 jours sans budget.',
  '{"blocks":[{"id":"heading_1-mtgonsdp-545","type":"heading_1","content":"SOP-OPS-03 : Playbook Prospection & Scripts de Vente"},{"id":"paragraph-mtgonsdp-546","type":"paragraph","content":"Catégorie : Ventes & Prospection"},{"id":"paragraph-mtgonsdp-547","type":"paragraph","content":"Public cible : Prospecteurs, Fondateur, Équipe Sales"},{"id":"paragraph-mtgonsdp-548","type":"paragraph","content":"Temps de lecture : 20 minutes"},{"id":"paragraph-mtgonsdp-549","type":"paragraph","content":"Auteur : Équipe Commerciale Minerva"},{"id":"div-mtgonsdp-550","type":"divider","content":""},{"id":"heading_2-mtgonsdq-551","type":"heading_2","content":"1. Le Cycle de Prospection Standard en 5 Étapes"},{"id":"numbered_list-mtgonsdq-552","type":"numbered_list","content":"Recherche (30 min) : Trouver 10 prospects qualifiés sur Google Maps / LinkedIn."},{"id":"numbered_list-mtgonsdq-553","type":"numbered_list","content":"Création CRM (15 min) : Créer chaque fiche dans l''application Reach / CRM."},{"id":"numbered_list-mtgonsdq-554","type":"numbered_list","content":"Outreach (20 min) : Envoyer la séquence de 5 touches."},{"id":"numbered_list-mtgonsdq-555","type":"numbered_list","content":"Suivi (10 min/jour) : Mettre à jour les statuts et relancer."},{"id":"numbered_list-mtgonsdq-556","type":"numbered_list","content":"Meeting Démo : Transférer le prospect qualifié à Minerva pour la démo."},{"id":"div-mtgonsdq-557","type":"divider","content":""},{"id":"heading_2-mtgonsdq-558","type":"heading_2","content":"2. Scripts Prêts à l''Emploi"},{"id":"heading_3-mtgonsdq-559","type":"heading_3","content":"📞 Script Cold Call Téléphonique (30 Secondes)"},{"id":"quote-mtgonsdq-560","type":"quote","content":"« Bonjour [Prénom], c’est [Ton Nom] de Minerva. On aide les [type d’établissement, ex: restaurants indépendants de Montréal] à [bénéfice clé, ex: récupérer leurs marges sur les livraisons et moderniser leur système de commande]. J’ai remarqué que vous [observation précise, ex: avez d’excellents avis Google mais un menu en PDF peu lisible sur mobile]. Vous auriez 15 minutes cette semaine pour que je vous montre rapidement comment ça fonctionne ? »"},{"id":"div-mtgonsdq-561","type":"divider","content":""},{"id":"heading_3-mtgonsdq-562","type":"heading_3","content":"✉️ Script Cold Email Personnalisé"},{"id":"code-mtgonsdq-563","type":"code_block","content":"Objet : Question rapide sur [Nom du restaurant] — Minerva\n\nBonjour [Prénom],\n\nJ''ai vu que vous gérez [Nom de l''établissement] et je me suis dit que [problème probable : marges UberEats / manque de temps pour la gestion] devait vous parler.\n\nOn aide les restaurants et cafés à [bénéfice : automatiser leur gestion et booster leurs commandes directes] avec nos outils Minerva Flow, sans la friction des logiciels traditionnels.\n\nSi vous êtes curieux, je peux vous montrer une simulation de 15 minutes cette semaine. Dites-moi ce qui vous arrange !\n\nBonne journée,\n[Ton Nom] — Minerva","codeLanguage":"text"},{"id":"div-mtgonsdq-564","type":"divider","content":""},{"id":"heading_3-mtgonsdq-565","type":"heading_3","content":"📩 DM de Recrutement (Réponse au commentaire « MINERVA »)"},{"id":"quote-mtgonsdq-566","type":"quote","content":"« Salut ! Merci pour ton intérêt 🙌 Minerva, c''est une agence-studio à Montréal. On bâtit des solutions logicielles (apps SaaS, systèmes d''automatisation) pour les entrepreneurs et les restos. On cherche du monde qui veut builder avec nous, pas juste exécuter."},{"id":"quote-mtgonsdq-567","type":"quote","content":"Modèle 100% commission — plus tu performes, plus tu gagnes. Pas de plafond."},{"id":"quote-mtgonsdq-568","type":"quote","content":"Voici les rôles dispo et les taux :"},{"id":"quote-mtgonsdq-569","type":"quote","content":"📡 Prospecteur (30% par deal fermé)"},{"id":"quote-mtgonsdq-570","type":"quote","content":"🧑‍💼 Account Manager (15% du MRR client)"},{"id":"quote-mtgonsdq-571","type":"quote","content":"🎬 Créateur de contenu (forfait par projet)"},{"id":"quote-mtgonsdq-572","type":"quote","content":"🛠️ Support & QA (forfait par tâche)"},{"id":"quote-mtgonsdq-573","type":"quote","content":"Si un rôle t''intéresse, dis-moi lequel et je t''envoie le détail + la prochaine étape. Pas d''entrevue traditionnelle — on commence par une tâche test payée pour voir si le fit est là. Tu veux essayer ? »"},{"id":"div-mtgonsdq-574","type":"divider","content":""},{"id":"heading_3-mtgonsdq-575","type":"heading_3","content":"📩 DMs Réponse aux Ressources TOF"},{"id":"bullet_list-mtgonsdq-576","type":"bullet_list","content":"Mot-clé « PLAN » : Envoi de la ressource pour découper une idée en version lançable en 7 jours (règle du 70%)."},{"id":"bullet_list-mtgonsdq-577","type":"bullet_list","content":"Mot-clé « SYSTEME » : Envoi du système de structuration des semaines de travail sans motivation."},{"id":"bullet_list-mtgonsdq-578","type":"bullet_list","content":"Mot-clé « TEST » : Envoi de la méthode de validation d''idée en 7 jours sans budget."}]}'::jsonb,
  20,
  'Équipe Commerciale Minerva',
  true,
  true,
  false,
  116,
  'reach',
  20
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-OPS-03 : Playbook Prospection & Scripts de Vente (Cold Call, Cold Email, DMs)');

-- sop-ops-04-account-management
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-OPS-04 : Playbook Account Management & Rétention Client',
  'Protocole complet de gestion de compte : Onboarding J0-J7, rituels de check-in, revues mensuelles et gestion des renouvellements.',
  'Gestion de compte',
  '# SOP-OPS-04 : Playbook Account Management & Rétention Client

**Catégorie :** Gestion de compte  
**Public cible :** Account Managers, Lead Client Success  
**Temps de lecture :** 20 minutes  
**Auteur :** Direction Minerva  

---

## 1. Cycle d''Onboarding Client (J0 à J7)

- **[ ] J0 — Message de bienvenue** : Accuser réception de la signature et envoyer les accès initiaux.
- **[ ] J0 — Création de la fiche projet** : Créer le dossier client dans l''application Minerva et sur Plane.
- **[ ] J1 — Session de Kickoff (30 min)** : Valider les priorités de lancement, recueillir les assets de marque et le menu du restaurant.
- **[ ] J2 — Partage d''accès aux outils** : Configurer les comptes Minerva Flow et Framer.
- **[ ] J3 — Première livraison visible (Quick Win)** : Livrer le prototype interactif ou la structure de page pour sécuriser la confiance.
- **[ ] J7 — Check-in de fin de semaine 1** : Recueillir les premiers feedbacks et caler le rythme de croisière.

---

## 2. Rituels de Gestion & Rétention Continue

### Check-in Hebdomadaire (15-20 min) :
1. Ce qui a été livré cette semaine.
2. Les métriques clés (commandes, leads générés, avis collectés).
3. Les bloquants éventuels et actions correctives.

### Revue Mensuelle de Performance (30 min) :
- Rapport exécutif ROI généré depuis l''application (`/clients/[id]/roi-tracker`).
- Identification d''opportunités d''upsell (ex: ajout de modules Minerva Flow, automatisation SMS, pack vidéo).

### Gestion des Insatisfactions :
- **Règle d''or** : Accuser réception en **moins de 4 heures**. Proposer une solution concrète sous **24 heures**.
- Escalader immédiatement au fondateur si le problème bloque l''activité du restaurant.',
  '{"blocks":[{"id":"heading_1-mtgonsdq-579","type":"heading_1","content":"SOP-OPS-04 : Playbook Account Management & Rétention Client"},{"id":"paragraph-mtgonsdq-580","type":"paragraph","content":"Catégorie : Gestion de compte"},{"id":"paragraph-mtgonsdq-581","type":"paragraph","content":"Public cible : Account Managers, Lead Client Success"},{"id":"paragraph-mtgonsdq-582","type":"paragraph","content":"Temps de lecture : 20 minutes"},{"id":"paragraph-mtgonsdq-583","type":"paragraph","content":"Auteur : Direction Minerva"},{"id":"div-mtgonsdq-584","type":"divider","content":""},{"id":"heading_2-mtgonsdq-585","type":"heading_2","content":"1. Cycle d''Onboarding Client (J0 à J7)"},{"id":"bullet_list-mtgonsdq-586","type":"bullet_list","content":"[ ] J0 — Message de bienvenue : Accuser réception de la signature et envoyer les accès initiaux."},{"id":"bullet_list-mtgonsdq-587","type":"bullet_list","content":"[ ] J0 — Création de la fiche projet : Créer le dossier client dans l''application Minerva et sur Plane."},{"id":"bullet_list-mtgonsdq-588","type":"bullet_list","content":"[ ] J1 — Session de Kickoff (30 min) : Valider les priorités de lancement, recueillir les assets de marque et le menu du restaurant."},{"id":"bullet_list-mtgonsdq-589","type":"bullet_list","content":"[ ] J2 — Partage d''accès aux outils : Configurer les comptes Minerva Flow et Framer."},{"id":"bullet_list-mtgonsdq-590","type":"bullet_list","content":"[ ] J3 — Première livraison visible (Quick Win) : Livrer le prototype interactif ou la structure de page pour sécuriser la confiance."},{"id":"bullet_list-mtgonsdq-591","type":"bullet_list","content":"[ ] J7 — Check-in de fin de semaine 1 : Recueillir les premiers feedbacks et caler le rythme de croisière."},{"id":"div-mtgonsdq-592","type":"divider","content":""},{"id":"heading_2-mtgonsdq-593","type":"heading_2","content":"2. Rituels de Gestion & Rétention Continue"},{"id":"heading_3-mtgonsdq-594","type":"heading_3","content":"Check-in Hebdomadaire (15-20 min) :"},{"id":"numbered_list-mtgonsdq-595","type":"numbered_list","content":"Ce qui a été livré cette semaine."},{"id":"numbered_list-mtgonsdq-596","type":"numbered_list","content":"Les métriques clés (commandes, leads générés, avis collectés)."},{"id":"numbered_list-mtgonsdq-597","type":"numbered_list","content":"Les bloquants éventuels et actions correctives."},{"id":"heading_3-mtgonsdq-598","type":"heading_3","content":"Revue Mensuelle de Performance (30 min) :"},{"id":"bullet_list-mtgonsdq-599","type":"bullet_list","content":"Rapport exécutif ROI généré depuis l''application (/clients/[id]/roi-tracker)."},{"id":"bullet_list-mtgonsdq-600","type":"bullet_list","content":"Identification d''opportunités d''upsell (ex: ajout de modules Minerva Flow, automatisation SMS, pack vidéo)."},{"id":"heading_3-mtgonsdq-601","type":"heading_3","content":"Gestion des Insatisfactions :"},{"id":"bullet_list-mtgonsdq-602","type":"bullet_list","content":"Règle d''or : Accuser réception en moins de 4 heures. Proposer une solution concrète sous 24 heures."},{"id":"bullet_list-mtgonsdq-603","type":"bullet_list","content":"Escalader immédiatement au fondateur si le problème bloque l''activité du restaurant."}]}'::jsonb,
  20,
  'Direction Minerva',
  true,
  true,
  true,
  4,
  'flow',
  20
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-OPS-04 : Playbook Account Management & Rétention Client');

-- sop-ops-05-support-qa
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-OPS-05 : Procédure Support Client, QA & Gestion des Tickets',
  'Classification des priorités P0/P1/P2, traitement des anomalies en production et checklist de QA avant release.',
  'Support & QA',
  '# SOP-OPS-05 : Procédure Support Client, QA & Gestion des Tickets

**Catégorie :** Support & QA  
**Public cible :** Équipe Support, Développeurs, Testeurs QA  
**Temps de lecture :** 15 minutes  
**Auteur :** Direction Minerva  

---

## 1. Niveaux de Priorité des Tickets

| Priorité | Définition | Délai de Première Réponse | Délai Cible de Résolution |
| :--- | :--- | :--- | :--- |
| 🔴 **P0 — Bloquant** | Panne critique en production (ex: commandes bloquées, crash du menu en ligne) | **< 2 heures** | **< 6 heures** |
| 🟡 **P1 — Important** | Dysfonctionnement majeur avec solution de contournement possible | **< 8 heures** | **< 24 heures** |
| 🟢 **P2 — Mineur** | Ajustement cosmétique, demande d''amélioration, typo | **< 24 heures** | **Sprint suivant** |

---

## 2. Processus de Traitement d''un Ticket

1. **Réception & Qualification** : Vérifier la reproductibilité du bug et assigner le niveau de priorité (P0/P1/P2) dans le tableau de tâches (`/tasks` ou Plane).
2. **Investigation & Reproduction** : Consigner les étapes exactes pour reproduire le bug (navigateur, OS, URL, compte client).
3. **Résolution ou Escalade** : Si le bug touche au code source ou à la base de données, assigner au fondateur avec les logs.
4. **Documentation** : Enrichir la base de connaissances interne ou les SOPs si le bug révèle un cas d''usage récurrent.

---

## 3. Protocole de QA Avant Release

Avant toute mise en production d''une fonctionnalité dans Minerva, Flow ou Reach :
- [ ] Exécuter `npx tsc --noEmit` pour garantir zéro erreur de typage.
- [ ] Exécuter les tests E2E `npx playwright test`.
- [ ] Vérifier la bonne dégradation gracieuse en cas d''absence de variable d''environnement tierce.
- [ ] Valider l''affichage sur mobile et desktop.',
  '{"blocks":[{"id":"heading_1-mtgonsdq-604","type":"heading_1","content":"SOP-OPS-05 : Procédure Support Client, QA & Gestion des Tickets"},{"id":"paragraph-mtgonsdq-605","type":"paragraph","content":"Catégorie : Support & QA"},{"id":"paragraph-mtgonsdq-606","type":"paragraph","content":"Public cible : Équipe Support, Développeurs, Testeurs QA"},{"id":"paragraph-mtgonsdq-607","type":"paragraph","content":"Temps de lecture : 15 minutes"},{"id":"paragraph-mtgonsdq-608","type":"paragraph","content":"Auteur : Direction Minerva"},{"id":"div-mtgonsdq-609","type":"divider","content":""},{"id":"heading_2-mtgonsdq-610","type":"heading_2","content":"1. Niveaux de Priorité des Tickets"},{"id":"table-mtgonsdq-611","type":"table","content":"","tableData":[["Priorité","Définition","Délai de Première Réponse","Délai Cible de Résolution"],["🔴 P0 — Bloquant","Panne critique en production (ex: commandes bloquées, crash du menu en ligne)","< 2 heures","< 6 heures"],["🟡 P1 — Important","Dysfonctionnement majeur avec solution de contournement possible","< 8 heures","< 24 heures"],["🟢 P2 — Mineur","Ajustement cosmétique, demande d''amélioration, typo","< 24 heures","Sprint suivant"]]},{"id":"div-mtgonsdq-612","type":"divider","content":""},{"id":"heading_2-mtgonsdq-613","type":"heading_2","content":"2. Processus de Traitement d''un Ticket"},{"id":"numbered_list-mtgonsdq-614","type":"numbered_list","content":"Réception & Qualification : Vérifier la reproductibilité du bug et assigner le niveau de priorité (P0/P1/P2) dans le tableau de tâches (/tasks ou Plane)."},{"id":"numbered_list-mtgonsdq-615","type":"numbered_list","content":"Investigation & Reproduction : Consigner les étapes exactes pour reproduire le bug (navigateur, OS, URL, compte client)."},{"id":"numbered_list-mtgonsdq-616","type":"numbered_list","content":"Résolution ou Escalade : Si le bug touche au code source ou à la base de données, assigner au fondateur avec les logs."},{"id":"numbered_list-mtgonsdq-617","type":"numbered_list","content":"Documentation : Enrichir la base de connaissances interne ou les SOPs si le bug révèle un cas d''usage récurrent."},{"id":"div-mtgonsdq-618","type":"divider","content":""},{"id":"heading_2-mtgonsdq-619","type":"heading_2","content":"3. Protocole de QA Avant Release"},{"id":"paragraph-mtgonsdq-620","type":"paragraph","content":"Avant toute mise en production d''une fonctionnalité dans Minerva, Flow ou Reach :"},{"id":"todo_list-mtgonsdq-621","type":"todo_list","content":"Exécuter npx tsc --noEmit pour garantir zéro erreur de typage.","checked":false},{"id":"todo_list-mtgonsdq-622","type":"todo_list","content":"Exécuter les tests E2E npx playwright test.","checked":false},{"id":"todo_list-mtgonsdq-623","type":"todo_list","content":"Vérifier la bonne dégradation gracieuse en cas d''absence de variable d''environnement tierce.","checked":false},{"id":"todo_list-mtgonsdq-624","type":"todo_list","content":"Valider l''affichage sur mobile et desktop.","checked":false}]}'::jsonb,
  15,
  'Direction Minerva',
  true,
  true,
  true,
  5,
  'transversal',
  15
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-OPS-05 : Procédure Support Client, QA & Gestion des Tickets');

-- sop-tools-claude-code-and-reach
INSERT INTO public.academy_sops (title, description, category, content_markdown, content_json, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, estimated_minutes)
SELECT
  'SOP-OPS-06 : Claude Code au quotidien & où se situe Minerva Reach',
  'Comment Claude Code lit réellement le contexte du projet (pas d’artifact à lier), et pourquoi Minerva Reach est un produit séparé — pas un onglet de cette application.',
  'Outils & Systèmes',
  '# SOP-OPS-06 : Claude Code au quotidien & où se situe Minerva Reach

**Catégorie :** Outils & Systèmes
**Public cible :** Développeurs, Ingénieurs IA, toute l''équipe (pour la partie 2)
**Temps de lecture :** 10 minutes
**Auteur :** Équipe Technique Minerva

---

## PARTIE 1 : Claude Code — comment ça fonctionne réellement

Il n''y a **pas d''artifact Claude.ai à « lier »** pour démarrer une session sur ce projet. Claude Code lit automatiquement `CLAUDE.md` et `AGENTS.md` à la racine du dépôt dès qu''une session démarre dans ce dossier — aucune étape manuelle de connexion n''est nécessaire.

### Pour démarrer
1. Ouvrir un terminal à la racine du projet.
2. Lancer `claude` (le CLI officiel Anthropic).
3. Claude Code charge `CLAUDE.md`/`AGENTS.md` comme contexte de départ — c''est notre documentation vivante du projet, pas un artifact externe.

### Pour connecter un client MCP (Claude Desktop, un autre agent) au serveur Minerva

Voir **SOP-IA-04 : Minerva MCP Server & Tool Augmentation** pour la configuration complète de `.mcp.json` et la liste des outils exposés (`minerva_get_leads`, `minerva_get_kpi`, les outils Plane, etc.). Ce guide-ci ne duplique pas cette procédure pour éviter que les deux SOP divergent avec le temps.

---

## PARTIE 2 : Minerva Reach — un produit séparé, pas une section de cette app

**Minerva Reach n''est pas une fonctionnalité de Minerva Trequartista.** C''est un produit distinct de l''écosystème Minerva (au même titre que Minerva Flow, mais avec son propre dépôt, sa propre base de données, et aucune connexion technique avec cette application).

- Ce dépôt ne contient **aucune credential Reach** et n''a aucun accès à ses données.
- Si votre travail de prospection se fait **dans Minerva Trequartista**, l''outil réel est le CRM `/leads` de cette app — pas des onglets « Prospection / Leads / Outreach » qui n''existent pas ici.
- Si votre équipe utilise Reach en parallèle comme outil séparé, référez-vous à sa propre documentation — ce guide ne peut pas garantir l''exactitude de détails d''une autre application qu''il ne peut pas vérifier.

**À retenir :** si un SOP ou une conversation mélange du vocabulaire Reach avec des fonctionnalités attendues dans Trequartista, c''est un signal d''erreur — signalez-le, ne présumez pas que la fonctionnalité existe ici.',
  '{"blocks":[{"id":"heading_1-mtgonsdq-625","type":"heading_1","content":"SOP-OPS-06 : Claude Code au quotidien & où se situe Minerva Reach"},{"id":"paragraph-mtgonsdq-626","type":"paragraph","content":"Catégorie : Outils & Systèmes"},{"id":"paragraph-mtgonsdq-627","type":"paragraph","content":"Public cible : Développeurs, Ingénieurs IA, toute l''équipe (pour la partie 2)"},{"id":"paragraph-mtgonsdq-628","type":"paragraph","content":"Temps de lecture : 10 minutes"},{"id":"paragraph-mtgonsdq-629","type":"paragraph","content":"Auteur : Équipe Technique Minerva"},{"id":"div-mtgonsdq-630","type":"divider","content":""},{"id":"heading_2-mtgonsdq-631","type":"heading_2","content":"PARTIE 1 : Claude Code — comment ça fonctionne réellement"},{"id":"paragraph-mtgonsdq-632","type":"paragraph","content":"Il n''y a pas d''artifact Claude.ai à « lier » pour démarrer une session sur ce projet. Claude Code lit automatiquement CLAUDE.md et AGENTS.md à la racine du dépôt dès qu''une session démarre dans ce dossier — aucune étape manuelle de connexion n''est nécessaire."},{"id":"heading_3-mtgonsdq-633","type":"heading_3","content":"Pour démarrer"},{"id":"numbered_list-mtgonsdq-634","type":"numbered_list","content":"Ouvrir un terminal à la racine du projet."},{"id":"numbered_list-mtgonsdq-635","type":"numbered_list","content":"Lancer claude (le CLI officiel Anthropic)."},{"id":"numbered_list-mtgonsdq-636","type":"numbered_list","content":"Claude Code charge CLAUDE.md/AGENTS.md comme contexte de départ — c''est notre documentation vivante du projet, pas un artifact externe."},{"id":"heading_3-mtgonsdq-637","type":"heading_3","content":"Pour connecter un client MCP (Claude Desktop, un autre agent) au serveur Minerva"},{"id":"paragraph-mtgonsdq-638","type":"paragraph","content":"Voir SOP-IA-04 : Minerva MCP Server & Tool Augmentation pour la configuration complète de .mcp.json et la liste des outils exposés (minerva_get_leads, minerva_get_kpi, les outils Plane, etc.). Ce guide-ci ne duplique pas cette procédure pour éviter que les deux SOP divergent avec le temps."},{"id":"div-mtgonsdq-639","type":"divider","content":""},{"id":"heading_2-mtgonsdq-640","type":"heading_2","content":"PARTIE 2 : Minerva Reach — un produit séparé, pas une section de cette app"},{"id":"paragraph-mtgonsdq-641","type":"paragraph","content":"Minerva Reach n''est pas une fonctionnalité de Minerva Trequartista. C''est un produit distinct de l''écosystème Minerva (au même titre que Minerva Flow, mais avec son propre dépôt, sa propre base de données, et aucune connexion technique avec cette application)."},{"id":"bullet_list-mtgonsdq-642","type":"bullet_list","content":"Ce dépôt ne contient aucune credential Reach et n''a aucun accès à ses données."},{"id":"bullet_list-mtgonsdq-643","type":"bullet_list","content":"Si votre travail de prospection se fait dans Minerva Trequartista, l''outil réel est le CRM /leads de cette app — pas des onglets « Prospection / Leads / Outreach » qui n''existent pas ici."},{"id":"bullet_list-mtgonsdq-644","type":"bullet_list","content":"Si votre équipe utilise Reach en parallèle comme outil séparé, référez-vous à sa propre documentation — ce guide ne peut pas garantir l''exactitude de détails d''une autre application qu''il ne peut pas vérifier."},{"id":"paragraph-mtgonsdq-645","type":"paragraph","content":"À retenir : si un SOP ou une conversation mélange du vocabulaire Reach avec des fonctionnalités attendues dans Trequartista, c''est un signal d''erreur — signalez-le, ne présumez pas que la fonctionnalité existe ici."}]}'::jsonb,
  10,
  'Équipe Technique Minerva',
  true,
  true,
  false,
  119,
  'transversal',
  10
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'SOP-OPS-06 : Claude Code au quotidien & où se situe Minerva Reach');
