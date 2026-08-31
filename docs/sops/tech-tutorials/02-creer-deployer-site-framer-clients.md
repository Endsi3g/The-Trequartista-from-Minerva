# SOP-DEV-02 — Guide Pratique : Créer & Déployer un Site Framer Haute Conversion pour Clients

**Dernière mise à jour :** 31 août 2026  
**Audience :** Designers UI/UX, Développeurs Frontend & Growth Managers  
**Objectif :** Standardiser la conception, l'intégration des formulaires webhooks et la publication en ligne de sites web ultra-rapides sous Framer pour les clients de l'agence Minerva.

---

## 1. Pourquoi Framer pour les Clients Minerva ?

Framer combine 3 avantages décisifs pour nos clients commerçants et PME :
1. **Performance & Vitesse de Chargement (Lighthouse 95+)** : Code optimisé automatiquement avec rendu sur CDN mondial.
2. **Animations & Micro-Interactions Fluides (60 FPS)** : Composants réactifs sans lourdeur technique.
3. **Autonomie Client & Connexion Webhooks** : Possibilité pour le client de modifier ses textes tout en conservant nos formulaires connectés à Supabase et à Minerva CRM.

---

## 2. Structure Standard d'une Page Client Haute Conversion

Tout site client Framer conçu par l'agence doit suivre cette architecture à 6 blocs :

```
[1. Hero Section]       → Proposition de valeur claire + Badge avis + CTA Réserver / Commander
[2. Preuve Sociale]     → Bandeau de logos partenaires / Médias locaux (La Presse, Eater Mtl)
[3. Menu / Offre Phare] → Grille visuelle avec photos 4K, prix clairs et badges "Populaire"
[4. Galerie & Ambiance] → Slider fluide ou Bento Grid des photos du lieu
[5. Témoignages Clients]→ Avis Google authentiques avec 5 étoiles dorées et photo
[6. Formulaire & Footer]→ Horaires, adresse Maps intégrée, formulaire connecté + Réseaux
```

---

## 3. Configuration des Design Tokens Minerva dans Framer

Pour assurer une cohérence visuelle premium :
- **Typographie :**
  - Titres (H1, H2, H3) : *Plus Jakarta Sans* ou *Cabinet Grotesk* (Bold / Semibold).
  - Corps de texte : *Inter* ou *Geist Sans* (Regular / Medium, interlignage 1.5).
  - Chiffres / Prix : *Geist Mono* ou *JetBrains Mono* avec `tabular-nums`.
- **Couleurs :**
  - Fond primaire : `#09090B` (Dark) ou `#FAFAFA` (Light).
  - Accent d'action : `#059669` (Vert émeraude Minerva) avec hover `#047857`.
  - Bordures subtiles : `rgba(0, 0, 0, 0.08)` ou `rgba(255, 255, 255, 0.1)`.

---

## 4. Connexion du Formulaire Framer aux Webhooks Minerva

Pour que chaque soumission de formulaire atterrisse directement dans le CRM Minerva (`/clients/[id]/roi-tracker` et `/chat`) :

### Étape 1 : Créer le Formulaire dans Framer
- Utilisez le composant natif **Form** de Framer.
- Définissez la méthode sur `POST`.
- URL de soumission cible :
```
https://app.minerva.agency/api/webhooks/roi-event
```

### Étape 2 : Champs Requis dans le Payload
Configurez les noms des champs (Field Names) exactement comme suit :
- `clientId` : UUID du client dans Minerva (champ caché ou fixé en paramètre).
- `name` : Nom complet du prospect.
- `email` : Adresse courriel.
- `phone` : Numéro de téléphone.
- `channel` : Canal source (`framer_website` ou `qr_menu`).
- `value` : Valeur estimée de conversion ($ CAD).

### Étape 3 : Test de Réception
Effectuez une soumission test en direct et vérifiez dans le dashboard client que le lead apparaît instantanément avec son attribution de revenus ROI.

---

## 5. Checklist de Mise en Ligne (Go-Live)

- [ ] **Favicon & OpenGraph** : Favicon 32x32px et image OpenGraph 1200x630px configurés.
- [ ] **SEO Local Québec** : Balises Meta Title (`Nom Restaurant — Menu & Réservation en Ligne | Montréal`) et Description uniques.
- [ ] **Responsive Mobile** : Test minutieux sur viewport 375px (iPhone) et 414px (Android).
- [ ] **Nom de Domaine Personnalisé** : Enregistrement DNS `A` (`52.223.52.2`) et `CNAME` (`sites.framer.app`) validés avec certificat SSL vert.
- [ ] **Lien Minerva** : Mention discrète dans le footer : *« Conçu & Optimisé par Minerva Agency »*.
