# SOP-DEV-01 — Guide Pratique : Maîtriser GitHub & le Flux de Travail Git chez Minerva

**Dernière mise à jour :** 31 août 2026  
**Audience :** Développeurs, Designers, Ingénieurs IA & Collaborateurs Tech  
**Objectif :** Garantir un cycle de déploiement continu fluide, sans conflits et avec traçabilité complète sur tous les dépôts de l'écosystème Minerva.

---

## 1. Principes Fondamentaux du Workflow Git Minerva

Chez Minerva, nous utilisons une variante optimisée du **Trunk-Based / Feature-Branch Flow** :
- La branche `main` est toujours déployable en production sur Vercel.
- Tout nouveau développement ou chantier d'envergure passe par une branche dédiée au format :
  - `feat/nom-de-fonctionnalite` (ex: `feat/proposals-builder`)
  - `fix/nom-du-bug` (ex: `fix/chat-mentions-routing`)
  - `chantierX-nom-du-chantier` (ex: `chantier6-help-chatbot`)
- **Règle absolue :** Aucun commit direct sur `main` sans validation préalable de compilation TypeScript (`npx tsc --noEmit`).

---

## 2. Cycle de Travail Quotidien Étape par Étape

### Étape 1 : Synchronisation & Création de Branche
Avant de commencer à coder, assurez-vous d'avoir le code le plus récent :
```bash
# 1. Revenir sur la branche principale et récupérer les derniers commits
git checkout main
git pull origin main

# 2. Créer et basculer sur une nouvelle branche propre
git checkout -b feat/ma-nouvelle-feature
```

### Étape 2 : Développement & Bonnes Pratiques
- Lancez le serveur local en mode développement :
```bash
npm run dev
# ou pnpm dev
```
- Effectuez des commits atomiques et réguliers (une modification logique par commit).

### Étape 3 : Convention de Messages de Commit (Conventional Commits)
Respectez impérativement le format standard :
- `feat(module): description courte` pour un ajout de fonctionnalité
- `fix(module): description du correctif` pour la résolution d'un bug
- `refactor(module): description` pour une restructuration sans changement de comportement
- `docs(module): description` pour une mise à jour documentaire ou SOP
- `style(module): description` pour un ajustement visuel / CSS

**Exemple :**
```bash
git commit -m "feat(chat): implement @all team mentions and instant native alerts"
```

### Étape 4 : Validation Statique Pré-Commit Obligatoire
Avant tout push vers le dépôt distant, lancez toujours la vérification statique :
```bash
npx tsc --noEmit
```
Si des erreurs TypeScript apparaissent, corrigez-les immédiatement. Ne pushez jamais un code cassé.

### Étape 5 : Push & Publication
```bash
git push -u origin feat/ma-nouvelle-feature
```

---

## 3. Gestion des Conflits de Fusion (Merge Conflicts)

Si un collègue a poussé des changements sur `main` pendant votre développement :
```bash
# 1. Récupérer les derniers commits de main
git fetch origin main

# 2. Rebaser votre branche sur main
git rebase origin/main

# 3. Si conflit : ouvrir les fichiers en conflit, résoudre, puis :
git add .
git rebase --continue

# 4. Pousser avec force sécurisée
git push --force-with-lease origin feat/ma-nouvelle-feature
```

---

## 4. Checklist Avant Mise en Production

- [ ] `npx tsc --noEmit` passe avec 0 erreur.
- [ ] Le fichier `CHANGELOG.md` est mis à jour avec la date, le numéro de version et les puces récapitulatives.
- [ ] Aucun secret ou clé d'API brute n'est commitée (vérification `.gitignore`).
- [ ] Les variables d'environnement nécessaires sont documentées dans `.env.example`.
