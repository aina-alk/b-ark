# Task 08: Client Xano Type-Safe & Providers

> **Durée estimée** : 1.5h
> **Phase** : Frontend Foundation
> **Feature PRD** : Infrastructure frontend

## Contexte

Cette tâche crée le client HTTP **type-safe** pour communiquer avec l'API Xano. Au lieu de définir manuellement des types qui dérivent du swagger, nous générons automatiquement les types TypeScript depuis `swagger.json`.

**Pourquoi type-safe ?**

| Approche Manuelle | Approche Type-Safe |
|-------------------|-------------------|
| Types définis manuellement | Types auto-générés depuis swagger |
| Mauvais chemins compilent | Chemins invalides = erreur TypeScript |
| Dérive découverte à l'exécution | Dérive découverte à la compilation |
| Sync manuelle après changements API | Hook pre-commit régénère les types |

Pour une application médicale gérant des données patients, **la fiabilité n'est pas optionnelle**.

## Objectif

Mettre en place l'infrastructure de data fetching type-safe et state management.

## Scope

### Inclus ✅
- Génération automatique de types depuis `swagger.json`
- Client openapi-fetch avec gestion des tokens
- Configuration TanStack Query (QueryClient, Provider)
- Store Zustand pour le workflow consultation
- Store Zustand pour l'UI (sidebar, modals)
- Hook pre-commit pour régénérer les types

### Exclus ❌
- Hooks de fetching spécifiques (seront créés par feature)
- nuqs pour URL state (sera ajouté quand nécessaire)

---

## Architecture

```
swagger.json ──► openapi-typescript ──► api.d.ts ──► Client xano type-safe
                 (auto-généré)                       (autocomplétion + validation)
```

### Fichiers à créer

| Chemin | Objectif |
|--------|----------|
| `src/types/api.d.ts` | Types auto-générés depuis swagger (NE PAS MODIFIER) |
| `src/lib/xano-client.ts` | Client openapi-fetch de base avec middleware auth |
| `src/lib/xano.ts` | Wrapper DX (xano.get, xano.post) avec gestion d'erreurs |
| `src/lib/query-client.ts` | Configuration TanStack Query |
| `src/stores/workflow-store.ts` | État workflow consultation |
| `src/stores/ui-store.ts` | État UI |
| `scripts/generate-api-types.ts` | Script de génération de types |
| `.husky/pre-commit` | Régénère les types quand swagger change |

---

## Implémentation

### Étape 1 : Installation des dépendances

```bash
# Client API type-safe
pnpm add openapi-fetch

# State management
pnpm add @tanstack/react-query zustand

# Dev dependencies
pnpm add -D openapi-typescript tsx husky lint-staged @tanstack/react-query-devtools
```

### Étape 2 : Script de génération de types

**scripts/generate-api-types.ts**
```typescript
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const SWAGGER_PATH = 'swagger.json';
const OUTPUT_PATH = 'src/types/api.d.ts';

if (!existsSync(SWAGGER_PATH)) {
  console.error(`Error: ${SWAGGER_PATH} not found`);
  console.log('Make sure to export swagger.json from Xano before running this script');
  process.exit(1);
}

console.log('Generating API types from swagger.json...');
execSync(`npx openapi-typescript ${SWAGGER_PATH} -o ${OUTPUT_PATH}`, {
  stdio: 'inherit'
});
console.log(`Types generated successfully: ${OUTPUT_PATH}`);
```

**package.json - ajouter les scripts :**
```json
{
  "scripts": {
    "generate:api-types": "tsx scripts/generate-api-types.ts",
    "predev": "pnpm generate:api-types",
    "prebuild": "pnpm generate:api-types"
  }
}
```

### Étape 3 : Client Xano type-safe

**src/lib/xano-client.ts**
```typescript
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

// Create the base openapi-fetch client
const client = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_XANO_BASE_URL,
});

// Storage for auth token
let authToken: string | null = null;

// Add auth middleware
client.use({
  async onRequest({ request }) {
    if (authToken) {
      request.headers.set('Authorization', `Bearer ${authToken}`);
    }
    return request;
  },
  async onResponse({ response }) {
    // Handle 401 - token expired
    if (response.status === 401) {
      clearXanoToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return response;
  },
});

// Token management
export function setXanoToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('xano_token', token);
  }
}

export function clearXanoToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('xano_token');
  }
}

export function initXanoFromStorage() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('xano_token');
    if (token) {
      authToken = token;
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export { client };
```

