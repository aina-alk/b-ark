# Task 06: Xano - Auth Configuration

> **Durée estimée** : 1.5h  
> **Phase** : Foundation  
> **Feature PRD** : Authentification médecin

## Contexte

Xano Auth est le système d'authentification natif de Xano. Cette tâche configure l'authentification email/password et Google OAuth pour les médecins. La table `user` (built-in Xano) étendue avec les champs métier sera utilisée.

## Objectif

Configurer Xano Auth avec email/password et Google OAuth, en utilisant la table `user` existante.

## Scope

### Inclus ✅
- Configuration Xano Auth sur table `user`
- Authentification email/password
- Google OAuth (login et signup séparés)
- Endpoints auth natifs (signup, login, me, logout, refresh)
- Reset password via magic link
- Rate limiting sur login

### Exclus ❌
- Pages frontend (Task 09-10)
- Guards/middleware côté Next.js (Task 11)
- Autres providers OAuth

---

## Implémentation

### Étape 1 : Activer Xano Auth

1. Dans Xano, aller dans **Authentication** (menu gauche)
2. Cliquer sur **Enable Authentication**
3. Sélectionner la table `user` comme table utilisateur (table built-in)
4. Configurer les champs :
   - **Email field** : `email`
   - **Password field** : Xano créera automatiquement un champ hashé

### Étape 2 : Configuration Email/Password

Dans **Authentication > Settings** :

**Password Policy :**
```
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial
```

**Token Settings :**
```
- Token expiration : 7 jours (604800 secondes)
- Refresh enabled : Oui
- Refresh expiration : 30 jours
```

**Email Verification :**
```
- Enabled : Non (optionnel MVP, peut être activé plus tard)
```

### Étape 3 : Configuration Google OAuth

1. Dans **Authentication > OAuth Providers**
2. Activer **Google**
3. Configurer les credentials :

**Google Cloud Console :**
1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer Google+ API
3. Configurer OAuth consent screen
4. Créer OAuth 2.0 Client ID
5. Ajouter les redirect URIs :
   - `https://[workspace].xano.io/api:[version]/auth/oauth/google/callback`
   - `http://localhost:3000/api/auth/callback/google` (dev)

**Dans Xano :**
```
Client ID : [depuis Google Cloud]
Client Secret : [depuis Google Cloud]
Scopes : email, profile
```

### Étape 4 : Endpoints Auth générés

Xano génère automatiquement ces endpoints :

**Authentication :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/auth/signup` | POST | Inscription (email, password, name) |
| `/auth/login` | POST | Connexion email/password |
| `/auth/me` | GET | Profil utilisateur connecté |
| `/auth/logout` | POST | Déconnexion |
| `/auth/refresh` | POST | Rafraîchir token |

**Reset Password :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/reset/request-reset-link` | GET | Demander magic link (email) |
| `/reset/magic-link-login` | POST | Échanger magic_token contre authToken |
| `/reset/update_password` | POST | Mettre à jour password |

**Google OAuth :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/oauth/google/init` | GET | Initier le flow OAuth |
| `/oauth/google/continue` | GET | Callback après Google |
| `/oauth/google/login` | GET | Login (utilisateur existant) |
| `/oauth/google/signup` | GET | Signup (nouvel utilisateur) |

### Étape 5 : Personnaliser l'endpoint signup

Modifier `/auth/signup` pour inclure les champs requis :

**Input attendu :**
```json
{
  "email": "dr.martin@email.fr",
  "password": "SecurePass123!",
  "name": "Dr. Martin Dupont",
  "rpps": "12345678901",
  "specialty": "ORL"
}
```

**Ajouter dans le workflow Xano :**
1. Validation email format
2. Validation RPPS format (11 chiffres, optionnel)
3. Création du user avec `role: "user"`, `is_active: true`
4. Retour du token + profil (authToken, user_id)

### Étape 6 : Personnaliser l'endpoint login

**Input :**
```json
{
  "email": "dr.martin@email.fr",
  "password": "SecurePass123!"
}
```

**Workflow à ajouter :**
1. Vérifier `is_active == true`
2. Mettre à jour `last_login_at`
3. Créer un audit_log (action: "login")
4. Retourner token + profil

**Output :**
```json
{
  "authToken": "eyJhbG...",
  "user_id": "1"
}
```

*Note : Utiliser `/auth/me` avec le token pour récupérer le profil complet.*

### Étape 7 : Rate Limiting

Configurer dans Xano API Settings :

**Login endpoint :**
- 5 tentatives par minute par IP
- 20 tentatives par heure par IP
- Lockout 15 minutes après 5 échecs

**Signup endpoint :**
- 3 inscriptions par heure par IP

### Étape 8 : Tester l'authentification

**Test signup :**
```bash
curl -X POST https://[workspace].xano.io/api:[version]/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@orl-consultation.fr",
    "password": "Test123!@#",
    "name": "Dr. Test",
    "specialty": "ORL"
  }'
