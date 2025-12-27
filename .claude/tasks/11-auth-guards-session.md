# Task 11: Auth - Guards & Session

> **Durée estimée** : 1.5h  
> **Phase** : Frontend Foundation  
> **Feature PRD** : Protection des routes

## Contexte

Cette tâche implémente la protection des routes authentifiées et la gestion de session utilisateur. Les guards empêchent l'accès non autorisé aux pages protégées.

## Objectif

Créer les guards d'authentification, le hook useAuth, et le contexte de session.

## Scope

### Inclus ✅
- Hook `useAuth` pour accéder à l'utilisateur connecté
- AuthProvider avec contexte
- Guard pour routes authentifiées
- Guard pour routes admin
- Redirect automatique si non connecté
- Logout fonctionnel

### Exclus ❌
- Refresh token automatique (simplification MVP)

---

## Implémentation

### Étape 1 : AuthContext et Provider

**src/features/auth/context/auth-context.tsx**
```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { xano, initXanoFromStorage, clearXanoToken } from '@/lib/xano';
import type { User } from '@/types/xano';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      initXanoFromStorage();
      const token = xano.getAuthToken();

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // GET /auth/me → User
      const response = await xano.get<User>('/auth/me');
      setUser(response);
    } catch (error) {
      // Token invalide ou expiré
      clearXanoToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      // POST /auth/logout
      await xano.post('/auth/logout');
    } catch (error) {
      // Ignorer les erreurs de logout
    } finally {
      clearXanoToken();
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Étape 2 : Mettre à jour Providers

**app/providers.tsx** - Ajouter AuthProvider :
```typescript
'use client';

import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/features/auth/context/auth-context';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Étape 3 : Composant AuthGuard

**src/features/auth/components/auth-guard.tsx**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Pas le bon rôle
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
```

### Étape 4 : Layout Authenticated

**app/(authenticated)/layout.tsx**
```typescript
import { AuthGuard } from '@/features/auth/components/auth-guard';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

### Étape 5 : Layout Admin

**app/(admin)/layout.tsx**
```typescript
import { AuthGuard } from '@/features/auth/components/auth-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard requiredRole="admin">{children}</AuthGuard>;
}
```

### Étape 6 : Hook useRequireAuth (optionnel)

**src/features/auth/hooks/use-require-auth.ts**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
```

### Étape 7 : Composant UserMenu

**src/features/auth/components/user-menu.tsx**
```typescript
'use client';

import { useAuth } from '../context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden md:inline text-sm font-medium">
          {user.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <User className="mr-2 h-4 w-4" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Routes `/dashboard/*` redirigent vers `/login` si non connecté
- [ ] Routes `/admin/*` redirigent si pas admin
- [ ] UserMenu affiche le nom et permet logout
- [ ] Logout supprime le token et redirige

### Techniques
- [ ] AuthContext disponible partout
- [ ] Loading state pendant vérification auth
- [ ] Pas de flash de contenu protégé

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 08-client-xano | Client pour /auth/me |
| 09-10 | Auth flows complets |

### Bloque

| Task | Raison |
|------|--------|
| 12-layout-navigation | UserMenu dans le header |
| Toutes les features | Routes protégées |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Type User** : Utiliser `User` (pas `Doctor`) depuis `@/types/xano`
- **Rôles** : Les rôles sont `'user' | 'admin'` (pas `'doctor'`)
- **Pas d'avatar** : Le type `User` n'a pas de champ `avatar_url`
- **Logout API** : Appeler `/auth/logout` avant de clear le token local

### 💡 Suggestions

- Ajouter un refresh token automatique en interceptant les 401
- Stocker le user dans React Query pour bénéficier du cache
- Ajouter un timestamp d'expiration pour invalider le token côté client

---

## 📡 Endpoints API utilisés (swagger)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/auth/me` | GET | Récupérer le profil utilisateur connecté | ✅ Bearer |
| `/auth/logout` | POST | Déconnecter l'utilisateur (invalider token) | ✅ Bearer |
| `/auth/refresh` | POST | Rafraîchir le token (si implémenté) | ✅ Bearer |

### Type User retourné par /auth/me

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  rpps: string | null;
  specialty: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}
```
