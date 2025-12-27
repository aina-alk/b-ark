# Task 10: Auth - OAuth & Reset Password

> **Durée estimée** : 1.5h  
> **Phase** : Frontend Foundation  
> **Feature PRD** : Authentification complète

## Contexte

Cette tâche complète les flows d'authentification avec Google OAuth et la récupération de mot de passe. Ces fonctionnalités améliorent l'UX et réduisent les frictions à l'inscription.

## Objectif

Implémenter le bouton Google OAuth et les pages forgot/reset password.

## Scope

### Inclus ✅
- Bouton "Continuer avec Google" sur login/register
- Page `/forgot-password`
- Page `/reset-password`
- Callback OAuth

### Exclus ❌
- Autres providers OAuth (GitHub, Apple)
- Email verification

---

## Implémentation

### Étape 1 : Composant GoogleAuthButton

**src/features/auth/components/google-auth-button.tsx**
```typescript
'use client';

import { Button } from '@/components/ui/button';

const XANO_API_URL = process.env.NEXT_PUBLIC_XANO_API_URL;

interface GoogleAuthButtonProps {
  mode?: 'login' | 'signup';
}

export function GoogleAuthButton({ mode = 'login' }: GoogleAuthButtonProps) {
  const handleGoogleAuth = () => {
    // Redirect vers l'endpoint OAuth de Xano
    // /oauth/google/init initie le flow, puis redirige vers /oauth/google/login ou /oauth/google/signup
    window.location.href = `${XANO_API_URL}/oauth/google/init`;
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleGoogleAuth}
      type="button"
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continuer avec Google
    </Button>
  );
}
```

### Étape 2 : Callback OAuth

**app/api/auth/callback/google/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (token) {
    // Redirect avec le token vers une page qui le stockera côté client
    return NextResponse.redirect(
      new URL(`/auth/callback?token=${token}`, request.url)
    );
  }

  return NextResponse.redirect(new URL('/login?error=no_token', request.url));
}
```

**app/auth/callback/page.tsx**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setXanoToken } from '@/lib/xano';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      setXanoToken(token);
      router.push('/dashboard');
    } else {
      router.push('/login?error=auth_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}
```

### Étape 3 : Mettre à jour LoginForm et RegisterForm

Ajouter dans les deux formulaires, après le bouton submit :

```typescript
import { GoogleAuthButton } from './google-auth-button';

// Dans CardFooter, ajouter :
<div className="relative w-full">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-background px-2 text-muted-foreground">
      ou
    </span>
  </div>
</div>

<GoogleAuthButton />
```

### Étape 4 : Page Forgot Password

**src/features/auth/components/forgot-password-form.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { xano } from '@/lib/xano';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setStatus('loading');
    setError(null);

    try {
      // GET /reset/request-reset-link?email=... → Envoie un magic link par email
      await xano.get('/reset/request-reset-link', { email: data.email });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-center">Email envoyé</CardTitle>
          <CardDescription className="text-center">
            Si un compte existe avec cette adresse, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien de réinitialisation
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer le lien
          </Button>

          <Link href="/login" className="text-sm text-primary hover:underline">
            Retour à la connexion
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### Étape 5 : Page Reset Password (Magic Link Flow)

Le flow magic link fonctionne en 2 étapes :
1. Échanger le `magic_token` contre un `authToken` via `/reset/magic-link-login`
2. Mettre à jour le password via `/reset/update_password` (authentifié)

**src/features/auth/components/reset-password-form.tsx**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { xano, setXanoToken } from '@/lib/xano';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const magicToken = searchParams.get('magic_token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'validating' | 'ready' | 'loading' | 'error'>('validating');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Étape 1: Échanger le magic_token contre un authToken
  useEffect(() => {
    async function validateMagicToken() {
      if (!magicToken || !email) {
        setStatus('error');
        setError('Lien invalide ou expiré');
        return;
      }

      try {
        // POST /reset/magic-link-login → {authToken}
        const response = await xano.post<{ authToken: string }>('/reset/magic-link-login', {
          magic_token: magicToken,
          email: email,
        });

        // Stocker le token pour l'appel update_password
        setXanoToken(response.authToken);
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setError('Le lien a expiré ou est invalide.');
      }
    }

    validateMagicToken();
  }, [magicToken, email]);

  // Étape 2: Mettre à jour le password
  async function onSubmit(data: ResetPasswordInput) {
    setStatus('loading');
    setError(null);

    try {
      // POST /reset/update_password (authentifié)
      await xano.post('/reset/update_password', {
        password: data.password,
        confirm_password: data.confirm_password,
      });

      // Redirect vers login avec message de succès
      router.push('/login?message=password_reset');
    } catch (err) {
      setStatus('error');
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
  }

  if (status === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === 'error' && !form.formState.isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>
            {error || 'Ce lien de réinitialisation est invalide ou a expiré.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/forgot-password')} className="w-full">
            Demander un nouveau lien
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez votre nouveau mot de passe
        </CardDescription>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmer</Label>
            <Input
              id="confirm_password"
              type="password"
              {...form.register('confirm_password')}
            />
            {form.formState.errors.confirm_password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirm_password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Réinitialiser
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### Étape 6 : Pages

**app/(public)/forgot-password/page.tsx**
```typescript
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <ForgotPasswordForm />
    </div>
  );
}
```

**app/(public)/reset-password/page.tsx**
```typescript
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Bouton Google OAuth redirige vers Xano
- [ ] Callback OAuth stocke le token et redirige
- [ ] Forgot password envoie l'email (ou simule)
- [ ] Reset password fonctionne avec token valide

### Techniques
- [ ] Gestion des erreurs OAuth
- [ ] Token passé de manière sécurisée
- [ ] Pages Suspense pour searchParams

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 06-xano-auth | OAuth configuré côté Xano |
| 09-auth-login-register | Formulaires de base |

### Bloque

| Task | Raison |
|------|--------|
| 11-auth-guards | Auth complète pour les guards |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Magic Link Flow** : Le reset password utilise un magic_token + email, pas un simple token
- **OAuth Callback** : Xano gère le callback, le frontend récupère le token dans l'URL
- **Authentification temporaire** : Le magic-link-login retourne un authToken pour permettre l'update_password

### 💡 Suggestions

- Stocker temporairement le token après magic-link-login (pas en localStorage permanent)
- Nettoyer le token après update_password réussi
- Afficher un message de succès sur la page login après reset

---

## 📡 Endpoints API utilisés (swagger)

### Google OAuth

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/oauth/google/init` | GET | Initier le flow OAuth Google |
| `/oauth/google/continue` | GET | Callback après auth Google |
| `/oauth/google/login` | GET | Login utilisateur existant (code, redirect_uri) → token |
| `/oauth/google/signup` | GET | Signup nouvel utilisateur (code, redirect_uri) → token |

### Reset Password (Magic Link)

| Endpoint | Méthode | Input | Output |
|----------|---------|-------|--------|
| `/reset/request-reset-link` | GET | `?email=...` | Envoie magic link par email |
| `/reset/magic-link-login` | POST | `{magic_token, email}` | `{authToken}` |
| `/reset/update_password` | POST | `{password, confirm_password}` | Success (requiert auth) |

### Flow complet Reset Password

```
1. User demande reset → GET /reset/request-reset-link?email=user@email.com
2. User reçoit email avec lien: /reset-password?magic_token=xxx&email=user@email.com
3. Page échange token → POST /reset/magic-link-login {magic_token, email} → authToken
4. Page met à jour mdp → POST /reset/update_password {password, confirm_password}
5. Redirect vers /login avec message succès
```
