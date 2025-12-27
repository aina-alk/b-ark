# Task 12: Layout & Navigation

> **Durée estimée** : 2h  
> **Phase** : Frontend Foundation  
> **Feature PRD** : Interface utilisateur

## Contexte

Cette tâche crée le layout principal de l'application avec sidebar, header et navigation. Ce layout sera utilisé par toutes les pages authentifiées.

## Objectif

Implémenter le layout responsive avec sidebar collapsible, header avec UserMenu, et navigation principale.

## Scope

### Inclus ✅
- Sidebar avec navigation (desktop)
- Header avec logo, search, UserMenu
- Mobile navigation (Sheet)
- Breadcrumbs
- Layout responsive

### Exclus ❌
- Contenu des pages (autres tasks)
- Notifications (post-MVP)

---

## Implémentation

### Étape 1 : Configuration de la navigation

**src/config/navigation.ts**
```typescript
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Scissors,
  FileText,
  Settings,
  Shield,
  BarChart3,
  Pill,
} from 'lucide-react';

export const mainNavigation = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Patients',
    href: '/patients',
    icon: Users,
  },
  {
    title: 'Consultations',
    href: '/consultations',
    icon: Stethoscope,
  },
  {
    title: 'Interventions',
    href: '/interventions',
    icon: Scissors,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Médicaments',
    href: '/medicaments',
    icon: Pill,
  },
];

export const adminNavigation = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
    icon: Shield,
  },
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
];

export const bottomNavigation = [
  {
    title: 'Paramètres',
    href: '/settings',
    icon: Settings,
  },
];
```

### Étape 2 : Composant Sidebar

**src/components/layout/sidebar.tsx**
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/auth-context';
import { useUIStore } from '@/stores/ui-store';
import { mainNavigation, adminNavigation, bottomNavigation } from '@/config/navigation';
import { ChevronLeft, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  const isAdmin = user?.role === 'admin';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          {!sidebarCollapsed && (
            <span className="font-semibold">ORL Consult</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              sidebarCollapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-2 p-4">
          {/* Main Nav */}
          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Admin Nav */}
          {isAdmin && (
            <>
              <Separator className="my-2" />
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}

          {/* Bottom Nav */}
          <div className="mt-auto pt-4">
            <Separator className="mb-4" />
            <nav className="space-y-1">
              {bottomNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
```

### Étape 3 : Composant Header

**src/components/layout/header.tsx**
```typescript
'use client';

import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserMenu } from '@/features/auth/components/user-menu';
import { MobileNav } from './mobile-nav';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function Header() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <header
      className={cn(
        'fixed top-0 z-30 h-16 border-b bg-background transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64',
        'right-0'
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <MobileNav />
          </SheetContent>
        </Sheet>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un patient (IPP)..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
```

### Étape 4 : Mobile Navigation

**src/components/layout/mobile-nav.tsx**
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/auth-context';
import { mainNavigation, adminNavigation, bottomNavigation } from '@/config/navigation';
import { Stethoscope } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SheetClose } from '@/components/ui/sheet';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-semibold">ORL Consult</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </nav>

          {isAdmin && (
            <>
              <Separator className="my-2" />
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </>
          )}

          <Separator className="my-2" />
          <nav className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
        </div>
      </ScrollArea>
    </div>
  );
}
```

### Étape 5 : Layout Authentifié Complet

**app/(authenticated)/layout.tsx**
```typescript
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-muted/30">
        <Sidebar />
        <Header />
        <main className="ml-64 pt-16 p-6 transition-all duration-300 data-[collapsed=true]:ml-16">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
```

### Étape 6 : Composant PageHeader

**src/components/layout/page-header.tsx**
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Sidebar affiche la navigation
- [ ] Sidebar peut être collapsed
- [ ] Header affiche recherche et UserMenu
- [ ] Navigation mobile fonctionne
- [ ] Active state sur les liens

### Techniques
- [ ] Responsive design
- [ ] Transition fluide du collapse
- [ ] Pas de layout shift

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 11-auth-guards | AuthGuard et UserMenu |
| 08-client-xano | UIStore pour collapse state |

### Bloque

| Task | Raison |
|------|--------|
| 15+ | Toutes les pages utilisent ce layout |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Rôle admin** : Vérifier `user?.role === 'admin'` (pas `'doctor'`)
- **Routes vs Endpoints** : Les routes frontend utilisent le pluriel (`/patients`) mais certains endpoints sont au singulier (`/patient`)
- **Sidebar state** : Persister le collapse state dans le UIStore (localStorage)

### 💡 Suggestions

- Ajouter un indicateur de notifications dans le header
- Prévoir un breadcrumb dynamique basé sur la route
- Ajouter un raccourci clavier pour toggle la sidebar (Cmd+B)

---

## 📡 Correspondance Routes Frontend ↔ Endpoints Backend

| Route Frontend | Endpoints Backend | Description |
|---------------|-------------------|-------------|
| `/dashboard` | `/dashboard/*` | Stats et activité récente |
| `/patients` | `/patient`, `/patient/{id}` | CRUD patients |
| `/consultations` | `/consultation(s)/*` | CRUD consultations |
| `/interventions` | `/intervention/*` | CRUD interventions |
| `/documents` | `/document/*` | CRUD documents |
| `/medicaments` | `/medicaments/*` | Recherche médicaments |
| `/settings` | `/user/edit_profile` | Profil utilisateur |
| `/admin` | `/admin/dashboard` | Dashboard admin |
| `/admin/users` | `/admin/users/*` | Gestion utilisateurs |
| `/admin/analytics` | `/admin/analytics` | Analytics |

### Endpoints utilisés par le Header

| Fonctionnalité | Endpoint |
|----------------|----------|
| Recherche patient (IPP) | `/patient-by-ipp?ipp=...` |
| UserMenu (profil) | `/auth/me` |
| Logout | `/auth/logout` |
