# Task 37-40: Polish - Settings, Error Handling, Loading States, Responsive

> **Durée estimée** : 4.5h  
> **Phase** : Polish  
> **Feature PRD** : Expérience utilisateur optimale

## Contexte

Ces tâches finalisent l'expérience utilisateur avec les paramètres, la gestion d'erreurs globale, les états de chargement/vides, et l'adaptation responsive.

---

## Task 37 : Settings Utilisateur — 1h

### Page Settings

**app/(authenticated)/settings/page.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { xano } from '@/lib/xano';
import { toast } from 'sonner';

const settingsSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  rpps: z.string().optional(),
  signature: z.string().optional(),
  notifications_email: z.boolean(),
  notifications_push: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  default_template_cr: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      rpps: user?.rpps || '',
      signature: user?.settings?.signature || '',
      notifications_email: user?.settings?.notifications_email ?? true,
      notifications_push: user?.settings?.notifications_push ?? false,
      theme: user?.settings?.theme || 'system',
      default_template_cr: user?.settings?.default_template_cr || '',
    },
  });

  // PATCH /user/edit_profile (pas /auth/me)
  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormData) =>
      xano.patch('/user/edit_profile', {
        name: data.name,
        rpps: data.rpps,
        settings: {
          signature: data.signature,
          notifications_email: data.notifications_email,
          notifications_push: data.notifications_push,
          theme: data.theme,
          default_template_cr: data.default_template_cr,
        },
      }),
    onSuccess: () => {
      refreshUser();
      toast.success('Paramètres enregistrés');
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}>
        {/* Profil */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Informations affichées sur vos documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="rpps">Numéro RPPS</Label>
              <Input id="rpps" {...form.register('rpps')} placeholder="Optionnel" />
            </div>
            <div>
              <Label htmlFor="signature">Signature</Label>
              <Textarea
                id="signature"
                {...form.register('signature')}
                placeholder="Dr. Jean Dupont&#10;ORL - Chirurgie cervico-faciale&#10;RPPS: 12345678901"
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Apparaîtra en bas de vos documents
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les alertes importantes par email
                </p>
              </div>
              <Switch
                checked={form.watch('notifications_email')}
                onCheckedChange={(checked) => form.setValue('notifications_email', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications dans le navigateur
                </p>
              </div>
              <Switch
                checked={form.watch('notifications_push')}
                onCheckedChange={(checked) => form.setValue('notifications_push', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => form.setValue('theme', theme)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    form.watch('theme') === theme
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:bg-muted/50'
                  }`}
                >
                  {theme === 'light' && '☀️ Clair'}
                  {theme === 'dark' && '🌙 Sombre'}
                  {theme === 'system' && '💻 Système'}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
```

---

## Task 38 : Error Handling Global — 1h

### Error Boundary

**src/components/error-boundary.tsx**
```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log vers Sentry en production
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Une erreur est survenue</h2>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            Nous sommes désolés, quelque chose s'est mal passé. Veuillez réessayer.
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handler

**src/lib/api-error.ts**
```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof Response) {
    throw new ApiError(error.status, 'Erreur serveur');
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      throw new ApiError(0, 'Erreur de connexion. Vérifiez votre réseau.');
    }
    throw new ApiError(500, error.message);
  }

  throw new ApiError(500, 'Erreur inconnue');
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'Session expirée. Veuillez vous reconnecter.';
      case 403:
        return 'Accès non autorisé.';
      case 404:
        return 'Ressource non trouvée.';
      case 422:
        return error.message || 'Données invalides.';
      case 429:
        return 'Trop de requêtes. Veuillez patienter.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer.';
      default:
        return error.message;
    }
  }
  return 'Une erreur est survenue.';
}
```

### Toast Error Provider

**src/components/toast-error-handler.tsx**
```typescript
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api-error';

