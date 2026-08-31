# SOP-OPS-05 : Procédure Support Client, QA & Gestion des Tickets

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
| 🟢 **P2 — Mineur** | Ajustement cosmétique, demande d'amélioration, typo | **< 24 heures** | **Sprint suivant** |

---

## 2. Processus de Traitement d'un Ticket

1. **Réception & Qualification** : Vérifier la reproductibilité du bug et assigner le niveau de priorité (P0/P1/P2) dans le tableau de tâches (`/tasks`).
2. **Investigation & Reproduction** : Consigner les étapes exactes pour reproduire le bug (navigateur, OS, URL, compte client).
3. **Résolution ou Escalade** : Si le bug touche au code source ou à la base de données, assigner au fondateur avec les logs.
4. **Documentation** : Enrichir la base de connaissances interne ou les SOPs si le bug révèle un cas d'usage récurrent.

---

## 3. Protocole de QA Avant Release

Avant toute mise en production d'une fonctionnalité dans Minerva Trequartista, Flow ou Reach :
- [ ] Exécuter `npx tsc --noEmit` pour garantir zéro erreur de typage.
- [ ] Exécuter les tests E2E `npx playwright test`.
- [ ] Vérifier la bonne dégradation gracieuse en cas d'absence de variable d'environnement tierce.
- [ ] Valider l'affichage sur mobile et desktop.
