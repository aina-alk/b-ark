# CLAUDE.md — ORL Consultation Intelligente

## Projet

Application d'assistance IA pour médecins ORL : dictée vocale, transcription, génération de CR/ordonnances/courriers.

## Stack

- **Frontend** : Next.js 15 App Router, React 19, TypeScript
- **Styling** : Tailwind CSS v4, shadcn/ui
- **State** : TanStack Query (server), Zustand (workflow), nuqs (URL)
- **Backend** : Xano (PostgreSQL HDS)
- **AI** : Whisper (OpenAI), Claude (Anthropic)

## Structure

```
src/
├── app/           # Routes Next.js (App Router)
├── components/    # Composants UI (ui/ = shadcn)
├── features/      # Features par domaine
├── lib/           # Utilitaires et clients API
├── hooks/         # Hooks globaux
├── stores/        # Zustand stores
└── types/         # Types TypeScript
```

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

---

## Xano Backend (XanoScript)

Pour le développement backend Xano, voir les fichiers dans `.claude/` :

- Tables : Tasks 02-05
- Auth : Task 06
- Endpoints : Task 07
- swagger.json : Spécification API exportée de Xano
