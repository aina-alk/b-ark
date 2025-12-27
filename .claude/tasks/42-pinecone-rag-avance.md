# Task 42: Pinecone RAG Avancé - Recherche Sémantique Vectorielle

> **Durée estimée** : 2-3h
> **Phase** : Integration Avancée
> **Feature PRD** : US-008 à US-012 (Suggestions IA contextuelles)

## Contexte

Cette tâche implémente la recherche sémantique vectorielle via Pinecone pour améliorer le RAG (Retrieval-Augmented Generation). Les embeddings générés par OpenAI permettent des suggestions contextuelles précises basées sur la similarité sémantique plutôt que la recherche textuelle simple.

## Objectif

1. **Configurer Pinecone** (index, namespaces, dimensions)
2. **Ajouter les champs embedding** aux tables knowledge base existantes
3. **Créer les fonctions Xano** pour génération et recherche d'embeddings
4. **Implémenter les endpoints RAG** de recherche sémantique
5. **Synchroniser les données seed** avec Pinecone

## Scope

### Inclus ✅

- Configuration index Pinecone (`b-ark-knowledge-base`)
- Champs embedding sur les 4 tables RAG
- Fonctions Xano : `generate_embedding`, `upsert_to_pinecone`, `search_pinecone`
- Endpoints RAG : `/rag/search`, `/rag/medicaments/suggest`, `/rag/protocoles/find`
- Synchronisation des données seed existantes
- Tests de recherche sémantique

### Exclus ❌

- Fine-tuning des embeddings
- Recherche hybride (vectorielle + textuelle)
- Cache Redis pour embeddings fréquents (post-MVP)

---

## Implémentation

### Étape 1 : Configuration Pinecone

#### 1.1 Création de l'index Pinecone

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Index name | `b-ark-knowledge-base` | Nom de l'index principal |
| Dimensions | `1536` | OpenAI text-embedding-3-small |
| Metric | `cosine` | Similarité cosinus |
| Cloud | `aws` | Provider cloud |
| Region | `eu-west-1` | Région Europe |

#### 1.2 Namespaces Pinecone

| Namespace | Table source | Description |
|-----------|--------------|-------------|
| `medicaments` | medicament | Médicaments ORL |
| `protocoles` | protocole_sforl | Protocoles SFORL |
| `templates-cr` | template_cr | Templates CR |
| `templates-ordonnance` | template_ordonnance | Templates ordonnance |

#### 1.3 Structure des métadonnées Pinecone

```json
{
  "id": "medicament_123",
  "values": [0.123, 0.456, "...1536 dimensions..."],
  "metadata": {
    "table": "medicament",
    "record_id": 123,
    "nom": "Amoxicilline",
    "classe": "Antibiotique",
    "type": "medicament"
  }
}
```

#### 1.4 Variables d'environnement Xano

| Variable | Description |
|----------|-------------|
| `PINECONE_API_KEY` | Clé API Pinecone |
| `PINECONE_INDEX` | Nom de l'index (`b-ark-knowledge-base`) |
| `PINECONE_ENVIRONMENT` | Environnement Pinecone |
| `OPENAI_API_KEY` | Clé API OpenAI (pour embeddings) |

---

### Étape 2 : Champs Embedding sur les Tables

Ajouter ces 3 champs à chaque table RAG (`medicament`, `protocole_sforl`, `template_cr`, `template_ordonnance`) :

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `embedding_text` | Text | Nullable | Texte concaténé pour embedding |
| `pinecone_id` | Text | Nullable | ID du vecteur dans Pinecone |
| `embedding_updated_at` | Timestamp | Nullable | Dernière synchro embedding |

#### Formats embedding_text par table

**medicament :**

```text
{nom} ({dci}) - {classe}. Forme: {forme}.
Posologie adulte: {posologie_adulte}.
Posologie enfant: {posologie_enfant}.
Contre-indications: {contre_indications}.
Interactions: {interactions}.
Précautions: {precautions}.
```

**protocole_sforl :**

```text
Protocole SFORL: {titre}
Pathologie: {pathologie}
Mots-clés: {keywords}
Résumé: {resume}
Contenu: {contenu}
```

**template_cr :**

```text
Template CR: {name}
Type: {type}
Intervention: {intervention_type}
Sections: {sections.map(s => s.label).join(', ')}
Exemple: {example}
```

**template_ordonnance :**

```text
Template Ordonnance: {name}
Pathologie: {pathologie}
Type d'acte: {type_acte}
Médicaments: {medicaments.map(m => m.nom + ' - ' + m.posologie).join(', ')}
Consignes: {consignes}
```

---

### Étape 3 : Fonctions Xano pour RAG

