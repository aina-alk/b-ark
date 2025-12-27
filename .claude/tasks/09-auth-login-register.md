# Task 09: Auth - Login & Register

> **Durée estimée** : 2h  
> **Phase** : Frontend Foundation  
> **Feature PRD** : Authentification médecin

## Contexte

Cette tâche crée les pages et formulaires de connexion et d'inscription pour les médecins. Ces pages sont publiques et utilisent l'API Xano Auth configurée précédemment.

## Objectif

Implémenter les pages de login et register avec formulaires validés et gestion des erreurs.

## Scope

### Inclus ✅
- Page `/login` avec formulaire
- Page `/register` avec formulaire
- Validation Zod des inputs
- Gestion des erreurs API
- Redirect après connexion
- Lien entre les deux pages

### Exclus ❌
- Google OAuth (Task 10)
- Forgot/Reset password (Task 10)
- Guards d'authentification (Task 11)

---

## Implémentation

### Étape 1 : Installation Zod et React Hook Form

```bash
pnpm add zod @hookform/resolvers react-hook-form
```

### Étape 2 : Schémas de validation

**src/features/auth/schemas.ts**
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmation requise'),
  name: z
    .string()
    .min(2, 'Nom requis (min 2 caractères)'),
  rpps: z
    .string()
    .regex(/^\d{11}$/, 'RPPS doit contenir 11 chiffres')
    .optional()
    .or(z.literal('')),
  specialty: z
    .string()
    .default('ORL'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

### Étape 3 : Actions d'authentification

**src/features/auth/actions/login.ts**
```typescript
'use server';

import { xano } from '@/lib/xano';
import { loginSchema, LoginInput } from '../schemas';
import type { AuthResponse } from '@/types/xano';

export async function loginAction(input: LoginInput) {
  // Valider les inputs
  const validated = loginSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // POST /auth/login → {authToken, user_id}
    const response = await xano.post<AuthResponse>('/auth/login', {
      email: input.email,
      password: input.password,
    });

    return {
      success: true,
      token: response.authToken,
      userId: response.user_id,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Gérer les erreurs spécifiques
      if (error.message.includes('Invalid credentials')) {
        return { error: 'Email ou mot de passe incorrect' };
      }
      if (error.message.includes('Account disabled')) {
        return { error: 'Compte désactivé. Contactez l\'administrateur.' };
      }
      return { error: error.message };
    }
    return { error: 'Une erreur est survenue' };
  }
}
```

**src/features/auth/actions/register.ts**
```typescript
'use server';

import { xano } from '@/lib/xano';
import { registerSchema, RegisterInput } from '../schemas';
import type { AuthResponse } from '@/types/xano';

export async function registerAction(input: RegisterInput) {
  // Valider les inputs
  const validated = registerSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // POST /auth/signup → {authToken, user_id}
    // Note: rpps et specialty sont ajoutés directement en base après création
    const response = await xano.post<AuthResponse>('/auth/signup', {
      email: input.email,
      password: input.password,
      name: input.name,
      rpps: input.rpps || null,
      specialty: input.specialty,
    });

    return {
      success: true,
      token: response.authToken,
      userId: response.user_id,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return { error: 'Cet email est déjà utilisé' };
      }
      return { error: error.message };
    }
    return { error: 'Une erreur est survenue' };
  }
}
```

### Étape 4 : Composant LoginForm

**src/features/auth/components/login-form.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

import { loginSchema, LoginInput } from '../schemas';
import { loginAction } from '../actions/login';
import { setXanoToken } from '@/lib/xano';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setError(null);

    const result = await loginAction(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.success && result.token) {
      setXanoToken(result.token);
      router.push('/dashboard');
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à votre espace
        </CardDescription>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="dr.martin@email.fr"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="text-sm text-right">
            <Link 
              href="/forgot-password" 
              className="text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary hover:underline">
              S'inscrire
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### Étape 5 : Composant RegisterForm

**src/features/auth/components/register-form.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

import { registerSchema, RegisterInput } from '../schemas';
import { registerAction } from '../actions/register';
import { setXanoToken } from '@/lib/xano';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      rpps: '',
      specialty: 'ORL',
    },
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    setError(null);

    const result = await registerAction(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.success && result.token) {
      setXanoToken(result.token);
      router.push('/dashboard');
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Inscription</CardTitle>
        <CardDescription>
          Créez votre compte médecin pour commencer
        </CardDescription>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              placeholder="Dr. Martin Dupont"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="dr.martin@email.fr"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rpps">Numéro RPPS (optionnel)</Label>
            <Input
              id="rpps"
              placeholder="12345678901"
              {...form.register('rpps')}
            />
            {form.formState.errors.rpps && (
              <p className="text-sm text-destructive">
                {form.formState.errors.rpps.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer mon compte
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### Étape 6 : Pages Login et Register

**app/(public)/login/page.tsx**
```typescript
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <LoginForm />
    </div>
  );
}
```

**app/(public)/register/page.tsx**
```typescript
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <RegisterForm />
    </div>
  );
}
```

**app/(public)/layout.tsx**
```typescript
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Page `/login` accessible et formulaire fonctionnel
- [ ] Page `/register` accessible et formulaire fonctionnel
- [ ] Validation en temps réel des champs
- [ ] Messages d'erreur clairs
- [ ] Redirect vers `/dashboard` après connexion

### Techniques
- [ ] Zod validation côté client
- [ ] Server Actions pour les appels API
- [ ] Token stocké dans localStorage après connexion
- [ ] TypeScript sans erreur

---

## Tests & Validation

### Tests manuels

1. **Test login invalide**
   - Entrer un email/password incorrect
   - Résultat attendu : Message "Email ou mot de passe incorrect"

2. **Test login valide**
   - Utiliser un compte créé via Xano
   - Résultat attendu : Redirect vers /dashboard

3. **Test register**
   - Créer un nouveau compte
   - Résultat attendu : Compte créé, redirect vers /dashboard

4. **Test validation**
   - Password trop court
   - Résultat attendu : Message d'erreur inline

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 06-xano-auth | Endpoints auth disponibles |
| 08-client-xano | Client pour appels API |

### Bloque

| Task | Raison |
|------|--------|
| 10-auth-oauth-reset | Complète les flows auth |
| 11-auth-guards | Utilise l'état d'auth |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Server Actions** : Les actions s'exécutent côté serveur, pas de `'use client'`
- **Token côté client** : Le setXanoToken doit être appelé côté client (après le return du server action)
- **RPPS optionnel** : Ne pas bloquer l'inscription si pas de RPPS

### 💡 Suggestions

- Ajouter un bouton "Afficher/Masquer" pour les passwords
- Considérer un `remember me` checkbox
- Analytics event sur inscription réussie

---

## 📡 Endpoints API utilisés (swagger)

| Endpoint | Méthode | Input | Output |
|----------|---------|-------|--------|
| `/auth/login` | POST | `{email, password}` | `{authToken, user_id}` |
| `/auth/signup` | POST | `{email, password, name, rpps?, specialty?}` | `{authToken, user_id}` |
| `/auth/me` | GET | - (Bearer token) | `User` |

**Note importante :** Les endpoints login/signup retournent uniquement `authToken` et `user_id`. Pour obtenir le profil complet de l'utilisateur, il faut appeler `/auth/me` après authentification.
