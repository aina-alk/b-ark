# Task 16: Patients - Liste & Création

> **Durée estimée** : 2h  
> **Phase** : Core - Patients  
> **Feature PRD** : Gestion des patients

## Contexte

La gestion des patients est centrale dans l'application. Chaque patient est identifié par un IPP (anonyme) et possède des allergies/antécédents importants pour les suggestions de l'IA.

## Objectif

Créer la liste des patients avec filtres et le formulaire de création.

## Scope

### Inclus ✅
- Page liste patients avec recherche par IPP
- Pagination
- Formulaire création patient
- Modal ou page dédiée
- Hooks de fetching

### Exclus ❌
- Historique patient (Task 17)
- Import/export patients

---

## Implémentation

### Étape 1 : Types et Hooks

**src/features/patients/types.ts**
```typescript
import type { Patient, PaginatedResponse } from '@/types/xano';

export type { Patient };

export interface PatientFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export type PatientsResponse = PaginatedResponse<Patient>;
```

**src/features/patients/hooks/use-patients.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { xano } from '@/lib/xano';
import type { Patient, PatientFilters, PatientsResponse } from '../types';

export function usePatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: ['patients', filters],
    queryFn: () => xano.get<PatientsResponse>('/patient', {
      page: filters.page || 1,
      per_page: filters.per_page || 20,
    }),
  });
}

