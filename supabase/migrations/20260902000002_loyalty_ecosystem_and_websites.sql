-- ============================================================================
-- Migration : 20260902000002_loyalty_ecosystem_and_websites.sql
-- Description : Réalignement stratégique sur l'écosystème de fidélisation et
--               l'optimisation des marges nettes (Minerva Flow & Minerva Studio),
--               et mise à jour des SOPs de vente et closing (Essai 14 jours Montréal).
-- Version : v2.21.0
-- ============================================================================

-- 1. Mise à jour de SOP-PROSP-05 : Formation Vente & Closing
UPDATE public.academy_sops
SET
  title = 'Formation Vente & Closing : Écosystème de Fidélisation & Marges (Minerva Flow)',
  description = 'Script pas-à-pas de démonstration de Minerva Flow : valorisation de la fidélisation habitués, protection des marges nettes, essai accompagné 14 jours et closing.',
  content_markdown = '# SOP-PROSP-05 — Écosystème de Fidélisation & Marges : Démo & Closing

## 1. Philosophie Commerciale : La Fidélisation & les Marges Nettes
Le restaurateur montréalais est saturé de démarchages agressifs focalisés sur la culpabilité. Notre approche est résolument positive, créatrice de valeur et orientée résultat :
- **Fidélisation Client :** Faire revenir les habitués du quartier directement chez lui grâce à un parcours fluide (QR code, SMS, points de fidélité).
- **Protection des Marges en Cuisine :** Chaque commande directe passée sur Minerva Flow est à 0% de commission intermédiaire.
- **Essai Accompagné de 14 Jours :** Zéro friction financière, installation physique sur place à Montréal par notre équipe technique.

## 2. Déroulé de la Démo en 15 Minutes
1. **Minute 1-3 : La Démonstration du Potentiel de Fidélisation**
   - Montrer à quel point 15% à 25% des clients d''un restaurant sont des habitués récurrents qui commandent par habitude sur des tiers.
   - Présenter le gain direct de marge nette : *« Sur vos habitués du midi et du soir, vous conservez 100% de la valeur dans votre cuisine. »*
2. **Minute 4-8 : L''Expérience Client sur Smartphone & QR Code**
   - Présenter le menu digital interactif modélisé à l''image du restaurant sur `https://minervaflow.framer.website/`.
   - Simuler un scan de QR code de table et une commande directe en 3 clics avec Apple Pay / carte.
3. **Minute 9-12 : L''Offre Irrésistible de l''Essai Accompagné 14 Jours**
   - *« Nous venons directement chez vous à Montréal installer le matériel (chevalets QR codes et imprimante de cuisine). Vous testez gratuitement pendant 14 jours avec accompagnement dédié. Si vous n''adorez pas, nous reprenons tout sans le moindre frais. »*
4. **Minute 13-15 : Formalisation & Devis 1-Clic sur Trequartista**
   - Envoi de la proposition commerciale sur `/proposals` avec signature électronique et acompte.',
  checklist_items = '["Pré-configurer 5 plats vedettes sur l''interface de démo Flow", "Présenter le site officiel minervaflow.framer.website", "Démontrer le parcours QR code de fidélisation", "Proposer l''essai accompagné de 14 jours avec installation sur place à Montréal", "Générer la proposition commerciale sur /proposals"]'::jsonb,
  script_template = 'Bonjour [Prénom],\n\nOn aide les restaurateurs montréalais comme [Établissement] à fidéliser leurs clients habituels et protéger leurs marges en cuisine à 0% de commission.\n\nOn a préparé votre espace de commande et fidélité en ligne :\n👉 https://minervaflow.framer.website/\n\nL''installation sur place à Montréal et un essai accompagné de 14 jours sont inclus sans engagement. Seriez-vous ouvert à ce qu''on se rencontre 10 minutes mardi à 14h30 ?\n\nBien à vous,\n[Votre Prénom] — Minerva Flow'
WHERE title ILIKE '%Formation Vente & Closing%Minerva Flow%';

-- 2. Mise à jour de SOP-PROSP-04 : Formation Continue & Traitement des Objections
UPDATE public.academy_sops
SET
  content_markdown = '# SOP-PROSP-04 — Formation Continue & Dojo Vente de l''Écosystème Minerva

## 1. Cadre d''Excellence Commerciale
Chez Minerva, les meilleurs conseillers maîtrisent la proposition de valeur de nos deux vitrines :
- **Minerva Flow** (`https://minervaflow.framer.website/`) : Fidélisation, commande directe sans commission et récurrence clients.
- **Minerva Studio** (`https://minervastudio.framer.website/`) : Image de marque, conception de sites Framer haute conversion et production vidéo culinaire.

## 2. Réponses aux 3 Objections Majeures du Restaurateur
- **« Je n''ai pas le temps, rappelez-moi plus tard »**
  - *Réponse :* « Je comprends tout à fait, vous êtes en plein rush de service. Je vous laisse l''adresse de notre vitrine (minervaflow.framer.website). On vient nous-mêmes faire l''installation sur place à Montréal avec un essai de 14 jours sans risque. On fait un point de 5 minutes mardi à 15h ? »
- **« Les plateformes tierces m''apportent tous mes clients »**
  - *Réponse :* « C''est parfait pour la découverte de nouveaux clients ! Mais vos habituels qui aiment déjà votre cuisine n''ont pas besoin d''un intermédiaire payant. Minerva Flow est leur canal direct avec récompenses de fidélité, ce qui protège votre marge nette en cuisine. »
- **« Je ne veux pas de frais fixes mensuels élevés »**
  - *Réponse :* « Notre formule à 0% commission et l''essai accompagné de 14 jours vous permettent de constater les premières commandes récurrentes avant toute dépense. L''installation est clé en main. »'
WHERE title ILIKE '%Programme de Formation Continue & Écoute d’Appels%';
