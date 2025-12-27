# Task 04: Xano - Tables RAG (Knowledge Base)

> **Durée estimée** : 1h  
> **Phase** : Foundation  
> **Feature PRD** : US-008 à US-012 (Ordonnances avec médicaments et protocoles)

## Contexte

Ces tables constituent la "knowledge base" de l'application : médicaments ORL avec posologies, protocoles SFORL, et templates de documents (CR et ordonnances). Elles permettent le RAG (Retrieval-Augmented Generation) pour des suggestions fiables et traçables.

## Objectif

Créer les tables `medicament`, `protocole_sforl`, `template_cr` et `template_ordonnance` avec leurs endpoints API.

## Scope

### Inclus ✅
- Table `medicament` (base 30 médicaments ORL MVP)
- Table `protocole_sforl` (protocoles/guidelines SFORL - usage interne RAG)
- Table `template_cr` (templates CR consultation/opératoire)
- Table `template_ordonnance` (templates ordonnances par pathologie)
- Quelques données seed pour MVP
- Endpoint de vérification des interactions médicamenteuses

### Exclus ❌
- Embeddings vectoriels (Pinecone sera intégré plus tard)
- Base Vidal complète (post-MVP)
- Import automatique protocoles SFORL

---

## Implémentation

### Étape 1 : Table `medicament`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `nom` | Text | Required | Nom commercial |
| `dci` | Text | Required | Dénomination Commune Internationale |
| `classe` | Text | Required | Classe thérapeutique |
| `forme` | Text | Nullable | Forme galénique (comprimé, sirop, etc.) |
| `posologie_adulte` | Text | Nullable | Posologie adulte standard |
| `posologie_enfant` | Text | Nullable | Posologie pédiatrique |
| `contre_indications` | Array of Text | Default: [] | Liste contre-indications |
| `interactions` | Array of Text | Default: [] | Interactions médicamenteuses |
| `precautions` | Text | Nullable | Précautions d'emploi |
| `orl_specific` | Boolean | Default: true | Médicament spécifique ORL |
| `source` | Text | Nullable | Source (Vidal, RCP, etc.) |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Index :**
- `nom`
- `dci`
- `classe`
- `orl_specific`

### Étape 2 : Table `protocole_sforl`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `titre` | Text | Required | Titre du protocole |
| `pathologie` | Text | Required | Pathologie concernée |
| `contenu` | Text | Required | Contenu complet |
| `resume` | Text | Nullable | Résumé court |
| `keywords` | Array of Text | Default: [] | Mots-clés pour recherche |
| `source_url` | Text | Nullable | URL source SFORL |
| `annee_publication` | Integer | Nullable | Année de publication |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Index :**
- `pathologie`
- `keywords` (si supporté par Xano)

**Note :** Cette table est utilisée en interne pour le RAG et n'a pas d'endpoint API public.

### Étape 3 : Table `template_cr`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `name` | Text | Required | Nom du template |
| `type` | Enum | Values: ["consultation", "intervention"], Required | Type de CR |
| `intervention_type` | Text | Nullable | Type d'intervention si applicable |
| `sections` | Array of Object | Default: [] | Structure des sections |
| `placeholders` | Array of Text | Default: [] | Variables à remplacer |
| `example` | Text | Nullable | Exemple de CR rempli |
| `is_default` | Boolean | Default: false | Template par défaut |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Structure `sections` :**
```json
[
  {"name": "motif", "label": "Motif de consultation", "required": true},
  {"name": "examen_clinique", "label": "Examen clinique", "required": true},
  {"name": "conclusion", "label": "Conclusion", "required": true},
  {"name": "cat", "label": "Conduite à tenir", "required": true}
]
```

