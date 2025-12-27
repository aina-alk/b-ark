# Task 07: Xano - Endpoints API CRUD

> **Durée estimée** : 2h
> **Phase** : Foundation
> **Feature PRD** : Toutes les features (API backend)

## Contexte

Cette tâche documente tous les endpoints API REST existants dans Xano pour les opérations CRUD sur les tables créées. Ces endpoints sont consommés par le frontend Next.js via le client Xano.

## Objectif

Documenter et valider tous les endpoints CRUD de l'application, avec filtres, pagination et protection par authentification.

## Scope

### Inclus ✅
- Endpoints CRUD pour toutes les tables métier
- Filtres et pagination
- Protection par authentification
- Validation des inputs
- Endpoints spéciaux (stats, recherche)

### Exclus ❌
- Endpoints auth (déjà documentés en Task 06)
- Logique IA/transcription (sera en API Routes Next.js)
- Webhooks (Task 31)

---

## Implémentation

### Vue d'ensemble des endpoints (swagger)

```
/patient         → CRUD patients
/consultation    → CRUD consultations
/intervention    → CRUD interventions
/document        → CRUD documents
/medicaments     → Recherche médicaments (RAG)
/templates/*     → Templates CR et ordonnances
/admin/*         → Endpoints admin
/dashboard/*     → Stats utilisateur
/logs/*          → Event logs
/user/*          → Profil utilisateur
/account/*       → Gestion compte
```