// Recherche par IPP (endpoint dédié)
export function usePatientByIPP(ipp: number | undefined) {
  return useQuery({
    queryKey: ['patients', 'by-ipp', ipp],
    queryFn: () => xano.get<Patient>('/patient-by-ipp', { ipp }),
    enabled: !!ipp,
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => xano.get<Patient>(`/patient/${id}`),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'user_id'>) =>
      xano.post<Patient>('/patient', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Patient> }) =>
      xano.patch<Patient>(`/patient/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => xano.delete(`/patient/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
```

### Étape 2 : Schéma de validation

**src/features/patients/schemas.ts**
```typescript
import { z } from 'zod';

export const patientSchema = z.object({
  ipp: z
    .number({ required_error: 'IPP requis' })
    .int('IPP doit être un entier')
    .positive('IPP doit être positif'),
  allergies: z.array(z.string()).default([]),
  antecedents: z.array(z.string()).default([]),
  notes: z.string().nullable().default(null),
});

export type PatientInput = z.infer<typeof patientSchema>;
```

### Étape 3 : Composant PatientForm

**src/features/patients/components/patient-form.tsx**
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { patientSchema, PatientInput } from '../schemas';

interface PatientFormProps {
  defaultValues?: Partial<PatientInput>;
  onSubmit: (data: PatientInput) => Promise<void>;
  isLoading?: boolean;
}

export function PatientForm({ defaultValues, onSubmit, isLoading }: PatientFormProps) {
  const [newAllergy, setNewAllergy] = useState('');
  const [newAntecedent, setNewAntecedent] = useState('');

  const form = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      ipp: undefined,
      allergies: [],
      antecedents: [],
      notes: '',
      ...defaultValues,
    },
  });

  const allergies = form.watch('allergies');
  const antecedents = form.watch('antecedents');

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      form.setValue('allergies', [...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    form.setValue('allergies', allergies.filter((_, i) => i !== index));
  };

  const addAntecedent = () => {
    if (newAntecedent.trim() && !antecedents.includes(newAntecedent.trim())) {
      form.setValue('antecedents', [...antecedents, newAntecedent.trim()]);
      setNewAntecedent('');
    }
  };

  const removeAntecedent = (index: number) => {
    form.setValue('antecedents', antecedents.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* IPP */}
      <div className="space-y-2">
        <Label htmlFor="ipp">IPP (Identifiant Patient Permanent)</Label>
        <Input
          id="ipp"
          type="number"
          placeholder="Ex: 1001"
          {...form.register('ipp', { valueAsNumber: true })}
        />
        {form.formState.errors.ipp && (
          <p className="text-sm text-destructive">
            {form.formState.errors.ipp.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Identifiant anonyme du patient (depuis votre logiciel métier)
        </p>
      </div>

      {/* Allergies */}
      <div className="space-y-2">
        <Label>Allergies connues</Label>
        <div className="flex gap-2">
          <Input
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="Ajouter une allergie"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
          />
          <Button type="button" variant="outline" size="icon" onClick={addAllergy}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allergies.map((allergy, index) => (
            <Badge key={index} variant="destructive" className="gap-1">
              {allergy}
              <button type="button" onClick={() => removeAllergy(index)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Antécédents */}
      <div className="space-y-2">
        <Label>Antécédents</Label>
        <div className="flex gap-2">
          <Input
            value={newAntecedent}
            onChange={(e) => setNewAntecedent(e.target.value)}
            placeholder="Ajouter un antécédent"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAntecedent())}
          />
          <Button type="button" variant="outline" size="icon" onClick={addAntecedent}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {antecedents.map((antecedent, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {antecedent}
              <button type="button" onClick={() => removeAntecedent(index)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Notes supplémentaires..."
          {...form.register('notes')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues?.ipp ? 'Mettre à jour' : 'Créer le patient'}
      </Button>
    </form>
  );
}
```

### Étape 4 : Liste des patients

**src/features/patients/components/patients-list.tsx**
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePatients } from '../hooks/use-patients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, AlertTriangle } from 'lucide-react';

export function PatientsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = usePatients({ search, page });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par IPP..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun patient trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Patient #{patient.ipp}</p>
                      <div className="flex gap-2 mt-1">
                        {patient.allergies.length > 0 && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {patient.allergies.length} allergie(s)
                          </Badge>
                        )}
                        {patient.antecedents.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {patient.antecedents.length} antécédent(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Voir →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Précédent
          </Button>
          <span className="py-2 px-3 text-sm">
            Page {page} / {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.total_pages}
            onClick={() => setPage(page + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Étape 5 : Page Patients

**app/(authenticated)/patients/page.tsx**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientsList } from '@/features/patients/components/patients-list';
import { PatientForm } from '@/features/patients/components/patient-form';
import { useCreatePatient } from '@/features/patients/hooks/use-patients';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function PatientsPage() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createPatient = useCreatePatient();

  const handleCreate = async (data: any) => {
    try {
      const patient = await createPatient.mutateAsync(data);
      toast.success('Patient créé');
      setOpen(false);
      router.push(`/patients/${patient.id}`);
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Gérez vos patients"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouveau patient</DialogTitle>
              </DialogHeader>
              <PatientForm
                onSubmit={handleCreate}
                isLoading={createPatient.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <PatientsList />
    </div>
  );
}
```

---

# Task 17: Patients - Historique & Détail

> **Durée estimée** : 1.5h  

## Objectif

Page détail patient avec historique des consultations et interventions.

**app/(authenticated)/patients/[id]/page.tsx**
```typescript
'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { useQuery } from '@tanstack/react-query';
import { xano } from '@/lib/xano';
import { Edit, Stethoscope, Scissors, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function PatientDetailPage() {
  const { id } = useParams();
  const { data: patient, isLoading } = usePatient(Number(id));

  // GET /patient-history/{patient_id}?id={patient_id}
  const { data: history } = useQuery({
    queryKey: ['patients', id, 'history'],
    queryFn: () => xano.get(`/patient-history/${id}`, { id }),
    enabled: !!id,
  });

  if (isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (!patient) {
    return <div>Patient non trouvé</div>;
  }

  return (
    <div>
      <PageHeader
        title={`Patient #${patient.ipp}`}
        actions={
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info patient */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">IPP</p>
              <p className="font-medium">{patient.ipp}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                Allergies
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.allergies.length > 0 ? (
                  patient.allergies.map((allergy, i) => (
                    <Badge key={i} variant="destructive">{allergy}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Aucune</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Antécédents</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.antecedents.length > 0 ? (
                  patient.antecedents.map((ant, i) => (
                    <Badge key={i} variant="secondary">{ant}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Aucun</span>
                )}
              </div>
            </div>

            {patient.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historique */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="consultations">
            <TabsList>
              <TabsTrigger value="consultations" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                Consultations
              </TabsTrigger>
              <TabsTrigger value="interventions" className="gap-2">
                <Scissors className="h-4 w-4" />
                Interventions
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="consultations" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  {/* Liste des consultations du patient */}
                  <p className="text-muted-foreground text-center py-8">
                    Liste des consultations à implémenter
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interventions" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-center py-8">
                    Liste des interventions à implémenter
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-center py-8">
                    Liste des documents à implémenter
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
    </div>
  );
}
```

---

## Critères de succès

### Task 16
- [ ] Liste patients avec recherche IPP
- [ ] Création patient via modal
- [ ] Allergies/antécédents en tags

### Task 17
- [ ] Page détail patient
- [ ] Tabs historique (structure)
- [ ] Affichage allergies/antécédents

---

## Dépendances

| Task | Raison |
|------|--------|
| 07-xano-endpoints | CRUD patients |
| 08-client-xano | TanStack Query |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Endpoints singuliers** : Xano utilise `/patient` (singulier) et non `/patients` (pluriel)
- **Recherche IPP** : Utiliser `/patient-by-ipp?ipp=...` (endpoint dédié), pas de recherche textuelle sur `/patient`
- **Patient.user_id** : Référence le médecin propriétaire (table `user`, pas `doctor_id` pour Patient)
- **Historique** : L'endpoint `/patient-history/{patient_id}` prend aussi `id` en query param

### 💡 Suggestions

- Utiliser `usePatientByIPP` pour la barre de recherche du header
- L'historique retourne consultations, interventions et documents en un seul appel

---

## 📡 Endpoints API utilisés (swagger)

### CRUD Patient

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/patient` | GET | Liste tous les patients du médecin | ✅ Bearer |
| `/patient` | POST | Créer un nouveau patient | ✅ Bearer |
| `/patient/{patient_id}` | GET | Récupérer un patient par ID | ✅ Bearer |
| `/patient/{patient_id}` | PATCH | Modifier partiellement un patient | ✅ Bearer |
| `/patient/{patient_id}` | PUT | Remplacer complètement un patient | ✅ Bearer |
| `/patient/{patient_id}` | DELETE | Supprimer un patient | ✅ Bearer |

### Recherche & Historique

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/patient-by-ipp` | GET | Rechercher un patient par IPP (`?ipp=...`) | ✅ Bearer |
| `/patient-history/{patient_id}` | GET | Historique complet du patient (`?id=...`) | ✅ Bearer |

### Relations (consultations/documents du patient)

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/consultations/patient/{patient_id}` | GET | Consultations d'un patient | ✅ Bearer |
| `/documents/patient/{patient_id}` | GET | Documents d'un patient | ✅ Bearer |