### Étape 4 : Table `template_ordonnance`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `name` | Text | Required | Nom du template |
| `pathologie` | Text | Required | Pathologie cible |
| `type_acte` | Text | Nullable | Consultation ou post-op |
| `medicaments` | Array of Object | Default: [] | Liste médicaments |
| `consignes` | Text | Nullable | Consignes générales |
| `is_default` | Boolean | Default: false | Template par défaut |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Structure `medicaments` :**
```json
[
  {
    "medicament_id": 1,
    "nom": "Amoxicilline 1g",
    "posologie": "1 comprimé matin et soir",
    "duree": "7 jours",
    "si_allergie": "Pristinamycine 500mg"
  }
]
```

### Étape 5 : Données Seed - Médicaments ORL MVP

Insérer les 30 médicaments ORL essentiels :

```json
[
  {
    "nom": "Amoxicilline",
    "dci": "amoxicilline",
    "classe": "Antibiotique - Pénicilline",
    "forme": "Comprimé, Suspension",
    "posologie_adulte": "1g x 2/jour pendant 7 jours",
    "posologie_enfant": "50mg/kg/jour en 2 prises",
    "contre_indications": ["Allergie pénicillines"],
    "interactions": ["Méthotrexate", "Allopurinol"],
    "orl_specific": true
  },
  {
    "nom": "Augmentin",
    "dci": "amoxicilline + acide clavulanique",
    "classe": "Antibiotique - Pénicilline + inhibiteur",
    "forme": "Comprimé, Suspension",
    "posologie_adulte": "1g x 3/jour pendant 7-10 jours",
    "posologie_enfant": "80mg/kg/jour en 3 prises",
    "contre_indications": ["Allergie pénicillines", "Insuffisance hépatique"],
    "interactions": ["Méthotrexate"],
    "orl_specific": true
  },
  {
    "nom": "Solupred",
    "dci": "prednisolone",
    "classe": "Corticoïde",
    "forme": "Comprimé orodispersible",
    "posologie_adulte": "1mg/kg/jour pendant 5-7 jours",
    "posologie_enfant": "1-2mg/kg/jour",
    "contre_indications": ["Infection non contrôlée", "Psychose"],
    "interactions": ["AINS", "Anticoagulants"],
    "orl_specific": true
  },
  {
    "nom": "Doliprane",
    "dci": "paracétamol",
    "classe": "Antalgique palier 1",
    "forme": "Comprimé, Sachet, Suppositoire",
    "posologie_adulte": "1g x 3-4/jour (max 4g/jour)",
    "posologie_enfant": "15mg/kg x 4/jour",
    "contre_indications": ["Insuffisance hépatique sévère"],
    "interactions": ["Anticoagulants oraux"],
    "orl_specific": false
  },
  {
    "nom": "Tramadol",
    "dci": "tramadol",
    "classe": "Antalgique palier 2",
    "forme": "Gélule, Comprimé LP",
    "posologie_adulte": "50-100mg x 3-4/jour (max 400mg/jour)",
    "posologie_enfant": "CI < 15 ans",
    "contre_indications": ["Épilepsie non contrôlée", "IMAO"],
    "interactions": ["ISRS", "Antiépileptiques"],
    "orl_specific": false
  }
]
```

*Ajouter 25 autres médicaments ORL courants : Orelox, Zithromax, Oflocet gouttes, Polydexa, etc.*

### Étape 6 : Données Seed - Templates CR

**Template CR Consultation standard :**
```json
{
  "name": "CR Consultation ORL Standard",
  "type": "consultation",
  "sections": [
    {"name": "motif", "label": "Motif de consultation", "required": true},
    {"name": "antecedents", "label": "Antécédents pertinents", "required": false},
    {"name": "examen_otologique", "label": "Examen otologique", "required": false},
    {"name": "examen_rhinologique", "label": "Examen rhinologique", "required": false},
    {"name": "examen_pharynge", "label": "Examen pharyngé", "required": false},
    {"name": "examens_complementaires", "label": "Examens complémentaires", "required": false},
    {"name": "conclusion", "label": "Conclusion", "required": true},
    {"name": "cat", "label": "Conduite à tenir", "required": true}
  ],
  "is_default": true
}
```