#### 3.1 Fonction `generate_embedding`

```xanoscript
// Génère un embedding via OpenAI
input:
  - text: text (required)

// Appel API OpenAI
external_api_request:
  url: "https://api.openai.com/v1/embeddings"
  method: POST
  headers:
    Authorization: "Bearer $OPENAI_API_KEY"
    Content-Type: "application/json"
  body:
    model: "text-embedding-3-small"
    input: $text

return $response.data[0].embedding
```

#### 3.2 Fonction `upsert_to_pinecone`

```xanoscript
// Insère ou met à jour un vecteur dans Pinecone
input:
  - id: text (required)
  - embedding: array (required)
  - metadata: object (required)
  - namespace: text (required)

external_api_request:
  url: "https://$PINECONE_INDEX.svc.$PINECONE_ENVIRONMENT.pinecone.io/vectors/upsert"
  method: POST
  headers:
    Api-Key: "$PINECONE_API_KEY"
    Content-Type: "application/json"
  body:
    namespace: $namespace
    vectors:
      - id: $id
        values: $embedding
        metadata: $metadata
```

#### 3.3 Fonction `search_pinecone`

```xanoscript
// Recherche sémantique dans Pinecone
input:
  - query_text: text (required)
  - namespace: text (required)
  - top_k: integer (default: 5)
  - filter: object (optional)

// Générer embedding de la requête
embedding = generate_embedding($query_text)

external_api_request:
  url: "https://$PINECONE_INDEX.svc.$PINECONE_ENVIRONMENT.pinecone.io/query"
  method: POST
  headers:
    Api-Key: "$PINECONE_API_KEY"
  body:
    namespace: $namespace
    topK: $top_k
    includeMetadata: true
    vector: $embedding
    filter: $filter

return $response.matches
```

#### 3.4 Fonction `sync_record_embedding`

```xanoscript
// Synchronise un enregistrement avec Pinecone
input:
  - table_name: text (required)
  - record_id: integer (required)

// Récupérer l'enregistrement
record = get_record($table_name, $record_id)

// Générer embedding_text selon la table
embedding_text = build_embedding_text($table_name, $record)

// Générer embedding
embedding = generate_embedding($embedding_text)

// Créer ID Pinecone
pinecone_id = $table_name + "_" + $record_id

// Upsert dans Pinecone
upsert_to_pinecone(
  id: $pinecone_id,
  embedding: $embedding,
  metadata: {table: $table_name, record_id: $record_id, ...},
  namespace: get_namespace($table_name)
)

// Mettre à jour l'enregistrement
update_record($table_name, $record_id, {
  embedding_text: $embedding_text,
  pinecone_id: $pinecone_id,
  embedding_updated_at: now()
})
```

---

### Étape 4 : Endpoints RAG

#### 4.1 `POST /rag/search`

Recherche sémantique multi-namespace.

```xanoscript
input:
  - query: text (required)
  - namespaces: array of text (default: all)
  - top_k: integer (default: 5)
  - filters: object (optional)

// Rechercher dans chaque namespace
results = []
foreach namespace in $namespaces:
  matches = search_pinecone($query, $namespace, $top_k, $filters)
  results.push(...matches)

// Trier par score
results.sort(by: score, order: desc)

// Enrichir avec données complètes
enriched = []
foreach match in results.slice(0, $top_k):
  record = get_record(match.metadata.table, match.metadata.record_id)
  enriched.push({
    score: match.score,
    type: match.metadata.table,
    data: record
  })

return enriched
```

#### 4.2 `POST /rag/medicaments/suggest`

Suggestion de médicaments par contexte clinique.

```xanoscript
input:
  - contexte_clinique: text (required)
  - pathologie: text (optional)
  - allergies: array (optional)
  - top_k: integer (default: 3)

// Recherche sémantique
matches = search_pinecone(
  query: $contexte_clinique,
  namespace: "medicaments",
  top_k: $top_k * 2
)

// Filtrer les allergies
filtered = filter_allergies($matches, $allergies)

// Enrichir et retourner
return enrich_medicaments(filtered.slice(0, $top_k))
```

#### 4.3 `POST /rag/protocoles/find`

Trouver les protocoles SFORL pertinents.

```xanoscript
input:
  - symptomes: text (required)
  - pathologie: text (optional)
  - top_k: integer (default: 3)

matches = search_pinecone(
  query: $symptomes + " " + $pathologie,
  namespace: "protocoles",
  top_k: $top_k
)

return enrich_protocoles($matches)
```

---

### Étape 5 : Synchronisation initiale

Script de synchronisation des données seed existantes avec Pinecone :

