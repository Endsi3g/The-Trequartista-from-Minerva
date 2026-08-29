# SOP-IA-04 : Minerva MCP Server & Tool Augmentation

**Catégorie :** IA & Ingénierie  
**Public cible :** Développeurs Backend & Fullstack, Architectes IA  
**Temps de lecture :** 20 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Fondations du Model Context Protocol (MCP v2)

Le **Model Context Protocol (MCP)** est un standard ouvert permettant d'exposer des données, du contexte et des outils à des agents IA via un protocole universel JSON-RPC 2.0.

```
┌─────────────────────────────────────────────────────────────┐
│                       MCP ARCHITECTURE                      │
│                                                             │
│  ┌──────────────────┐    JSON-RPC 2.0    ┌────────────────┐ │
│  │   MCP Client     │◄──────────────────►│   MCP Server   │ │
│  │ (Claude/Hermes/  │   (Bearer Auth     │  (Next.js App  │ │
│  │   Antigravity)   │    over HTTP/SSE)  │  /api/mcp)     │ │
│  └──────────────────┘                    └───────┬────────┘ │
│                                                  │          │
│                                                  ▼          │
│                                           ┌───────────────┐ │
│                                           │  Supabase DB  │ │
│                                           │ (Real Data)   │ │
│                                           └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Minerva implémente **MCP v2** via le package `@modelcontextprotocol/server` et `mcp-handler`. Ne confondez pas avec l'ancien SDK monolithique v1 (`@modelcontextprotocol/sdk`).

---

## 2. Architecture du Serveur MCP de Minerva

Le serveur MCP de l'application est implémenté dans le route handler Next.js :  
📂 [`app/api/mcp/route.ts`](file:///c:/Users/upris/Trequista/The-Trequartista-from-Minerva/app/api/mcp/route.ts)

### Caractéristiques Techniques :
- **Transport** : HTTP POST / Server-Sent Events (SSE) compatible avec les clients MCP modernes.
- **Sécurité à temps constant** : Vérification des Bearer tokens via `timingSafeEqual` pour neutraliser les attaques par analyse temporelle.
- **Isolation des clients** : Tokens dédiés pour Claude (`MCP_SERVER_TOKEN`) et Hermes Agent (`MCP_HERMES_TOKEN`).
- **Rate-Limiting** : Protection contre le déni de service (60 requêtes/minute par IP via `lib/rate-limit.ts`).
- **Audit Trail** : Chaque appel d'outil écrit une ligne dans la table `audit_logs` avec l'identifiant du client appelant.

---

## 3. Les Outils Disponibles en Production

| Outil MCP | Description | Données retournées |
| :--- | :--- | :--- |
| `minerva_get_leads` | Liste les prospects du pipeline CRM avec filtres par statut et service | Table `leads` (Nom, Valeur estimée, Statut, Score) |
| `minerva_get_kpi` | Fournit les métriques financières et opérationnelles réelles de l'agence | `mrr_total`, `pipeline_value_total`, `active_clients_count` |
| `minerva_list_sops` | Recherche et liste les procédures opérationnelles de l'Académie | Table `academy_sops` (Titre, Catégorie, Résumé) |
| `minerva_get_clients` | Liste les clients actifs, en pause ou archivés avec leur MRR | Table `clients` (Nom, MRR, Formule, Date de début) |
| `minerva_get_projects`| Récupère les projets et roadmaps en cours | Table `projects` (Titre, Échéance, Progression) |

> [!WARNING]
> Respect strict de la règle **Real Data Only** : `minerva_get_kpi` n'expose que des données réelles calculées depuis PostgreSQL. Aucun faux chiffre (ex: ROAS/CPL inventé) n'est injecté.

---

## 4. Configuration d'un Client MCP

### Configuration pour Claude Desktop ou Claude Code (`.mcp.json`) :
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
```

### Test Manuel d'Appel via cURL :
```bash
curl -X POST https://trequartista.minerva-agency.ca/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_SERVER_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "minerva_get_kpi",
      "arguments": {}
    }
  }'
```

---

## 5. Guide Pas-à-Pas : Créer un Nouvel Outil MCP

Pour exposer une nouvelle capacité (ex: `minerva_get_tasks` pour récupérer les tâches en retard) :

### 1. Déclarer le schéma de l'outil dans `app/api/mcp/route.ts`
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... outils existants
      {
        name: 'minerva_get_overdue_tasks',
        description: 'Récupère la liste des tâches actuellement en retard avec le membre assigné.',
        inputSchema: {
          type: 'object',
          properties: {
            assigned_to: {
              type: 'string',
              description: 'ID optionnel du membre assigné'
            }
          }
        }
      }
    ]
  };
});
```

### 2. Implémenter l'exécution dans le handler `CallToolRequestSchema`
```typescript
if (request.params.name === 'minerva_get_overdue_tasks') {
  let query = supabaseAdmin
    .from('tasks')
    .select('id, title, due_date, assigned_to_name, priority')
    .lt('due_date', new Date().toISOString())
    .neq('status', 'Done');

  if (request.params.arguments?.assigned_to) {
    query = query.eq('assigned_to', request.params.arguments.assigned_to);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  };
}
```

### 3. Valider avec `npx tsc --noEmit` et tester l'appel.