export function ToastErrorHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Global error handler pour les mutations
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event?.mutation?.state.status === 'error') {
        const error = event.mutation.state.error;
        toast.error(getErrorMessage(error));
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return null;
}
```

---

## Task 39 : Loading & Empty States — 1h

### Skeleton Components

**src/components/ui/skeleton-card.tsx**
```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Empty States

**src/components/empty-state.tsx**
```typescript
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
```

### Usage Examples

```typescript
// Dans une page avec liste
{isLoading ? (
  <SkeletonList items={5} />
) : data?.items.length === 0 ? (
  <EmptyState
    icon={<FileText className="h-8 w-8 text-muted-foreground" />}
    title="Aucun document"
    description="Vous n'avez pas encore créé de document. Commencez par une consultation."
    action={{
      label: 'Nouvelle consultation',
      onClick: () => router.push('/consultation/new'),
    }}
  />
) : (
  <DocumentList items={data.items} />
)}
```

---

## Task 40 : Responsive & Mobile — 1.5h

### Mobile Navigation

**src/components/layout/mobile-nav.tsx**
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Home, Users, FileText, Stethoscope, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Accueil', icon: Home },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/consultation/new', label: 'Consultation', icon: Stethoscope },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="font-semibold">ORL Consultation</h2>
            <p className="text-sm text-muted-foreground">{user?.name}</p>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Responsive Utils

**src/hooks/use-media-query.ts**
```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet() {
  return useMediaQuery('(max-width: 1024px)');
}
```

### Responsive Table

**src/components/responsive-table.tsx**
```typescript
'use client';

import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-media-query';
import { Card, CardContent } from '@/components/ui/card';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (item: T) => ReactNode;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T extends { id: number | string }>({
  data,
  columns,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Vue cards sur mobile
    return (
      <div className="space-y-4">
        {data.map((item) => (
          <Card
            key={item.id}
            className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="py-4">
              {columns.map((col) => (
                <div key={String(col.key)} className="flex justify-between py-1">
                  <span className="text-muted-foreground text-sm">{col.label}</span>
                  <span className="font-medium">
                    {col.render ? col.render(item) : String(item[col.key])}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Vue table sur desktop
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          {columns.map((col) => (
            <th key={String(col.key)} className="text-left py-3 px-4 font-medium">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr
            key={item.id}
            className={`border-b ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <td key={String(col.key)} className="py-3 px-4">
                {col.render ? col.render(item) : String(item[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Critères de succès

### Task 37 - Settings
- [ ] Profil éditable
- [ ] Préférences notifications
- [ ] Thème light/dark/system

### Task 38 - Errors
- [ ] ErrorBoundary capture les erreurs
- [ ] Messages d'erreur clairs
- [ ] Toast automatiques sur erreur API

### Task 39 - Loading
- [ ] Skeletons pendant chargement
- [ ] Empty states informatifs
- [ ] Transitions fluides

### Task 40 - Responsive
- [ ] Navigation mobile
- [ ] Tables adaptatives
- [ ] Touch-friendly

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 12 | Layout de base |
| 08 | Providers TanStack Query |

### Bloque

| Task | Raison |
|------|--------|
| 41 | Deployment |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Endpoint profil** : Utiliser `PATCH /user/edit_profile` (pas `/auth/me`)
- **Type User** : Utiliser `User` depuis `@/types/xano` (pas `Doctor`)
- **Settings field** : Le champ `settings` est un objet JSON dans la table user

### 💡 Suggestions

- Ajouter une validation du format RPPS (11 chiffres)
- Implémenter le thème dark/light avec next-themes

---

## 📡 Endpoints API utilisés (swagger)

### Settings

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/auth/me` | GET | Récupérer le profil utilisateur | ✅ Bearer |
| `/user/edit_profile` | PATCH | Modifier le profil et les paramètres | ✅ Bearer |

### Notes techniques

- La Mobile Nav réutilise les composants définis dans Task 12
- L'ErrorBoundary est un composant React class (pas de hooks)
