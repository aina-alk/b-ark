# Task 01: Setup Projet Next.js

> **Durée estimée** : 2h  
> **Phase** : Foundation  
> **Feature PRD** : Infrastructure de base

## Contexte

C'est la première tâche du projet ORL Consultation Intelligente. On pose les fondations techniques avec Next.js 15, TypeScript, Tailwind CSS et shadcn/ui. Cette configuration servira de base pour toutes les features suivantes.

## Objectif

Initialiser un projet Next.js 15 production-ready avec la stack complète configurée.

## Scope

### Inclus ✅
- Initialisation Next.js 15 avec App Router
- Configuration TypeScript stricte
- Setup Tailwind CSS
- Installation shadcn/ui (composants de base)
- Structure de dossiers selon PROJECT_PLAN.md
- Configuration ESLint + Prettier
- Fichier .env.example

### Exclus ❌
- Configuration Xano (Task 02-07)
- TanStack Query / Zustand (Task 08)
- Pages et composants métier

---

## Implémentation

### Étape 1 : Initialisation Next.js

```bash
pnpm create next-app@latest orl-consultation-intelligente --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd orl-consultation-intelligente
```

### Étape 2 : Installation des dépendances

```bash
# UI
pnpm dlx shadcn@latest init

# Composants shadcn essentiels
pnpm dlx shadcn@latest add button input card dialog form label \
  textarea badge avatar dropdown-menu sheet tabs toast skeleton \
  alert separator scroll-area command popover select switch \
  checkbox radio-group progress tooltip sonner table

# Utilitaires
pnpm add clsx tailwind-merge lucide-react

# Dev
pnpm add -D prettier prettier-plugin-tailwindcss
```

### Étape 3 : Configuration TypeScript stricte

**tsconfig.json** - Ajouter/vérifier :
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Étape 4 : Structure des dossiers

Créer la structure suivante :

```
orl-consultation-intelligente/
├── app/
│   ├── (public)/
│   │   └── .gitkeep
│   ├── (authenticated)/
│   │   └── .gitkeep
│   ├── (admin)/
│   │   └── .gitkeep
│   ├── api/
│   │   └── .gitkeep
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
│
├── src/
│   ├── components/
│   │   ├── ui/              ← shadcn (auto-généré)
│   │   ├── layout/
│   │   │   └── .gitkeep
│   │   └── shared/
│   │       └── .gitkeep
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── actions/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── consultation/
│   │   │   ├── actions/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── intervention/
│   │   ├── patients/
│   │   ├── documents/
│   │   ├── medicaments/
│   │   ├── rag/
│   │   ├── ai/
│   │   ├── dashboard/
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── utils.ts         ← cn() helper
│   │   └── .gitkeep
│   │
│   ├── hooks/
│   │   └── .gitkeep
│   │
│   ├── stores/
│   │   └── .gitkeep
│   │
│   └── types/
│       └── index.ts
│
├── public/
│   ├── templates/
│   └── icons/
│
├── .env.local
├── .env.example
├── .prettierrc
├── CLAUDE.md
└── package.json
```

### Étape 5 : Fichiers de configuration

**.prettierrc**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**.env.example**
```env
# ═══════════════════════════════════════════════════════════════
#                           XANO
# ═══════════════════════════════════════════════════════════════
XANO_API_URL="https://[workspace].xano.io/api:[version]"
XANO_API_KEY=""

# ═══════════════════════════════════════════════════════════════
#                           AI SERVICES
# ═══════════════════════════════════════════════════════════════
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# ═══════════════════════════════════════════════════════════════
#                           RAG (optionnel MVP)
# ═══════════════════════════════════════════════════════════════
PINECONE_API_KEY=""
PINECONE_ENVIRONMENT=""
PINECONE_INDEX=""

# ═══════════════════════════════════════════════════════════════
#                           EMAIL
# ═══════════════════════════════════════════════════════════════
RESEND_API_KEY=""
EMAIL_FROM="ORL Consultation <noreply@your-domain.com>"

# ═══════════════════════════════════════════════════════════════
#                           MONITORING
# ═══════════════════════════════════════════════════════════════
SENTRY_DSN=""
HELICONE_API_KEY=""

# ═══════════════════════════════════════════════════════════════
#                           APP
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ORL Consultation Intelligente"
```

