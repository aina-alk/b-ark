# Task 34-36: Admin - Dashboard, Users, Analytics

> **Durée estimée** : 5h  
> **Phase** : Admin  
> **Feature PRD** : Administration et conformité HDS

## Contexte

L'interface admin permet de gérer les utilisateurs médecins, visualiser les statistiques d'usage, et consulter les logs d'audit pour la conformité HDS.

## Objectif

Créer l'espace administrateur complet avec dashboard, gestion users et audit.

---

## Task 34 : Admin Dashboard & Stats — 2h

### Page Dashboard Admin

**app/(admin)/admin/page.tsx**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Activity, AlertTriangle } from 'lucide-react';
import { xano } from '@/lib/xano';

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => xano.get('/admin/dashboard'),
  });

  const statCards = [
    {
      title: 'Médecins actifs',
      value: stats?.active_doctors || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Documents ce mois',
      value: stats?.documents_this_month || 0,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: 'Consultations aujourd\'hui',
      value: stats?.consultations_today || 0,
      icon: Activity,
      color: 'text-purple-600',
    },
    {
      title: 'Alertes actives',
      value: stats?.active_alerts || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Administration</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphiques d'usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activité mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Chart component - à implémenter avec recharts */}
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Graphique d'activité
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Graphique répartition
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Task 35 : Gestion Users — 1.5h

### Page Liste Users

**app/(admin)/admin/users/page.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, UserCheck, UserX, Eye } from 'lucide-react';
import { xano } from '@/lib/xano';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Doctor, PaginatedResponse } from '@/types/xano';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => xano.get<PaginatedResponse<Doctor>>('/admin/users', { search }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: number) => 
      xano.patch(`/admin/users/${userId}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Statut modifié');
    },
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des médecins</h1>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>RPPS</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.rpps || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login_at 
                      ? new Date(user.last_login_at).toLocaleDateString('fr-FR')
                      : 'Jamais'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleActiveMutation.mutate(user.id)}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Task 36 : Analytics & Audit — 1.5h

### Page Audit Logs

**app/(admin)/admin/audit/page.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Download } from 'lucide-react';
import { xano } from '@/lib/xano';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  read: 'bg-blue-100 text-blue-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  export: 'bg-orange-100 text-orange-800',
};

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', actionFilter, entityFilter, dateRange],
    queryFn: () => xano.get('/admin/audit-logs', {
      action: actionFilter !== 'all' ? actionFilter : undefined,
      entity_type: entityFilter || undefined,
      date_from: dateRange.from?.toISOString(),
      date_to: dateRange.to?.toISOString(),
      per_page: 50,
    }),
  });

  const exportLogs = async () => {
    // Exporter en CSV
    const csv = logs?.items.map((log: any) => 
      `${log.created_at},${log.doctor_id},${log.action},${log.entity_type},${log.entity_id}`
    ).join('\n');
    
    const blob = new Blob([`Date,Doctor ID,Action,Entity,Entity ID\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Logs d'audit</h1>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex gap-4 flex-wrap">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="create">Création</SelectItem>
                <SelectItem value="read">Lecture</SelectItem>
                <SelectItem value="update">Modification</SelectItem>
                <SelectItem value="delete">Suppression</SelectItem>
                <SelectItem value="login">Connexion</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Type d'entité (patient, consultation...)"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-[200px]"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    'Période'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Table logs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead>ID Entité</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.items.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>{log.doctor_id}</TableCell>
                  <TableCell>
                    <Badge className={ACTION_COLORS[log.action] || ''}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.entity_type}</TableCell>
                  <TableCell>{log.entity_id}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.ip_address || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] Dashboard avec stats temps réel
- [ ] Liste users avec filtres
- [ ] Activation/désactivation users
- [ ] Logs d'audit consultables
- [ ] Export CSV des logs

### Conformité HDS
- [ ] Traçabilité complète des accès
- [ ] Logs immutables
- [ ] Conservation 2 ans minimum

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 05 | Tables audit_log |
| 07 | Endpoints admin |
| 11 | Auth guards role admin |

### Bloque

| Task | Raison |
|------|--------|
| 41 | Deployment |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Route admin** : Utiliser le layout `(admin)` avec `requiredRole="admin"`
- **Type User** : Utiliser `User` (pas `Doctor`) depuis `@/types/xano`
- **Rôle** : Vérifier `user.role === 'admin'` (pas `'doctor'`)

### 💡 Suggestions

- Ajouter des graphiques avec recharts
- Implémenter la pagination pour les logs

---

## 📡 Endpoints API utilisés (swagger)

### Dashboard Admin

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/admin/dashboard` | GET | Stats globales | ✅ Bearer (admin) |
| `/admin/analytics` | GET | Données analytics détaillées | ✅ Bearer (admin) |

### Gestion Utilisateurs

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/admin/users` | GET | Liste des utilisateurs | ✅ Bearer (admin) |
| `/admin/users/{id}` | GET | Détails d'un utilisateur | ✅ Bearer (admin) |
| `/admin/users/{id}/toggle-active` | PATCH | Activer/désactiver un utilisateur | ✅ Bearer (admin) |
| `/admin/users/{id}/activity` | GET | Activité d'un utilisateur | ✅ Bearer (admin) |

### Audit Logs

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/admin/audit-logs` | GET | Logs d'audit avec filtres | ✅ Bearer (admin) |
| `/logs/admin/account_events` | GET | Événements compte admin | ✅ Bearer (admin) |
