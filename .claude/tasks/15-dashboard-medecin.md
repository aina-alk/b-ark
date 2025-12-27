# Task 15: Dashboard Médecin

> **Durée estimée** : 2h  
> **Phase** : UI Base  
> **Feature PRD** : Vue d'ensemble activité

## Contexte

Le dashboard est la première page vue après connexion. Il affiche les statistiques clés, les consultations récentes et les actions rapides.

## Objectif

Créer le dashboard avec stats, activité récente et raccourcis.

## Scope

### Inclus ✅
- Stats cards (patients, consultations ce mois, documents en attente)
- Liste des 5 dernières consultations
- Liste des 5 derniers documents
- Boutons d'action rapide
- Hook de fetching des données

### Exclus ❌
- Graphiques avancés (post-MVP)
- Notifications

---

## Implémentation

### Étape 1 : Hook pour les données dashboard

**src/features/dashboard/hooks/use-dashboard.ts**
```typescript
import { useQuery } from '@tanstack/react-query';
import { xano } from '@/lib/xano';

interface DashboardStats {
  total_patients: number;
  consultations_this_month: number;
  interventions_this_month: number;
  documents_pending_validation: number;
}

interface DashboardData {
  stats: DashboardStats;
  recent_consultations: Array<{
    id: number;
    date: string;
    patient: { ipp: number };
    status: string;
    motif: string | null;
  }>;
  recent_documents: Array<{
    id: number;
    type: string;
    title: string | null;
    created_at: string;
    validated: boolean;
  }>;
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [stats, consultations, documents] = await Promise.all([
        xano.get<DashboardStats>('/dashboard/stats'),
        xano.get<DashboardData['recent_consultations']>('/dashboard/recent-consultations'),
        xano.get<DashboardData['recent_documents']>('/dashboard/recent-documents'),
      ]);

      return {
        stats,
        recent_consultations: consultations,
        recent_documents: documents,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
```

### Étape 2 : Composants Dashboard

**src/features/dashboard/components/stats-cards.tsx**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Stethoscope, Scissors, FileText } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total_patients: number;
    consultations_this_month: number;
    interventions_this_month: number;
    documents_pending_validation: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Patients',
      value: stats.total_patients,
      icon: Users,
      description: 'Total patients suivis',
    },
    {
      title: 'Consultations',
      value: stats.consultations_this_month,
      icon: Stethoscope,
      description: 'Ce mois-ci',
    },
    {
      title: 'Interventions',
      value: stats.interventions_this_month,
      icon: Scissors,
      description: 'Ce mois-ci',
    },
    {
      title: 'À valider',
      value: stats.documents_pending_validation,
      icon: FileText,
      description: 'Documents en attente',
      highlight: stats.documents_pending_validation > 0,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.highlight ? 'border-primary' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**src/features/dashboard/components/recent-consultations.tsx**
```typescript
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Consultation {
  id: number;
  date: string;
  patient: { ipp: number };
  status: string;
  motif: string | null;
}

interface RecentConsultationsProps {
  consultations: Consultation[];
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  in_progress: 'En cours',
  completed: 'Terminé',
  validated: 'Validé',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  validated: 'default',
};

export function RecentConsultations({ consultations }: RecentConsultationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Consultations récentes</CardTitle>
        <Link href="/consultations">
          <Button variant="ghost" size="sm" className="gap-1">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {consultations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune consultation récente
          </p>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <Link
                key={consultation.id}
                href={`/consultations/${consultation.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">Patient #{consultation.patient.ipp}</p>
                  <p className="text-sm text-muted-foreground">
                    {consultation.motif || 'Sans motif'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={statusVariants[consultation.status]}>
                    {statusLabels[consultation.status]}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(consultation.date), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**src/features/dashboard/components/quick-actions.tsx**
```typescript
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Mic, UserPlus, FileText } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      href: '/consultations/new',
      icon: Mic,
      label: 'Nouvelle consultation',
      variant: 'default' as const,
    },
    {
      href: '/interventions/new',
      icon: Plus,
      label: 'Nouvelle intervention',
      variant: 'outline' as const,
    },
    {
      href: '/patients/new',
      icon: UserPlus,
      label: 'Nouveau patient',
      variant: 'outline' as const,
    },
    {
      href: '/documents',
      icon: FileText,
      label: 'Mes documents',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button variant={action.variant} className="w-full gap-2 h-auto py-3">
              <action.icon className="h-4 w-4" />
              <span className="text-sm">{action.label}</span>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Étape 3 : Page Dashboard

**app/(authenticated)/dashboard/page.tsx**
```typescript
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { StatsCards } from '@/features/dashboard/components/stats-cards';
import { RecentConsultations } from '@/features/dashboard/components/recent-consultations';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user?.name.split(' ')[0] || 'Docteur'}`}
        description="Voici un aperçu de votre activité"
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : data ? (
        <div className="space-y-6">
          <StatsCards stats={data.stats} />
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentConsultations consultations={data.recent_consultations} />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Erreur de chargement</p>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Stats affichées correctement
- [ ] Consultations récentes cliquables
- [ ] Actions rapides fonctionnelles
- [ ] Loading state pendant fetch

### Techniques
- [ ] TanStack Query pour le cache
- [ ] Refresh automatique toutes les 2 minutes
- [ ] Responsive design

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 07-xano-endpoints | Endpoints /dashboard/* |
| 08-client-xano | TanStack Query configuré |
| 12-layout-navigation | Layout avec sidebar |

### Bloque

| Task | Raison |
|------|--------|
| Aucune directement | Mais point d'entrée principal |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Auth requis** : Tous les endpoints dashboard nécessitent un Bearer token
- **Données liées au user** : Les endpoints retournent uniquement les données du médecin connecté
- **Types de réponse** : Le swagger ne détaille pas les schémas de réponse (object générique), se baser sur les types définis dans la task

---

## 📡 Endpoints API utilisés (swagger)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/dashboard/stats` | GET | Statistiques du médecin (patients, consultations, interventions, documents) | ✅ Bearer |
| `/dashboard/recent-consultations` | GET | 5 dernières consultations | ✅ Bearer |
| `/dashboard/recent-documents` | GET | 5 derniers documents | ✅ Bearer |

### Types de réponse attendus

```typescript
// GET /dashboard/stats
interface DashboardStats {
  total_patients: number;
  consultations_this_month: number;
  interventions_this_month: number;
  documents_pending_validation: number;
}

// GET /dashboard/recent-consultations
interface RecentConsultation {
  id: number;
  date: string;
  patient: { ipp: number };
  status: 'draft' | 'in_progress' | 'completed' | 'validated';
  motif: string | null;
}

// GET /dashboard/recent-documents
interface RecentDocument {
  id: number;
  type: 'cr_consultation' | 'cr_operatoire' | 'ordonnance' | 'courrier';
  title: string | null;
  created_at: string;
  validated: boolean;
}
```