```

**Test login :**
```bash
curl -X POST https://[workspace].xano.io/api:[version]/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@orl-consultation.fr",
    "password": "Test123!@#"
  }'
```

**Test me (avec token) :**
```bash
curl -X GET https://[workspace].xano.io/api:[version]/auth/me \
  -H "Authorization: Bearer [token]"
```

---

## Critères de succès

### Fonctionnels
- [ ] Signup crée un user et retourne un token (authToken, user_id)
- [ ] Login authentifie et retourne un token
- [ ] Token permet d'accéder à `/auth/me`
- [ ] Google OAuth initie le flow via `/oauth/google/init`
- [ ] Reset password via `/reset/request-reset-link` envoie un magic link

### Techniques
- [ ] Passwords hashés en base (vérifier que le hash n'est pas visible)
- [ ] Rate limiting actif sur login
- [ ] Token expire après 7 jours
- [ ] Audit log créé à chaque login

---

## Tests & Validation

### Tests manuels

1. **Créer un compte**
   - Via curl ou Postman
   - Résultat attendu : Token retourné (authToken, user_id), user créé en base

2. **Se connecter**
   - Avec le compte créé
   - Résultat attendu : Token valide (authToken, user_id), last_login_at mis à jour

3. **Accéder à /auth/me**
   - Avec et sans token
   - Résultat attendu : Profil avec token, 401 sans token

4. **Tester rate limiting**
   - 6 tentatives de login en 1 minute
   - Résultat attendu : 429 Too Many Requests

5. **Tester Google OAuth**
   - Accéder à `/oauth/google/init`
   - Résultat attendu : Redirection vers Google

6. **Tester reset password**
   - Appeler `/reset/request-reset-link?email=test@example.fr`
   - Résultat attendu : Magic link envoyé par email

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 02-xano-tables-principales | Table user doit exister avec champs métier |
| 05-xano-tables-systeme | Table audit_log pour tracer les logins |

### Bloque

| Task | Raison |
|------|--------|
| 07-xano-endpoints | Endpoints protégés par auth |
| 08-client-xano | Client doit gérer les tokens |
| 09-auth-login-register | Pages frontend d'auth |

---

## Documentation liée

- **ARCHI** : Section Authentication
- **PROJECT_PLAN** : Section 3.1 Routes Auth

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Ne pas exposer les passwords** : Vérifier que le champ password n'est jamais retourné
- **Google OAuth redirect** : Les URLs doivent correspondre exactement
- **Rate limiting** : Essentiel pour la sécurité

### 💡 Suggestions

- Garder l'email verification désactivé pour MVP (friction utilisateur)
- Le RPPS peut être ajouté après inscription (profil)
- Prévoir un endpoint pour changer le password

### 🔒 Sécurité

- Passwords hashés avec bcrypt (natif Xano)
- Tokens JWT signés
- Refresh tokens pour sessions longues
- Audit trail des connexions

### 📡 Endpoints API existants (swagger)

**Authentication :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/auth/signup` | POST | Inscription (email, password, name) |
| `/auth/login` | POST | Connexion (email, password) → authToken, user_id |
| `/auth/me` | GET | Profil utilisateur connecté |
| `/auth/logout` | POST | Déconnexion |
| `/auth/refresh` | POST | Rafraîchir le token → authToken |

**Reset Password :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/reset/request-reset-link` | GET | Demander magic link (email) |
| `/reset/magic-link-login` | POST | Échanger magic_token + email → authToken |
| `/reset/update_password` | POST | Mettre à jour (password, confirm_password) |

**Google OAuth :**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/oauth/google/init` | GET | Initier le flow OAuth |
| `/oauth/google/continue` | GET | Callback après Google |
| `/oauth/google/login` | GET | Login uniquement (code, redirect_uri) → token |
| `/oauth/google/signup` | GET | Signup uniquement (code, redirect_uri) → token |
