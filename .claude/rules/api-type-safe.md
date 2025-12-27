# Architecture API Type-Safe

## Principe

Ce projet utilise une architecture API **type-safe** où les types TypeScript sont auto-générés depuis `swagger.json`. Cela élimine la dérive entre le frontend et le backend.

## Flux de génération

```
swagger.json ──► openapi-typescript ──► src/types/api.d.ts ──► Client xano type-safe
```

## Commandes

```bash
# Régénérer les types depuis swagger.json
pnpm generate:api-types

# Les scripts predev et prebuild régénèrent automatiquement les types
pnpm dev   # Régénère avant de démarrer
pnpm build # Régénère avant de build
```

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `swagger.json` | Source de vérité (exporté de Xano) |
| `src/types/api.d.ts` | Types auto-générés (NE PAS MODIFIER) |
| `src/types/xano-extended.ts` | Types supplémentaires manuels |
| `src/lib/xano-client.ts` | Client openapi-fetch avec middleware auth |
| `src/lib/xano.ts` | Wrapper DX (xano.get, xano.post, etc.) |

## Utilisation

```typescript
import { xano } from '@/lib/xano';

// Les paths ont l'autocomplétion et le typage
const patient = await xano.get('/api:mzJnPfQM/patient', {});

// Les paths invalides produisent une erreur TypeScript
// xano.get('/invalid-path', {}); // TS Error!
```

## Points d'attention

1. **Paths complets** : Utiliser les paths avec préfixe API (ex: `/api:mzJnPfQM/patient`)
2. **swagger.json requis** : Les Tasks 02-07 (Xano backend) doivent être terminées avant Task 08
3. **Hook pre-commit** : Régénère automatiquement les types quand swagger.json change
4. **Types incomplets** : Si swagger a des réponses incomplètes, utiliser `xano-extended.ts`

## Dépendances

- `openapi-fetch` : Client fetch type-safe
- `openapi-typescript` : Génération de types depuis OpenAPI/Swagger
- `tsx` : Exécution de scripts TypeScript
- `husky` + `lint-staged` : Hook pre-commit