```xanoscript
// Sync all tables
tables = ["medicament", "protocole_sforl", "template_cr", "template_ordonnance"]

foreach table in tables:
  records = query_all_records($table)
  foreach record in records:
    sync_record_embedding($table, record.id)
    // Pause pour éviter rate limiting OpenAI
    sleep(100ms)
```

---

## Critères de succès

### Configuration

- [ ] Compte Pinecone créé (plan Starter gratuit)
- [ ] Index `b-ark-knowledge-base` créé avec 1536 dimensions
- [ ] 4 namespaces configurés
- [ ] Variables d'environnement Xano configurées

### Tables

- [ ] Champs embedding ajoutés aux 4 tables RAG
- [ ] Index sur `pinecone_id` pour chaque table

### Fonctions

- [ ] `generate_embedding` fonctionnelle
- [ ] `upsert_to_pinecone` fonctionnelle
- [ ] `search_pinecone` fonctionnelle
- [ ] `sync_record_embedding` fonctionnelle

### Endpoints

- [ ] `POST /rag/search` - Recherche multi-namespace
- [ ] `POST /rag/medicaments/suggest` - Suggestions avec filtrage allergies
- [ ] `POST /rag/protocoles/find` - Recherche par symptômes

### Synchronisation

- [ ] Données seed synchronisées avec Pinecone
- [ ] Embeddings générés pour tous les enregistrements existants

---

## Tests & Validation

### Tests de recherche sémantique

1. **Recherche médicament par symptôme**
   - Input : "antibiotique pour angine bactérienne"
   - Résultat attendu : Amoxicilline, Augmentin en top résultats (score > 0.8)

2. **Suggestion avec allergies**
   - Input : contexte "angine", allergies ["pénicillines"]
   - Résultat attendu : Médicaments alternatifs (macrolides) sans pénicillines

3. **Recherche protocole SFORL**
   - Input : "otite moyenne aiguë enfant"
   - Résultat attendu : Protocole OMA pédiatrique avec traitement recommandé

4. **Recherche multi-namespace**
   - Input : "rhinosinusite chronique"
   - Résultat attendu : Mix protocoles + templates CR + médicaments pertinents

5. **Recherche template ordonnance**
   - Input : "post-amygdalectomie douleur"
   - Résultat attendu : Template ordonnance post-op avec antalgiques

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 04-xano-tables-rag | Tables knowledge base avec données seed |
| 32-33-rag-medicaments | RAG basique fonctionnel |

### Améliore

| Feature | Description |
|---------|-------------|
| Suggestions IA | Suggestions contextuelles plus précises |
| Recherche médicaments | Recherche sémantique vs textuelle |
| Protocoles SFORL | Recherche par symptômes |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Coûts OpenAI Embeddings** : ~$0.02 pour 1M tokens, budget à prévoir
- **Latence Pinecone** : Recherche ~50-100ms, acceptable pour suggestions
- **Rate limiting OpenAI** : Max 3000 RPM, pauses nécessaires pour sync bulk
- **Traçabilité** : Chaque suggestion RAG inclut le score et la source

### 💡 Suggestions

- Batch les upserts Pinecone (max 100 vecteurs par requête)
- Implémenter un trigger "after_update" pour resync auto des embeddings
- Prévoir cache Redis pour embeddings de requêtes fréquentes (post-MVP)

### 🔧 Configuration Pinecone recommandée

```text
Plan: Starter (gratuit jusqu'à 100K vecteurs)
Index: b-ark-knowledge-base
Dimensions: 1536 (text-embedding-3-small)
Metric: cosine
Cloud: AWS
Region: eu-west-1
```

### 📋 Actions prioritaires

1. **Créer compte Pinecone** sur pinecone.io
2. **Créer l'index** via console Pinecone
3. **Configurer variables** dans Xano
4. **Ajouter champs embedding** aux 4 tables
5. **Créer les fonctions** Xano
6. **Créer les endpoints** RAG
7. **Synchroniser** les données existantes
8. **Tester** la recherche sémantique

---

## 📡 Endpoints API à créer (non présents dans swagger actuel)

### RAG Endpoints (à créer dans Xano)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/rag/search` | POST | Recherche sémantique multi-namespace |
| `/rag/medicaments/suggest` | POST | Suggestions médicaments par contexte |
| `/rag/protocoles/find` | POST | Recherche protocoles SFORL |

### Services externes

| Service | Endpoint | Description |
|---------|----------|-------------|
| OpenAI | `/v1/embeddings` | Génération embeddings |
| Pinecone | `/vectors/upsert` | Insertion vecteurs |
| Pinecone | `/query` | Recherche vectorielle |