### Étape 1 : Endpoints Patients

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/patient` | Liste mes patients | ✅ |
| GET | `/patient/{patient_id}` | Détail patient | ✅ |
| GET | `/patient-by-ipp` | Recherche par IPP (query: ipp) | ✅ |
| GET | `/patient-history/{patient_id}` | Historique complet | ✅ |
| POST | `/patient` | Créer patient | ✅ |
| PATCH | `/patient/{patient_id}` | Modifier patient | ✅ |
| PUT | `/patient/{patient_id}` | Remplacer patient | ✅ |
| DELETE | `/patient/{patient_id}` | Supprimer patient | ✅ |

**GET /patient - Workflow Xano :**
1. Get auth user (user_id)
2. Query patients WHERE user_id = auth_user.id
3. Add pagination (page, per_page)
4. Add optional filters (search query on IPP)
5. Return with total count

**Input query params :**
```
?page=1&per_page=20&search=1001
```

**Output :**
```json
{
  "items": [...],
  "total": 45,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

### Étape 2 : Endpoints Consultations

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/consultations` | Liste mes consultations (avec filtres) | ✅ |
| GET | `/consultation/{consultation_id}` | Détail consultation | ✅ |
| GET | `/consultations/today` | Consultations du jour | ✅ |
| GET | `/consultations/recent` | 10 dernières | ✅ |
| GET | `/consultations/patient/{patient_id}` | Par patient | ✅ |
| POST | `/consultation` | Créer consultation | ✅ |
| PATCH | `/consultation/{consultation_id}` | Modifier | ✅ |
| PUT | `/consultation/{consultation_id}` | Remplacer | ✅ |
| PATCH | `/consultation-update/{consultation_id}/transcription` | Update transcription | ✅ |
| PATCH | `/consultation-update/{consultation_id}/validate` | Valider | ✅ |
| DELETE | `/consultation/{consultation_id}` | Supprimer | ✅ |

**GET /consultations - Filtres :**
```
?status=draft,in_progress
?date_from=2024-12-01&date_to=2024-12-31
?patient_id=5
?page=1&per_page=20
```

**POST /consultation - Input :**
```json
{
  "patient_id": 1,
  "date": "2024-12-22T10:00:00Z",
  "motif": "Otalgies"
}
```

**Workflow création :**
1. Valider patient appartient au user connecté
2. Créer consultation avec status="draft"
3. Créer audit_log (action: "create", entity_type: "consultation")
4. Retourner consultation créée

### Étape 3 : Endpoints Interventions

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/intervention` | Liste mes interventions (avec filtres) | ✅ |
| GET | `/intervention/{intervention_id}` | Détail | ✅ |
| GET | `/interventions/type` | Types d'interventions | ✅ |
| GET | `/interventions-per-patient/{patient_id}` | Par patient | ✅ |
| POST | `/intervention` | Créer | ✅ |
| PATCH | `/intervention/{intervention_id}` | Modifier | ✅ |
| PUT | `/intervention/{intervention_id}` | Remplacer | ✅ |
| PATCH | `/intervention-validate/{intervention_id}` | Valider | ✅ |
| DELETE | `/intervention/{intervention_id}` | Supprimer | ✅ |

**GET /interventions/type - Output :**
```json
{
  "types": [
    "Amygdalectomie",
    "Adénoïdectomie",
    "Septoplastie",
    "FESS",
    "Paracentèse",
    "Pose d'aérateurs",
    "Autre"
  ]
}
```

### Étape 4 : Endpoints Documents

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/document` | Liste mes documents (avec filtres) | ✅ |
| GET | `/document/{document_id}` | Détail | ✅ |
| GET | `/documents/patient/{patient_id}` | Par patient | ✅ |
| GET | `/documents-per-patient/{patient_id}` | Par patient (alt) | ✅ |
| GET | `/documents/recent` | Documents récents | ✅ |
| POST | `/document` | Créer | ✅ |
| PATCH | `/document/{document_id}` | Modifier | ✅ |
| PUT | `/document/{document_id}` | Remplacer | ✅ |
| PATCH | `/documents/{id}/validate` | Valider | ✅ |
| DELETE | `/document/{document_id}` | Supprimer | ✅ |

**GET /document - Filtres :**
```
?type=ordonnance,courrier
?validated=true
?consultation_id=5
?patient_id=3
```

### Étape 5 : Endpoints Médicaments (RAG)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/medicaments` | Liste paginée (page, per_page) | ✅ |
| GET | `/medicaments/search` | Recherche (q, classe) | ✅ |
| GET | `/medicaments/{id}` | Détail | ✅ |
| POST | `/medicaments/check-interactions` | Vérifier interactions | ✅ |

**GET /medicaments/search :**
```
?q=amox
?classe=Antibiotique
```

**POST /medicaments/check-interactions - Input :**
```json
{
  "medicament_ids": [1, 5, 8],
  "patient_allergies": ["Pénicilline"]
}
```

**Output :**
```json
{
  "interactions": [
    {
      "medicament1": "Amoxicilline",
      "medicament2": null,
      "type": "allergie",
      "severity": "high",
      "message": "Allergie pénicilline déclarée"
    }
  ],
  "safe": false
}
```

### Étape 6 : Endpoints Templates

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/templates/cr` | Liste templates CR | ✅ |
| GET | `/templates/cr/{id}` | Détail template | ✅ |
| GET | `/templates/cr/by-type/{type}` | Par type | ✅ |
| GET | `/templates/ordonnance` | Liste templates ordo | ✅ |
| GET | `/templates/ordonnance/{id}` | Détail | ✅ |
| GET | `/templates/ordonnance/by-pathologie/{pathologie}` | Par pathologie | ✅ |

### Étape 7 : Endpoints Admin

| Méthode | Endpoint | Description | Auth | Role |
|---------|----------|-------------|------|------|
| GET | `/admin/dashboard` | Stats globales | ✅ | admin |
| GET | `/admin/users` | Liste médecins | ✅ | admin |
| GET | `/admin/users/{id}` | Détail médecin | ✅ | admin |
| GET | `/admin/users/{id}/activity` | Activité | ✅ | admin |
| PATCH | `/admin/users/{id}/toggle-active` | Activer/désactiver | ✅ | admin |
| GET | `/admin/analytics` | Analytics | ✅ | admin |
| GET | `/admin/audit-logs` | Logs d'audit | ✅ | admin |

**Middleware admin :**
Dans chaque endpoint admin, ajouter :
```
1. Get auth user
2. Check user.role == "admin"
3. If not admin, return 403 Forbidden
```

### Étape 8 : Endpoints Dashboard

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/dashboard/stats` | Stats médecin | ✅ |
| GET | `/dashboard/recent-consultations` | 5 dernières consult | ✅ |
| GET | `/dashboard/recent-documents` | 5 derniers docs | ✅ |

**GET /dashboard/stats - Output :**
```json
{
  "total_patients": 45,
  "consultations_this_month": 28,
  "interventions_this_month": 5,
  "documents_pending_validation": 3
}
```

### Étape 9 : Endpoints Event Logs

| Méthode | Endpoint | Description | Auth | Role |
|---------|----------|-------------|------|------|
| GET | `/logs/admin/account_events` | Tous les events d'un compte | ✅ | admin |
| GET | `/logs/user/my_events` | Events de l'utilisateur connecté | ✅ | user |

### Étape 10 : Endpoints User & Account

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/account/details` | Détails du compte | ✅ |
| GET | `/account/my_team_members` | Membres de l'équipe | ✅ |
| POST | `/account` | Créer un compte | ✅ |
| PATCH | `/user/edit_profile` | Modifier profil (name, email) | ✅ |
| POST | `/user/join_account` | Rejoindre un compte | ✅ |
| POST | `/admin/user_role` | Modifier le rôle d'un user | ✅ | admin |

### Étape 11 : Endpoints Messages

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/message/send_welcome_email` | Envoyer email de bienvenue | ✅ |

### Étape 12 : Configuration globale

**CORS :**
```
Allowed Origins: 
- http://localhost:3000
- https://orl-consultation.vercel.app
- https://[custom-domain].com
```

**Rate Limiting global :**
```
- 100 requests/minute par user
- 1000 requests/heure par user
```

**Response format standard :**
```json
{
  "data": {...},
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

**Error format :**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "IPP is required",
    "field": "ipp"
  }
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Tous les endpoints CRUD fonctionnent
- [ ] Filtres et pagination opérationnels
- [ ] Recherche médicaments fonctionne
- [ ] Vérification interactions retourne les alertes
- [ ] Endpoints admin protégés par rôle

### Techniques
- [ ] Auth required sur tous les endpoints (sauf public)
- [ ] Ownership vérifié (un doctor ne voit que ses patients)
- [ ] CORS configuré
- [ ] Rate limiting actif
- [ ] Format de réponse cohérent

---

## Tests & Validation

### Tests par endpoint

1. **GET /patient**
   - Sans token → 401
   - Avec token → Liste des patients du user connecté

2. **POST /consultation**
   - Patient d'un autre user → 403
   - Patient valide → Consultation créée

3. **GET /admin/users**
   - Avec token user → 403
   - Avec token admin → Liste users

4. **POST /medicaments/check-interactions**
   - Avec allergie connue → Alerte retournée

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 02 à 05 | Toutes les tables doivent exister |
| 06 | Auth configuré pour protection endpoints |

### Bloque

| Task | Raison |
|------|--------|
| 08 | Client Xano consomme ces endpoints |
| Toutes les features | Backend prêt |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Ownership** : Toujours vérifier que l'entité appartient au user connecté
- **Audit logs** : Créer un log pour chaque CREATE/UPDATE/DELETE
- **Soft delete** : Considérer pour les patients (ne pas vraiment supprimer)

### 💡 Suggestions

- Utiliser les Functions Xano pour la logique réutilisable
- Créer une function `check_ownership(entity_type, entity_id, user_id)`
- Créer une function `create_audit_log(action, entity_type, entity_id, details)`

### 🧪 Test avec Postman/Insomnia

Créer une collection avec :
- Variable d'environnement pour le token
- Tests automatisés de réponse
- Exemples pour chaque endpoint

---

## 📡 Résumé des endpoints API (swagger)

### Patients
| Endpoint | Méthode |
|----------|---------|
| `/patient` | GET, POST |
| `/patient/{patient_id}` | GET, PATCH, PUT, DELETE |
| `/patient-by-ipp` | GET |
| `/patient-history/{patient_id}` | GET |

### Consultations
| Endpoint | Méthode |
|----------|---------|
| `/consultation` | POST |
| `/consultations` | GET |
| `/consultation/{consultation_id}` | GET, PATCH, PUT, DELETE |
| `/consultations/today` | GET |
| `/consultations/recent` | GET |
| `/consultations/patient/{patient_id}` | GET |
| `/consultation-update/{consultation_id}/transcription` | PATCH |
| `/consultation-update/{consultation_id}/validate` | PATCH |

### Interventions
| Endpoint | Méthode |
|----------|---------|
| `/intervention` | GET, POST |
| `/intervention/{intervention_id}` | GET, PATCH, PUT, DELETE |
| `/interventions/type` | GET |
| `/interventions-per-patient/{patient_id}` | GET |
| `/intervention-validate/{intervention_id}` | PATCH |

### Documents
| Endpoint | Méthode |
|----------|---------|
| `/document` | GET, POST |
| `/document/{document_id}` | GET, PATCH, PUT, DELETE |
| `/documents/patient/{patient_id}` | GET |
| `/documents-per-patient/{patient_id}` | GET |
| `/documents/recent` | GET |
| `/documents/{id}/validate` | PATCH |

### Médicaments
| Endpoint | Méthode |
|----------|---------|
| `/medicaments` | GET |
| `/medicaments/{id}` | GET |
| `/medicaments/search` | GET |
| `/medicaments/check-interactions` | POST |

### Templates
| Endpoint | Méthode |
|----------|---------|
| `/templates/cr` | GET |
| `/templates/cr/{id}` | GET |
| `/templates/cr/by-type/{type}` | GET |
| `/templates/ordonnance` | GET |
| `/templates/ordonnance/{id}` | GET |
| `/templates/ordonnance/by-pathologie/{pathologie}` | GET |

### Admin
| Endpoint | Méthode |
|----------|---------|
| `/admin/dashboard` | GET |
| `/admin/users` | GET |
| `/admin/users/{id}` | GET |
| `/admin/users/{id}/activity` | GET |
| `/admin/users/{id}/toggle-active` | PATCH |
| `/admin/analytics` | GET |
| `/admin/audit-logs` | GET |
| `/admin/user_role` | POST |

### Dashboard
| Endpoint | Méthode |
|----------|---------|
| `/dashboard/stats` | GET |
| `/dashboard/recent-consultations` | GET |
| `/dashboard/recent-documents` | GET |

### Logs
| Endpoint | Méthode |
|----------|---------|
| `/logs/admin/account_events` | GET |
| `/logs/user/my_events` | GET |

### User & Account
| Endpoint | Méthode |
|----------|---------|
| `/account` | POST |
| `/account/details` | GET |
| `/account/my_team_members` | GET |
| `/user/edit_profile` | PATCH |
| `/user/join_account` | POST |

### Messages
| Endpoint | Méthode |
|----------|---------|
| `/message/send_welcome_email` | POST |
