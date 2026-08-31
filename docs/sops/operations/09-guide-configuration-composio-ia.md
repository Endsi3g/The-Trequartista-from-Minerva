# SOP-AI-04 — Guide Pratique : Configurer & Connecter ses Outils avec Composio et l'Assistant IA

**Dernière mise à jour :** 31 août 2026  
**Audience :** Toute l'équipe Minerva (Prospection, Managing, Tech)  
**Objectif :** Guider chaque collaborateur pas-à-pas pour créer et lier ses comptes d'entreprise (Gmail, Calendar, Notion, GitHub, Stripe) à Composio et permettre à l'Assistant IA d'automatiser les tâches quotidiennes.

---

## 1. Pourquoi Connecter ses Outils à Composio ?

Composio agit comme la passerelle sécurisée entre l'Intelligence Artificielle de Minerva et vos outils quotidiens :
- **Recherche & Lecture Automatique** : L'IA peut résumer les derniers échanges emails d'un prospect, trouver une note Notion ou extraire un rapport.
- **Actions en 1 Clic** : Créer automatiquement un rendez-vous dans Google Calendar, déclencher un webhook ou préparer un brouillon de devis.
- **Pont MCP Universel** : Connexion instantanée via le hub [https://connect.composio.dev/mcp](https://connect.composio.dev/mcp).

---

## 2. Procédure de Configuration en 3 Étapes (5 minutes)

### Étape 1 : Créer & Rejoindre son Espace Composio
1. Rendez-vous sur le tableau de bord Composio : [https://app.composio.dev](https://app.composio.dev) ou [https://connect.composio.dev/mcp](https://connect.composio.dev/mcp).
2. Connectez-vous avec votre adresse email professionnelle `@minerva.agency` (ou Google Workspace).
3. Rendez-vous dans **Settings** -> **API Keys** pour vérifier que votre clé est active.

### Étape 2 : Connecter ses Outils Clés
Depuis la page **Intégrations & Webhooks** (`/integrations`) dans Minerva Trequartista ou directement sur Composio :
- **📧 Gmail** : Cliquez sur *Connecter* pour autoriser la lecture des emails de prospection et l'envoi de confirmations.
- **📅 Google Calendar** : Autorisez l'accès pour permettre à l'agent IA de planifier les rendez-vous clients sans conflit.
- **📝 Notion** : Connectez l'espace de travail d'agence pour synchroniser automatiquement les SOPs et notes de cadrage.
- **🐙 GitHub** *(Pour l'équipe Tech)* : Autorisez la lecture des dépôts et la création d'issues/pull requests.
- **💳 Stripe** : Permet la vérification automatique des paiements d'acomptes de devis (50%).

### Étape 3 : Utiliser l'IA pour Piloter ses Outils
Une fois vos comptes liés, vous pouvez solliciter l'Assistant IA (dans `/chat` ou via l'Assistant d'aide en bas d'écran) :
- *« Peux-tu vérifier si le client Le Petit Bistro a répondu à notre dernier devis ? »*
- *« Planifie un point de cadrage vendredi à 14h avec l'équipe design. »*
- *« Résume-moi les dernières notes de réunion enregistrées dans Granola. »*

---

## 3. Sécurité & Respect de la Confidentialité
- Les jetons OAuth sont chiffrés de bout en bout par Composio.
- Aucun mot de passe n'est stocké en clair.
- Chaque membre d'équipe peut révoquer un accès à tout moment depuis la console `/integrations` ou [https://app.composio.dev/settings](https://app.composio.dev/settings).