**Template CR Opératoire - Amygdalectomie :**
```json
{
  "name": "CR Opératoire - Amygdalectomie",
  "type": "intervention",
  "intervention_type": "Amygdalectomie",
  "sections": [
    {"name": "indication", "label": "Indication opératoire", "required": true},
    {"name": "installation", "label": "Installation", "required": true},
    {"name": "technique", "label": "Technique opératoire", "required": true},
    {"name": "hemostase", "label": "Hémostase", "required": true},
    {"name": "incidents", "label": "Incidents / Difficultés", "required": false},
    {"name": "suites", "label": "Suites immédiates", "required": true}
  ],
  "is_default": false
}
```

---

## Critères de succès

### Fonctionnels
- [ ] 4 tables créées (medicament, protocole_sforl, template_cr, template_ordonnance)
- [ ] Au moins 10 médicaments seed insérés
- [ ] Au moins 2 templates CR insérés
- [ ] Au moins 2 templates ordonnance insérés
- [ ] Endpoint check-interactions fonctionnel

### Techniques
- [ ] Champs Array et Object fonctionnels
- [ ] Index sur champs de recherche
- [ ] Enums correctement configurés

---

## Tests & Validation

### Tests manuels

1. **Rechercher un médicament via `/medicaments/search?q=amox`**
   - Résultat attendu : Médicaments contenant "amox" retournés

2. **Filtrer par classe via `/medicaments/search?classe=Antibiotique`**
   - Résultat attendu : Médicaments de la classe Antibiotique

3. **Récupérer un template CR par type via `/templates/cr/by-type/consultation`**
   - Résultat attendu : Templates de type consultation avec sections structurées

4. **Récupérer templates ordonnance par pathologie via `/templates/ordonnance/by-pathologie/otite`**
   - Résultat attendu : Templates pour otite

5. **Vérifier les interactions via `/medicaments/check-interactions`**
   - Body : `{"medicament_ids": [1, 2], "patient_allergies": ["Pénicilline"]}`
   - Résultat attendu : `{interactions: [...], safe: true/false}`

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 01-setup-nextjs | Projet existant pour specs |

### Bloque

| Task | Raison |
|------|--------|
| 07-xano-endpoints | Endpoints recherche médicaments |
| 27-documents-ordonnances | Utilise les médicaments et templates |
| 32-rag-medicaments | Intégration RAG médicaments |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **30 médicaments MVP** : Suffisant pour validation, base complète en V0.2
- **Pas d'embeddings** : Pinecone sera intégré plus tard, pour l'instant recherche textuelle
- **Source traçable** : Chaque suggestion doit pouvoir être tracée

### 💡 Suggestions

- Préparer un fichier JSON avec tous les médicaments pour import bulk
- Les templates peuvent être dupliqués par médecin (personnalisation future)
- Prévoir un champ `embedding` (array of decimal) pour Pinecone plus tard

### 📡 Endpoints API existants (swagger)

**Médicaments :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/medicaments` | GET | Liste paginée (page, per_page) |
| `/medicaments/{id}` | GET | Détail d'un médicament |
| `/medicaments/search` | GET | Recherche (filtres: `q`, `classe`) |
| `/medicaments/check-interactions` | POST | Vérifier interactions (medicament_ids, patient_allergies) |

**Protocoles SFORL :**

*Pas d'endpoint API public - table utilisée en interne pour le RAG*

**Templates CR :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/templates/cr` | GET | Liste tous les templates |
| `/templates/cr/{id}` | GET | Détail d'un template |
| `/templates/cr/by-type/{type}` | GET | Templates par type (consultation/intervention) |

**Templates Ordonnance :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/templates/ordonnance` | GET | Liste tous les templates |
| `/templates/ordonnance/{id}` | GET | Détail d'un template |
| `/templates/ordonnance/by-pathologie/{pathologie}` | GET | Templates par pathologie |
