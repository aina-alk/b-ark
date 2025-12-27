# Task 03: Xano - Tables Médicales

> **Durée estimée** : 1.5h  
> **Phase** : Foundation  
> **Feature PRD** : Épics 1-6 (Consultation, Intervention, Documents)

## Contexte

Ces tables stockent les données médicales de l'application : consultations, interventions chirurgicales et documents générés. Elles sont au cœur du workflow et référencent les tables `user` et `patient` créées précédemment. Le champ `doctor_id` est conservé comme convention de nommage mais référence la table `user`.

## Objectif

Créer les tables `consultation`, `intervention` et `document` avec leurs relations complètes.

## Scope

### Inclus ✅
- Table `consultation` (CR consultation)
- Table `intervention` (CR opératoire)
- Table `document` (ordonnances, courriers, CR)
- Relations entre toutes les tables
- Enums pour les statuts et types

### Exclus ❌
- Tables RAG (Task 04)
- Tables système/audit (Task 05)
- Endpoints API (Task 07)

---

## Implémentation

### Étape 1 : Table `consultation`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `patient_id` | Table Reference | → patient.id, Required | Patient concerné |
| `doctor_id` | Table Reference | → user.id, Required | Médecin |
| `date` | Timestamp | Required | Date consultation |
| `motif` | Text | Nullable | Motif de consultation |
| `transcription` | Text | Nullable | Transcription brute Whisper |
| `context_detected` | Enum | Values: ["consultation", "intervention", "unknown"], Default: "unknown" | Type détecté par IA |
| `symptoms` | Array of Text | Default: [] | Symptômes extraits |
| `examination` | Text | Nullable | Examen clinique |
| `diagnosis` | Text | Nullable | Diagnostic |
| `treatment_plan` | Text | Nullable | Plan de traitement/CAT |
| `status` | Enum | Values: ["draft", "in_progress", "completed", "validated"], Default: "draft" | Statut |
| `duration_seconds` | Integer | Nullable | Durée enregistrement audio |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Index :**
- `patient_id`
- `doctor_id`
- `date`
- `status`
- `context_detected`

**Relations :**
- `patient_id` → `patient.id` (Many-to-One)
- `doctor_id` → `user.id` (Many-to-One)

### Étape 2 : Table `intervention`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `patient_id` | Table Reference | → patient.id, Required | Patient |
| `doctor_id` | Table Reference | → user.id, Required | Chirurgien |
| `date` | Timestamp | Required | Date intervention |
| `type_intervention` | Text | Required | Type (Amygdalectomie, Septoplastie, etc.) |
| `transcription` | Text | Nullable | Transcription brute |
| `indication` | Text | Nullable | Indication opératoire |
| `technique` | Text | Nullable | Description technique |
| `findings` | Text | Nullable | Constatations per-opératoires |
| `complications` | Text | Nullable | Complications éventuelles |
| `status` | Enum | Values: ["draft", "in_progress", "completed", "validated"], Default: "draft" | Statut |
| `duration_minutes` | Integer | Nullable | Durée intervention |
| `anesthesia_type` | Text | Nullable | Type d'anesthésie |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Index :**
- `patient_id`
- `doctor_id`
- `date`
- `status`
- `type_intervention`

### Étape 3 : Table `document`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `consultation_id` | Table Reference | → consultation.id, Nullable | Consultation source |
| `intervention_id` | Table Reference | → intervention.id, Nullable | Intervention source |
| `doctor_id` | Table Reference | → user.id, Required | Médecin auteur |
| `patient_id` | Table Reference | → patient.id, Required | Patient concerné |
| `type` | Enum | Values: ["cr_consultation", "cr_operatoire", "ordonnance", "courrier"], Required | Type de document |
| `title` | Text | Nullable | Titre du document |
| `content` | Object | Required | Contenu structuré JSON |
| `content_text` | Text | Nullable | Version texte pour recherche |
| `pdf_url` | Text | Nullable | URL du PDF généré |
| `validated` | Boolean | Default: false | Document validé |
| `validated_at` | Timestamp | Nullable | Date validation |
| `sent_at` | Timestamp | Nullable | Date envoi email |
| `recipient_email` | Text | Nullable | Email destinataire |
| `version` | Integer | Default: 1 | Version du document |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Index :**
- `consultation_id`
- `intervention_id`
- `doctor_id`
- `patient_id`
- `type`
- `validated`
- `created_at`

**Contrainte :** Un document a soit `consultation_id` soit `intervention_id`, pas les deux (mais un peut être null pour documents standalone).

### Étape 4 : Structure du champ `content`

Le champ `content` est un objet JSON dont la structure dépend du type :

**CR Consultation :**
```json
{
  "motif": "Otalgies gauches depuis 3 jours",
  "antecedents_pertinents": ["Diabète type 2"],
  "examen_clinique": {
    "otoscopie": "Tympan gauche inflammé...",
    "rhinoscopie": "RAS",
    "oropharynx": "RAS"
  },
  "examens_complementaires": [],
  "conclusion": "Otite moyenne aiguë gauche",
  "cat": "Traitement antibiotique per os..."
}
```

