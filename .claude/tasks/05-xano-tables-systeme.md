# Task 05: Xano - Tables Système

> **Durée estimée** : 1h  
> **Phase** : Foundation  
> **Feature PRD** : Conformité HDS, Traçabilité

## Contexte

Les tables système assurent la traçabilité et le monitoring de l'application. `audit_log` est obligatoire pour la conformité HDS (qui accède à quoi, quand). `analytics_event` permet de suivre l'usage pour améliorer le produit.

## Objectif

Créer les tables `audit_log` et `analytics_event` pour la traçabilité et les métriques.

## Scope

### Inclus ✅
- Table `audit_log` (logs d'audit immutables)
- Table `analytics_event` (événements pour métriques)
- Configuration de non-modification (logs immutables)

### Exclus ❌
- Triggers automatiques (seront gérés côté API)
- Dashboard analytics (Task 36)
- Intégration Sentry (Task 41)

---

## Implémentation

### Étape 1 : Table `audit_log`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `doctor_id` | Table Reference | → user.id, Required | Utilisateur concerné |
| `action` | Enum | Values: ["create", "read", "update", "delete", "login", "logout", "export", "send"], Required | Type d'action |
| `entity_type` | Text | Required | Type d'entité ("patient", "consultation", etc.) |
| `entity_id` | Integer | Required | ID de l'entité concernée |
| `details` | Object | Nullable | Détails de l'action (avant/après) |
| `ip_address` | Text | Nullable | Adresse IP |
| `user_agent` | Text | Nullable | User agent navigateur |
| `created_at` | Timestamp | Default: now | Date de l'action |

**⚠️ PAS de `updated_at`** : Les logs d'audit sont immutables.

**Index :**
- `doctor_id`
- `action`
- `entity_type`
- `entity_id`
- `created_at`

**Structure `details` (exemples) :**

Pour une modification :
```json
{
  "before": {"status": "draft"},
  "after": {"status": "validated"},
  "changed_fields": ["status", "validated_at"]
}
```

Pour un export :
```json
{
  "document_type": "ordonnance",
  "format": "pdf",
  "recipient": "patient"
}
```

Pour un envoi email :
```json
{
  "document_type": "courrier",
  "recipient_email": "dr.martin@email.fr",
  "success": true
}
```

### Étape 2 : Table `analytics_event`

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `doctor_id` | Table Reference | → user.id, Nullable | Utilisateur (nullable pour events anonymes) |
| `event_type` | Enum | Values: ["transcription", "generation_cr", "generation_ordonnance", "generation_courrier", "export_pdf", "send_email", "search_medicament", "page_view"], Required | Type d'événement |
| `event_data` | Object | Nullable | Données de l'événement |
| `duration_ms` | Integer | Nullable | Durée en millisecondes |
| `success` | Boolean | Default: true | Succès de l'opération |
| `error_message` | Text | Nullable | Message d'erreur si échec |
| `created_at` | Timestamp | Default: now | Date de l'événement |

**Index :**
- `doctor_id`
- `event_type`
- `created_at`
- `success`

**Structure `event_data` (exemples) :**

Pour une transcription :
```json
{
  "audio_duration_seconds": 180,
  "transcription_length": 450,
  "context_detected": "consultation",
  "model": "whisper-1"
}
```

Pour une génération :
```json
{
  "document_type": "cr_consultation",
  "template_used": "standard",
  "tokens_input": 500,
  "tokens_output": 800,
  "model": "claude-3-sonnet"
}
```

### Étape 3 : Permissions tables système

**Table `audit_log` :**
- Read : Admin only
- Create : System/API only (via API key)
- Update : **INTERDIT** (immutable)
- Delete : **INTERDIT** (immutable)

**Table `analytics_event` :**
- Read : Admin only
- Create : System/API only
- Update : **INTERDIT**
- Delete : Admin only (pour purge données anciennes)

### Étape 4 : Rétention des données

Configurer dans Xano (si possible) ou noter pour implémentation :

- `audit_log` : Conservation **2 ans minimum** (conformité HDS)
- `analytics_event` : Conservation **1 an**, purge possible après

---

## Critères de succès

### Fonctionnels
- [ ] Table `audit_log` créée
- [ ] Table `analytics_event` créée
- [ ] Impossible de modifier/supprimer des audit_logs (vérifier permissions)

### Techniques
- [ ] Enums correctement configurés
- [ ] Index sur champs de recherche
- [ ] Pas de `updated_at` sur audit_log

---

## Tests & Validation

### Tests manuels

1. **Créer un audit log manuellement**
   - Via l'interface Xano Database
   - Résultat attendu : Log créé avec timestamp automatique

2. **Tenter de modifier un audit log**
   - Résultat attendu : Modification refusée (permissions)

3. **Créer un analytics event**
   - Résultat attendu : Event créé avec toutes les données

4. **Consulter les audit logs via `/admin/audit-logs`**
   - Filtrer par action : `/admin/audit-logs?action=login`
   - Résultat attendu : Liste paginée des logs de connexion

5. **Consulter ses propres events via `/logs/user/my_events`**
   - Résultat attendu : Liste des events de l'utilisateur connecté

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 02-xano-tables-principales | Référence user.id (via doctor_id) |

### Bloque

| Task | Raison |
|------|--------|
| 07-xano-endpoints | Endpoints pour écriture logs |
| 36-admin-analytics-audit | Dashboard affichant ces données |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Immutabilité** : Les audit logs ne doivent JAMAIS être modifiables
- **HDS** : Ces logs sont obligatoires pour la certification
- **RGPD** : Les logs contiennent des données personnelles (doctor_id), prévoir export

### 💡 Suggestions

- L'endpoint `/admin/audit-logs` existe déjà avec filtres (action, entity_type)
- Les analytics_event peuvent être agrégés pour les dashboards
- Envisager une purge automatique des analytics > 1 an
- L'endpoint `/logs/user/my_events` permet aux utilisateurs de voir leur historique

### 🔒 Conformité HDS

Les audit logs doivent tracer :
- Qui a accédé à quelles données patient
- Quand les accès ont eu lieu
- Quelles modifications ont été faites
- Les exports de documents

### 📡 Endpoints API existants (swagger)

**Audit Logs :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/admin/audit-logs` | GET | Liste paginée (filtres: action, entity_type) |

**Event Logs :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/logs/admin/account_events` | GET | Tous les events d'un compte (Admin only) |
| `/logs/user/my_events` | GET | Events de l'utilisateur connecté |
