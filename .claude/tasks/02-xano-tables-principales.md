# Task 02: Xano - Tables Principales

> **Durée estimée** : 1.5h
> **Phase** : Foundation
> **Feature PRD** : Infrastructure données

## Contexte

Cette tâche configure les tables fondamentales dans Xano : `user` (table built-in Xano étendue pour les médecins) et `patient` (données patient anonymisées via IPP). Ces tables sont la base de toute l'application et doivent être créées avant les tables médicales.

## Objectif

Étendre la table `user` built-in de Xano avec les champs métier ORL et créer la table `patient` avec toutes ses colonnes et relations.

## Scope

### Inclus ✅
- Création workspace Xano (si pas déjà fait)
- Extension de la table `user` avec les champs métier
- Table `patient` avec tous les champs
- Relation `user` → `patient` (1:N)
- Index sur les champs de recherche

### Exclus ❌
- Tables médicales (Task 03)
- Tables RAG (Task 04)
- Configuration Auth Xano (Task 06)
- Endpoints API (Task 07)

---

## Implémentation

### Étape 1 : Créer le workspace Xano

1. Aller sur [xano.com](https://xano.com)
2. Créer un nouveau workspace : `orl-consultation-intelligente`
3. Sélectionner la région **EU** (HDS compliance)
4. Choisir le plan **Scale** (HDS inclus)

### Étape 2 : Extension de la table `user` (built-in Xano)

La table `user` est automatiquement créée par Xano avec l'authentification. Elle contient déjà les champs de base. Nous devons l'étendre avec les champs métier ORL.

**Champs existants (built-in Xano) :**

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `email` | Text | Unique, Required | Email du médecin |
| `name` | Text | Required | Nom complet |
| `password` | Password | Required | Mot de passe hashé |
| `created_at` | Timestamp | Default: now | Date création |

**Champs à ajouter :**

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `rpps` | Text | Unique, Nullable | Numéro RPPS (immuable après création) |
| `specialty` | Text | Default: "ORL" | Spécialité (immuable après création) |
| `role` | Enum | Values: ["user", "admin"], Default: "user" | Rôle utilisateur |
| `is_active` | Boolean | Default: true | Compte actif |

**Index à créer :**
- `rpps` (unique, nullable)
- `role`
- `is_active`

**Note :** Les champs `rpps` et `specialty` sont définis à l'inscription et ne sont pas modifiables via l'endpoint `/user/edit_profile` (qui ne permet de modifier que `name` et `email`).

### Étape 3 : Table `patient`

Créer la table `patient` :

| Champ | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | Integer | Auto-increment, Primary | ID unique |
| `ipp` | Integer | Unique, Required | Identifiant Patient Permanent (anonyme) |
| `user_id` | Table Reference | → user.id, Required | Médecin référent |
| `allergies` | Array of Text | Default: [] | Liste allergies |
| `antecedents` | Array of Text | Default: [] | Liste antécédents |
| `notes` | Text | Nullable | Notes libres médecin |
| `created_at` | Timestamp | Default: now | Date création |
| `updated_at` | Timestamp | Nullable | Date modification |

**Index à créer :**
- `ipp` (unique)
- `user_id`
- `created_at`

**Relation :**
- `user_id` → `user.id` (Many-to-One)
- On Delete : CASCADE (si utilisateur supprimé, patients supprimés)

### Étape 4 : Configuration des permissions Xano

Dans les settings de chaque table, configurer :

**Table `user` (built-in) :**
- Read : Authenticated
- Create : Public (via `/auth/signup`)
- Update : Authenticated (own record only, via `/user/edit_profile`)
- Delete : Admin only (via `/admin/users/{id}/toggle-active`)

**Table `patient` :**
- Read : Authenticated (own patients only via filter `user_id`)
- Create : Authenticated
- Update : Authenticated (own patients only)
- Delete : Authenticated (own patients only)

### Étape 5 : Données de test (Seed)

Créer quelques données de test via l'interface Xano ou les endpoints d'authentification :

**User test (via `/auth/signup`):**
```json
{
  "email": "test@orl-consultation.fr",
  "name": "Dr. Test ORL",
  "password": "TestPassword123!"
}
```

Puis compléter les champs métier directement en base :
```json
{
  "rpps": "12345678901",
  "specialty": "ORL",
  "role": "user",
  "is_active": true
}
```

**Patient test :**
```json
{
  "ipp": 1001,
  "user_id": 1,
  "allergies": ["Pénicilline"],
  "antecedents": ["Diabète type 2"],
  "notes": "Patient test"
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Table `user` étendue avec les champs métier (rpps, specialty, role, is_active)
- [ ] Table `patient` créée avec tous les champs
- [ ] Relation `user` ↔ `patient` fonctionnelle
- [ ] Données de test insérées

### Techniques
- [ ] Index configurés sur les champs de recherche
- [ ] Contrainte unique sur `email`, `rpps` et `ipp`
- [ ] Types corrects (enum pour role, array pour allergies)
- [ ] Timestamps automatiques

---

## Tests & Validation

### Tests manuels dans Xano

1. **Créer un user via `/auth/signup`**
   - Appeler l'endpoint avec email, name, password
   - Résultat attendu : authToken et user_id retournés

2. **Vérifier les champs métier**
   - Via l'interface Xano Database, compléter rpps et specialty
   - Résultat attendu : Champs sauvegardés correctement

3. **Créer un patient lié**
   - Avec `user_id` pointant vers l'utilisateur créé
   - Résultat attendu : Relation visible dans Xano

4. **Tester la contrainte unique IPP**
   - Essayer de créer un patient avec le même IPP
   - Résultat attendu : Erreur de duplication

5. **Tester la relation**
   - Dans la table patient, cliquer sur le user_id
   - Résultat attendu : Navigation vers l'utilisateur lié

### Vérification structure

Dans Xano, vérifier que :
- Les types de données sont corrects
- Les valeurs par défaut sont appliquées
- Les index sont créés

---

## Dépendances

### Requiert (à compléter AVANT cette tâche)

| Task | Raison |
|------|--------|
| 01-setup-nextjs | Projet initialisé (pour avoir les specs) |

### Bloque (dépendent de cette tâche)

| Task | Raison |
|------|--------|
| 03-xano-tables-medicales | Tables consultation/intervention référencent user et patient |
| 06-xano-auth | Auth Xano utilise la table user (built-in) |
| 07-xano-endpoints | Endpoints CRUD user/patient |

---

## Documentation liée

- **PROJECT_PLAN** : Section 2.4 Schema Xano
- **ARCHI** : Section Backend Architecture (Xano)

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **IPP unique** : L'IPP est l'identifiant anonyme du patient, pas de données nominatives
- **Région EU** : Crucial pour conformité HDS
- **user_id required** : Un patient est toujours lié à un utilisateur (médecin)
- **Champs immuables** : `rpps` et `specialty` ne sont pas modifiables après création

### 💡 Suggestions

- Utiliser des noms de colonnes en **snake_case** (convention Xano)
- Ne pas oublier `updated_at` nullable (sera mis à jour via trigger ou API)
- La table `user` built-in de Xano est étendue avec les champs métier, pas de table séparée

### 🔒 Conformité HDS

- Aucune donnée nominative patient (juste IPP)
- Les données nominatives restent dans le logiciel métier (TAMM, DrSanté)
- Xano EU + Plan Scale = certifié HDS

### 📡 Endpoints API existants (swagger)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/auth/signup` | POST | Inscription utilisateur |
| `/auth/login` | POST | Connexion |
| `/auth/me` | GET | Profil utilisateur courant |
| `/user/edit_profile` | PATCH | Modifier name/email |
| `/patient` | GET/POST | Liste/Créer patients |
| `/patient/{id}` | GET/PUT/PATCH/DELETE | CRUD patient |
| `/patient-by-ipp` | GET | Recherche par IPP |
| `/patient-history/{id}` | GET | Historique complet patient |