**src/lib/xano.ts**
```typescript
import { client } from './xano-client';
import type { paths } from '@/types/api';

// Re-export token management
export {
  setXanoToken,
  clearXanoToken,
  initXanoFromStorage,
  getAuthToken
} from './xano-client';

// Custom error class
export class XanoApiError extends Error {
  code: string;
  status: number;
  field?: string;

  constructor(message: string, code: string, status: number, field?: string) {
    super(message);
    this.name = 'XanoApiError';
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

// Type-safe wrapper with error handling
type PathKeys = keyof paths;

// GET requests
export async function get<P extends PathKeys>(
  path: P,
  ...args: paths[P] extends { get: infer G }
    ? G extends { parameters?: infer Params }
      ? [options?: { params?: Params }]
      : [options?: {}]
    : never
) {
  const { data, error, response } = await client.GET(path as any, args[0] as any);

  if (error) {
    throw new XanoApiError(
      (error as any)?.message || 'API Error',
      (error as any)?.code || 'UNKNOWN',
      response.status,
      (error as any)?.field
    );
  }

  return data;
}

// POST requests
export async function post<P extends PathKeys>(
  path: P,
  ...args: paths[P] extends { post: infer Po }
    ? Po extends { requestBody?: { content: { 'application/json': infer Body } } }
      ? [options: { body: Body }]
      : [options?: {}]
    : never
) {
  const { data, error, response } = await client.POST(path as any, args[0] as any);

  if (error) {
    throw new XanoApiError(
      (error as any)?.message || 'API Error',
      (error as any)?.code || 'UNKNOWN',
      response.status,
      (error as any)?.field
    );
  }

  return data;
}

// PATCH requests
export async function patch<P extends PathKeys>(
  path: P,
  ...args: paths[P] extends { patch: infer Pa }
    ? Pa extends { requestBody?: { content: { 'application/json': infer Body } } }
      ? [options: { body: Body }]
      : [options?: {}]
    : never
) {
  const { data, error, response } = await client.PATCH(path as any, args[0] as any);

  if (error) {
    throw new XanoApiError(
      (error as any)?.message || 'API Error',
      (error as any)?.code || 'UNKNOWN',
      response.status,
      (error as any)?.field
    );
  }

  return data;
}

// DELETE requests
export async function del<P extends PathKeys>(
  path: P,
  ...args: paths[P] extends { delete: infer D }
    ? D extends { parameters?: infer Params }
      ? [options?: { params?: Params }]
      : [options?: {}]
    : never
) {
  const { data, error, response } = await client.DELETE(path as any, args[0] as any);

  if (error) {
    throw new XanoApiError(
      (error as any)?.message || 'API Error',
      (error as any)?.code || 'UNKNOWN',
      response.status,
      (error as any)?.field
    );
  }

  return data;
}

// Convenience object for familiar API
export const xano = {
  get,
  post,
  patch,
  delete: del,
};
```

### Étape 4 : Types supplémentaires (pour endpoints incomplets)

Certains endpoints dans swagger.json ont des réponses incomplètes (juste `"type": "object"`). Nous créons des types supplémentaires pour ces cas.

