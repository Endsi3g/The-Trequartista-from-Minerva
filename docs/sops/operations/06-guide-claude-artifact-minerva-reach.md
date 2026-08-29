# SOP-OPS-06 : Guide Obligatoire — Connexion Artifact Claude Code & Manuel Minerva Reach

**Catégorie :** Outils & Systèmes  
**Public cible :** Développeurs, Ingénieurs IA, Prospecteurs, Account Managers  
**Temps de lecture :** 20 minutes  
**Auteur :** Équipe Technique & Commerciale Minerva  
**Artifact de Référence :** `https://claude.ai/code/artifact/993306aa-cd3e-49ea-8b12-ce27d5d03581`  

---

## 🎯 Vue d'Ensemble

Ce guide obligatoire détaille le protocole pas-à-pas pour :
1. **Lier votre environnement Claude Code / Claude Desktop** à l'artifact officiel Minerva (`https://claude.ai/code/artifact/993306aa-cd3e-49ea-8b12-ce27d5d03581`) et à notre serveur MCP de production.
2. **Maîtriser l'application Minerva Reach**, notre logiciel propriétaire de prospection commerciale automatisée pour le marché québécois.

---

##  PARTIE 1 : Connexion à l'Artifact Claude Code & Serveur MCP

### 1.1 Prérequis Techniques
- Un compte Claude (Pro, Team ou Enterprise).
- Le CLI Claude Code installé sur votre machine locale :
  ```bash
  npm install -g @anthropic-ai/claude-code
  claude doctor
  ```
- Votre token d'accès au serveur MCP Minerva (`MCP_SERVER_TOKEN`).

---

### 1.2 Importation & Liaison de l'Artifact Claude Code

L'artifact officiel d'instructions Minerva est accessible à l'URL suivante :  
🔗 **[https://claude.ai/code/artifact/993306aa-cd3e-49ea-8b12-ce27d5d03581](https://claude.ai/code/artifact/993306aa-cd3e-49ea-8b12-ce27d5d03581)**

#### Protocole d'Activation :
1. **Ouvrir l'URL de l'artifact dans votre navigateur connecté à Claude.ai**.
2. **Cliquer sur « Use in Claude Code » ou copier l'identifiant d'artifact** : `993306aa-cd3e-49ea-8b12-ce27d5d03581`.
3. **Dans votre terminal local (racine du projet)**, initialiser la session avec les instructions de l'artifact :
   ```bash
   # Lancer Claude Code avec référence à l'artifact
   claude --init
   ```
4. **Vérifier la présence du fichier de contexte `CLAUDE.md`** à la racine du dépôt.

---

### 1.3 Configuration de la Passerelle MCP Minerva (`.mcp.json`)

Pour permettre à Claude Code ou Claude Desktop d'intéragir avec la base de données de production Supabase en temps réel, configurez votre fichier `.mcp.json` (ou la configuration Claude Desktop) :

```json
{
  "mcpServers": {
    "minerva-mcp": {
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
```

#### Test de Validation de la Connexion :
Dans une session Claude Code ou Antigravity, tapez :
> *« Appelle l'outil `minerva_get_kpi` et donne-moi le MRR actuel et la valeur du pipeline. »*

L'agent doit répondre avec les vrais chiffres extraits de la table `clients` et `leads` sans inventer de données.

---

## 📡 PARTIE 2 : Manuel Complet de Minerva Reach (App de Prospection)

### 2.1 Qu'est-ce que Minerva Reach ?
**Minerva Reach** est notre solution logicielle de prospection automatisée spécialisée pour le marché du Grand Montréal et du Québec. Elle permet d'exécuter l'intégralité du cycle commercial (trouver, qualifier, contacter, booker) dans une seule application.

```
┌─────────────────────────────────────────────────────────────┐
│                   CYCLE COMMERCIAL REACH                    │
│                                                             │
│  [1. Prospection Google Maps] ──► [2. Qualification Leads]  │
│        (Recherche par niche)           (Fiche & Score CRM)  │
│                                                 │           │
│                                                 ▼           │
│  [4. Meeting & Démo Flow]    ◄──  [3. Séquence Outreach]    │
│        (Transfert Fondateur)           (5 Touches Gmail)    │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Les 3 Fonctionnalités Clés à Maîtriser

#### 1. Onglet « Prospection » (Recherche Ciblée)
- **Objectif** : Générer une liste de prospects qualifiés en temps réel.
- **Utilisation** :
  1. Choisir la niche cible (ex: *Cafés de spécialité*, *Restaurants italiens*, *Bistros locaux*).
  2. Sélectionner la zone géographique (ex: *Plateau-Mont-Royal*, *Mile End*, *Vieux-Montréal*, *Laval*).
  3. Lancer l'extraction : Reach récupère nom, téléphone, adresse, site web, note Google Maps et volume d'avis.

#### 2. Onglet « Leads » (Gestion du Pipeline CRM)
- **Objectif** : Piloter les opportunités commerciales de l'agence.
- **Statuts** : `Nouveau` → `Contacté` → `RDV Fixé` → `Gagné` (ou `Perdu`).
- **Règle d'or** : Mettre à jour la fiche lead immédiatement après chaque appel ou email envoyé.

#### 3. Onglet « Outreach » (Séquences de Contact)
- **Objectif** : Envoyer la séquence de vente en 5 touches.
- **Connexion** : Connexion compte Gmail requise.
- **Cadence recommandée** :
  - **J0** : Cold Email court + Appel téléphonique 30s.
  - **J+2** : Relance valeur avec simulation de menu.
  - **J+4** : Partage d'une étude de cas restaurant similaire.
  - **J+7** : Dernière relance amicale (Break-up email).

---

### 2.3 Fonctionnalités Secondaires Utiles
- **🗺️ Carte Intelligente** : Visualisation cartographique des établissements cibles pour planifier des tournées terrain à Montréal.
- **💬 Chat Interne** : Messagerie directe d'équipe pour échanger des vocaux, photos et notes de visite terrain.
- **🔄 Récupération** : Sauvegarde et synchronisation des données en cas de coupure réseau.

---

### 2.4 Installation Mobile (PWA) & Notifications

Minerva Reach est optimisée en **Progressive Web App (PWA)** :

#### Sur iPhone (Safari) :
1. Ouvrir l'URL de Minerva Reach dans Safari.
2. Cliquer sur l'icône de partage (carré avec flèche vers le haut).
3. Sélectionner **« Sur l'écran d'accueil »** (`Add to Home Screen`).
4. Ouvrir l'application depuis l'icône et accepter les **notifications push**.

#### Sur Android (Chrome) :
1. Ouvrir l'URL dans Chrome.
2. Cliquer sur les trois points verticaux en haut à droite.
3. Sélectionner **« Installer l'application »**.
4. Autoriser les notifications pour recevoir les alertes de nouveaux leads et réponses.

---

### 2.5 Ce qu'il faut ignorer pour l'instant

- **Agent IA autonome Reach** : En cours de fiabilisation, à ne pas utiliser pour les contacts directs clients.
- **Audits SEO automatiques externes** : Utiliser plutôt le module interne d'audits de Minerva Trequartista (`/audits`).