### Étape 6 : Fichier CLAUDE.md

Créer **CLAUDE.md** à la racine :
```markdown
# CLAUDE.md — ORL Consultation Intelligente

## Projet
Application d'assistance IA pour médecins ORL : dictée vocale, transcription, génération de CR/ordonnances/courriers.

## Stack
- **Frontend** : Next.js 15 App Router, React 19, TypeScript
- **Styling** : Tailwind CSS, shadcn/ui
- **State** : TanStack Query (server), Zustand (workflow), nuqs (URL)
- **Backend** : Xano (PostgreSQL HDS)
- **AI** : Whisper (OpenAI), Claude (Anthropic)

## Structure
- `app/` : Routes Next.js (App Router)
- `src/features/` : Features par domaine
- `src/components/` : Composants UI
- `src/lib/` : Utilitaires et clients API

## Conventions
- **Naming** : camelCase (TS), snake_case (Xano)
- **Commits** : Conventional Commits (feat:, fix:, docs:)
- **Components** : Un fichier par composant, PascalCase

## Patterns
- Server Actions pour mutations
- TanStack Query pour cache/fetching
- Zod pour validation (client + serveur)
- Zustand pour état workflow uniquement

## Commandes
```bash
pnpm dev          # Développement
pnpm build        # Build production
pnpm lint         # Linting
pnpm tsc --noEmit # Vérification types
```
```

### Étape 7 : App providers setup

**app/providers.tsx**
```tsx
'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
```

**app/layout.tsx** - Mettre à jour :
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ORL Consultation Intelligente',
  description: 'Assistant IA pour médecins ORL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Critères de succès

### Fonctionnels
- [ ] `pnpm dev` lance le serveur sans erreur
- [ ] Page d'accueil Next.js affichée
- [ ] shadcn/ui components fonctionnels (tester un Button)
- [ ] Structure de dossiers créée

### Techniques
- [ ] TypeScript compile sans erreur (`pnpm tsc --noEmit`)
- [ ] ESLint passe (`pnpm lint`)
- [ ] Pas de warnings dans la console

---

## Tests & Validation

### Tests manuels

1. Lancer le serveur de développement
   - Résultat attendu : Serveur accessible sur http://localhost:3000

2. Vérifier la compilation TypeScript
   - Résultat attendu : Aucune erreur de type

3. Tester un composant shadcn/ui
   - Ajouter un `<Button>Test</Button>` dans la page d'accueil
   - Résultat attendu : Bouton stylé affiché

### Commandes de validation

```bash
# Vérifier TypeScript
pnpm tsc --noEmit

# Vérifier lint
pnpm lint

# Lancer le dev server
pnpm dev

# Build test
pnpm build
```

---

## Dépendances

### Requiert (à compléter AVANT cette tâche)

| Task | Raison |
|------|--------|
| Aucune | Première tâche du projet |

### Bloque (dépendent de cette tâche)

| Task | Raison |
|------|--------|
| 02-07 | Configuration Xano nécessite le projet existant |
| 08 | Client Xano & Providers |

---

## Notes d'implémentation

### ⚠️ Points d'attention

- Utiliser `pnpm` (pas npm ou yarn) pour cohérence
- Next.js 15 avec App Router (pas Pages Router)
- src/ directory activé pour organisation
- shadcn/ui utilise le dossier `src/components/ui/`

### 💡 Suggestions

- Vérifier la version de Node.js (>= 18.17)
- Copier `.env.example` vers `.env.local` pour le développement
- Faire un premier commit après cette tâche : `feat: initial project setup`