**src/types/xano-extended.ts**
```typescript
/**
 * Types supplémentaires pour les endpoints dont le swagger est incomplet.
 * Ces types sont utilisés en complément des types auto-générés.
 */

// Auth responses
export interface AuthResponse {
  authToken: string;
  user_id: number;
}

// User (table built-in Xano étendue)
export interface User {
  id: number;
  email: string;
  name: string;
  rpps: string | null;
  specialty: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

// Patient
export interface Patient {
  id: number;
  ipp: number;
  user_id: number;
  allergies: string[];
  antecedents: string[];
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// Consultation
export interface Consultation {
  id: number;
  patient_id: number;
  doctor_id: number;
  date: string;
  motif: string | null;
  transcription: string | null;
  context_detected: 'consultation' | 'intervention' | 'unknown';
  symptoms: string[];
  examination: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'validated';
  duration_seconds: number | null;
  created_at: string;
  updated_at: string | null;
  patient?: Patient;
  documents?: Document[];
}

// Intervention
export interface Intervention {
  id: number;
  patient_id: number;
  doctor_id: number;
  date: string;
  type_intervention: string;
  transcription: string | null;
  indication: string | null;
  technique: string | null;
  findings: string | null;
  complications: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'validated';
  duration_minutes: number | null;
  anesthesia_type: string | null;
  created_at: string;
  updated_at: string | null;
  patient?: Patient;
  documents?: Document[];
}

// Document
export interface Document {
  id: number;
  consultation_id: number | null;
  intervention_id: number | null;
  doctor_id: number;
  patient_id: number;
  type: 'cr_consultation' | 'cr_operatoire' | 'ordonnance' | 'courrier';
  title: string | null;
  content: Record<string, unknown>;
  content_text: string | null;
  pdf_url: string | null;
  validated: boolean;
  validated_at: string | null;
  sent_at: string | null;
  recipient_email: string | null;
  version: number;
  created_at: string;
  updated_at: string | null;
}

// Medicament
export interface Medicament {
  id: number;
  nom: string;
  dci: string;
  classe: string;
  forme: string | null;
  posologie_adulte: string | null;
  posologie_enfant: string | null;
  contre_indications: string[];
  interactions: string[];
  precautions: string | null;
  orl_specific: boolean;
}

// Interaction check response
export interface InteractionCheck {
  interactions: {
    medicament1: string;
    medicament2: string | null;
    type: 'interaction' | 'allergie' | 'contre_indication';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }[];
  safe: boolean;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
```

### Étape 5 : Configuration TanStack Query

**src/lib/query-client.ts**
```typescript
import { QueryClient } from '@tanstack/react-query';
import { XanoApiError } from './xano';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        // Ne pas retry sur les erreurs 4xx
        if (error instanceof XanoApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

### Étape 6 : Store Zustand - Workflow

**src/stores/workflow-store.ts**
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type WorkflowStep =
  | 'patient_selection'
  | 'recording'
  | 'transcription'
  | 'generation'
  | 'editing'
  | 'validation';

type ContextType = 'consultation' | 'intervention' | 'unknown';

interface WorkflowState {
  // État
  currentStep: WorkflowStep;
  contextDetected: ContextType;
  patientId: number | null;
  consultationId: number | null;
  transcription: string;
  isRecording: boolean;
  isGenerating: boolean;

  // Actions
  setStep: (step: WorkflowStep) => void;
  setContext: (context: ContextType) => void;
  setPatient: (patientId: number | null) => void;
  setConsultation: (consultationId: number | null) => void;
  setTranscription: (transcription: string) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'patient_selection' as WorkflowStep,
  contextDetected: 'unknown' as ContextType,
  patientId: null,
  consultationId: null,
  transcription: '',
  isRecording: false,
  isGenerating: false,
};

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setContext: (context) => set({ contextDetected: context }),
      setPatient: (patientId) => set({ patientId }),
      setConsultation: (consultationId) => set({ consultationId }),
      setTranscription: (transcription) => set({ transcription }),
      setIsRecording: (isRecording) => set({ isRecording }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      reset: () => set(initialState),
    }),
    { name: 'workflow-store' }
  )
);
```

### Étape 7 : Store Zustand - UI

**src/stores/ui-store.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
```

### Étape 8 : Mettre à jour Providers

**app/providers.tsx**
```typescript
'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { initXanoFromStorage } from '@/lib/xano';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Initialiser le token Xano au chargement
    initXanoFromStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Étape 9 : Hook Pre-commit (Husky)

```bash
# Initialiser Husky
npx husky init
```

**.husky/pre-commit**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**package.json - ajouter lint-staged :**
```json
{
  "lint-staged": {
    "swagger.json": [
      "pnpm generate:api-types",
      "git add src/types/api.d.ts"
    ]
  }
}
```

---

## Exemple d'utilisation

Après cette task, les features utiliseront le client ainsi :