**CR Opératoire :**
```json
{
  "indication": "Hypertrophie amygdalienne obstructive",
  "installation": "Décubitus dorsal, billot sous les épaules...",
  "technique": "Amygdalectomie par dissection...",
  "incidents": "Aucun",
  "suites_immediates": "Réveil calme, pas de saignement"
}
```

**Ordonnance :**
```json
{
  "medicaments": [
    {
      "nom": "Amoxicilline 1g",
      "posologie": "1 comprimé matin et soir",
      "duree": "7 jours"
    }
  ],
  "examens": [],
  "consignes": "En cas de fièvre persistante, consulter"
}
```

**Courrier :**
```json
{
  "destinataire": {
    "nom": "Dr. Martin",
    "specialite": "Médecin traitant",
    "adresse": "..."
  },
  "objet": "Consultation du 22/12/2024",
  "corps": "Cher confrère,\n\nJe vous adresse..."
}
```

### Étape 5 : Données de test

**Consultation test :**
```json
{
  "patient_id": 1,
  "doctor_id": 1,
  "date": "2024-12-22T10:00:00Z",
  "motif": "Otalgies gauches",
  "status": "draft",
  "context_detected": "consultation"
}
```

**Intervention test :**
```json
{
  "patient_id": 1,
  "doctor_id": 1,
  "date": "2024-12-20T08:00:00Z",
  "type_intervention": "Amygdalectomie",
  "status": "completed",
  "duration_minutes": 45,
  "anesthesia_type": "Générale"
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Table `consultation` créée avec tous les champs
- [ ] Table `intervention` créée avec tous les champs
- [ ] Table `document` créée avec tous les champs
- [ ] Relations fonctionnelles entre tables
- [ ] Données de test insérées

### Techniques
- [ ] Enums correctement configurés
- [ ] Champ `content` accepte du JSON valide
- [ ] Index sur les champs de filtrage/recherche
- [ ] Contraintes de clés étrangères actives

---

## Tests & Validation

### Tests manuels

1. **Créer une consultation**
   - Lier à un patient et user existants (via doctor_id → user.id)
   - Résultat attendu : Record créé, relations visibles

2. **Créer un document lié à la consultation**
   - Avec `consultation_id` pointant vers la consultation
   - Résultat attendu : Relation fonctionnelle

3. **Tester le champ content JSON**
   - Insérer un objet JSON complexe
   - Résultat attendu : Stockage et récupération corrects

4. **Vérifier les enums**
   - Essayer d'insérer un status invalide
   - Résultat attendu : Erreur de validation

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 02-xano-tables-principales | Tables user et patient référencées |

### Bloque

| Task | Raison |
|------|--------|
| 04-xano-tables-rag | Certains templates référencent les types de documents |
| 07-xano-endpoints | Endpoints CRUD pour ces tables |
| 18+ | Toutes les features consultation/intervention |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **content vs content_text** : `content` est le JSON structuré, `content_text` est une version texte pour la recherche full-text
- **consultation_id/intervention_id** : Un document peut être lié à l'un ou l'autre, pas les deux obligatoirement
- **status workflow** : draft → in_progress → completed → validated

### 💡 Suggestions

- Le champ `transcription` peut être très long (texte complet de la dictée)
- Prévoir la pagination pour les listes de consultations
- Les ordonnances peuvent ne pas être liées à une consultation (création directe)

### 📡 Endpoints API existants (swagger)

**Consultation :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/consultation` | POST | Créer une consultation |
| `/consultations` | GET | Liste paginée (filtres disponibles) |
| `/consultation/{id}` | GET | Détail d'une consultation |
| `/consultation/{id}` | PATCH/PUT | Modifier une consultation |
| `/consultation/{id}` | DELETE | Supprimer une consultation |
| `/consultation-update/{id}/transcription` | PATCH | Mettre à jour la transcription |
| `/consultation-update/{id}/validate` | PATCH | Valider une consultation |
| `/consultations/patient/{patient_id}` | GET | Consultations d'un patient |
| `/consultations/recent` | GET | Consultations récentes |
| `/consultations/today` | GET | Consultations du jour |

**Intervention :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/intervention` | GET/POST | Liste et création |
| `/intervention/{id}` | GET/PATCH/PUT/DELETE | CRUD par ID |
| `/intervention-validate/{id}` | PATCH | Valider une intervention |
| `/interventions-per-patient/{patient_id}` | GET | Interventions d'un patient |
| `/interventions/type` | GET | Liste des types d'intervention |

**Document :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/document` | GET/POST | Liste (filtres: type, validated, consultation_id, patient_id) et création |
| `/document/{id}` | GET/PATCH/PUT/DELETE | CRUD par ID |
| `/documents/{id}/validate` | PATCH | Valider un document |
| `/documents-per-patient/{patient_id}` | GET | Documents d'un patient |
| `/documents/patient/{patient_id}` | GET | Documents d'un patient (alt) |
| `/documents/recent` | GET | Documents récents |