```typescript
import { xano } from '@/lib/xano';
import { useQuery, useMutation } from '@tanstack/react-query';

// GET avec autocomplétion des paths
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => xano.get('/api:mzJnPfQM/patient', {}),
  });
}

// POST avec typage du body
export function useCreatePatient() {
  return useMutation({
    mutationFn: (data: { ipp: number; allergies?: string[] }) =>
      xano.post('/api:mzJnPfQM/patient', { body: data }),
  });
}

// Les chemins invalides produisent une erreur TypeScript !
// xano.get('/api:mzJnPfQM/invalid-path', {}) // TS Error
```

---

## Critères de succès

### Fonctionnels
- [ ] `pnpm generate:api-types` produit `src/types/api.d.ts`
- [ ] Client Xano peut faire des requêtes GET/POST/PATCH/DELETE
- [ ] Autocomplétion des paths dans l'IDE
- [ ] Chemins invalides produisent des erreurs TypeScript
- [ ] Les tokens sont persistés dans localStorage
- [ ] TanStack Query fonctionne (vérifier avec DevTools)
- [ ] Stores Zustand accessibles

### Techniques
- [ ] TypeScript compile sans erreur
- [ ] Hook pre-commit régénère les types quand swagger change
- [ ] Pas de fuite mémoire (stores nettoyés)

---

## Tests & Validation

### Tests manuels

1. **Générer les types**
   ```bash
   pnpm generate:api-types
   # Vérifier que src/types/api.d.ts est créé
   ```

2. **Tester l'autocomplétion**
   - Ouvrir un fichier TS
   - Taper `xano.get('/api:`
   - Vérifier que l'IDE propose les paths disponibles

3. **Tester les erreurs de type**
   ```typescript
   // Ce code doit produire une erreur TypeScript
   xano.get('/invalid-path', {});
   ```

4. **Vérifier TanStack Query DevTools**
   - Ouvrir l'app en mode dev
   - Vérifier que le panneau DevTools apparaît

5. **Tester Zustand**
   ```typescript
   import { useWorkflowStore } from '@/stores/workflow-store';
   const { setStep } = useWorkflowStore();
   setStep('recording');
   ```

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| 01-setup-nextjs | Projet configuré |
| 02-07-xano-backend | `swagger.json` disponible |

### Bloque

| Task | Raison |
|------|--------|
| 09+ | Toutes les features utilisent ces providers |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **swagger.json requis** : Cette task ne peut pas être exécutée avant d'avoir le swagger exporté de Xano
- **SSR** : `localStorage` n'existe pas côté serveur, utiliser `typeof window !== 'undefined'`
- **Token expiration** : Le middleware gère le 401 → redirect login
- **DevTools** : Désactiver en production avec `process.env.NODE_ENV`
- **Paths complets** : Utiliser les paths complets avec préfixe API (ex: `/api:mzJnPfQM/patient`)

### 💡 Suggestions

- Vérifier la qualité du swagger.json (certains endpoints peuvent avoir des réponses incomplètes)
- Utiliser `src/types/xano-extended.ts` pour les types manquants dans swagger
- Les hooks de feature utiliseront les query keys factories pattern

### 🔧 Commandes utiles

```bash
# Régénérer les types
pnpm generate:api-types

# Dev (régénère auto les types)
pnpm dev

# Build (régénère auto les types)
pnpm build
```

---

## 📡 Endpoints API (swagger)

Le client type-safe utilise les paths exacts du swagger. Exemples :

### Authentication
| Endpoint | Méthode |
|----------|---------|
| `/api:QC35j52Y/auth/login` | POST |
| `/api:QC35j52Y/auth/signup` | POST |
| `/api:QC35j52Y/auth/me` | GET |
| `/api:QC35j52Y/auth/logout` | POST |

### Patients
| Endpoint | Méthode |
|----------|---------|
| `/api:mzJnPfQM/patient` | GET, POST |
| `/api:mzJnPfQM/patient/{patient_id}` | GET, PATCH, DELETE |
| `/api:mzJnPfQM/patient-by-ipp` | GET |

### Consultations
| Endpoint | Méthode |
|----------|---------|
| `/api:mzJnPfQM/consultation` | GET, POST |
| `/api:mzJnPfQM/consultation/{consultation_id}` | GET, PATCH |

*Voir swagger.json pour la liste complète des endpoints.*
