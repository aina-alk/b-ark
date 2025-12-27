# Task 41: Deployment - Vercel & Monitoring

> **Durée estimée** : 2h  
> **Phase** : Deployment  
> **Feature PRD** : Mise en production

## Contexte

Dernière étape du MVP ! Déployer l'application sur Vercel avec configuration production, monitoring et alertes.

## Objectif

Déployer l'application en production avec toutes les bonnes pratiques DevOps.

## Scope

### Inclus ✅
- Configuration Vercel
- Variables d'environnement production
- Domaine personnalisé (optionnel)
- Sentry pour le monitoring
- Analytics de base

### Exclus ❌
- CI/CD avancé (GitHub Actions)
- Tests automatisés pré-deploy
- Multi-environnements (staging)

---

## Implémentation

### Étape 1 : Préparation du projet

**Vérifications pré-deploy :**
```bash
# Build local
pnpm build

# Vérifier les erreurs TypeScript
pnpm type-check

# Linter
pnpm lint
```

**next.config.js - Configuration production**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimizations
  swcMinify: true,
  
  // Images domains
  images: {
    domains: ['your-xano-instance.xano.io'],
  },
  
  // Headers sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Étape 2 : Configuration Vercel

**vercel.json**
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": []
}
```

**Variables d'environnement à configurer sur Vercel :**
```env
# Xano
NEXT_PUBLIC_XANO_BASE_URL=https://x8ki-ltdi-qof7.n7.xano.io/api:xxx
XANO_API_KEY=your-api-key

# OpenAI (Whisper)
OPENAI_API_KEY=sk-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Resend (Emails)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Sentry
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Étape 3 : Sentry Monitoring

**Installation :**
```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**sentry.client.config.ts**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance
  tracesSampleRate: 0.1, // 10% des transactions
  
  // Session Replay (optionnel)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Ignore certaines erreurs
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection',
  ],
});
```

**sentry.server.config.ts**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**Wrapper pour les API routes :**
```typescript
// src/lib/api-utils.ts
import * as Sentry from '@sentry/nextjs';

export function withErrorHandling(handler: Function) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
}
```

### Étape 4 : Analytics Simple

**src/lib/analytics.ts**
```typescript
// Analytics basique avec événements custom
export function trackEvent(name: string, properties?: Record<string, any>) {
  // Log côté serveur (via Xano)
  if (typeof window !== 'undefined') {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: name, properties, timestamp: new Date().toISOString() }),
    }).catch(() => {}); // Fire and forget
  }
}

// Events prédéfinis
export const Analytics = {
  consultationStarted: () => trackEvent('consultation_started'),
  consultationCompleted: () => trackEvent('consultation_completed'),
  documentGenerated: (type: string) => trackEvent('document_generated', { type }),
  documentExported: (type: string, format: string) => trackEvent('document_exported', { type, format }),
  crAccepted: (modificationsCount: number) => trackEvent('cr_accepted', { modifications: modificationsCount }),
};
```

### Étape 5 : Health Check

**app/api/health/route.ts**
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
  };

  // Optionnel: vérifier la connexion Xano
  try {
    const xanoResponse = await fetch(`${process.env.NEXT_PUBLIC_XANO_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'X-Api-Key': process.env.XANO_API_KEY || '' },
    });
    health.xano = xanoResponse.ok ? 'connected' : 'error';
  } catch {
    health.xano = 'unreachable';
  }

  return NextResponse.json(health);
}
```

### Étape 6 : Scripts de déploiement

**package.json - Scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "deploy": "vercel --prod",
    "deploy:preview": "vercel"
  }
}
```

### Étape 7 : Commandes de déploiement

```bash
# 1. Installer Vercel CLI
pnpm add -g vercel

# 2. Login
vercel login

# 3. Link le projet
vercel link

# 4. Configurer les variables d'environnement
vercel env add XANO_API_KEY
# (répéter pour chaque variable)

# 5. Deploy preview
vercel

# 6. Deploy production
vercel --prod
```

### Étape 8 : Post-déploiement

**Checklist post-deploy :**
- [ ] Tester `/api/health` → doit retourner `{ status: "ok" }`
- [ ] Tester login/register
- [ ] Créer une consultation test
- [ ] Vérifier les logs Sentry
- [ ] Tester sur mobile
- [ ] Vérifier HTTPS actif
- [ ] Configurer le domaine custom (optionnel)

**Domaine custom (optionnel) :**
```bash
# Dans Vercel Dashboard > Settings > Domains
# Ajouter: app.votredomaine.fr

# DNS à configurer:
# CNAME app → cname.vercel-dns.com
```

---

## Critères de succès

### Fonctionnels
- [ ] App accessible sur URL Vercel
- [ ] Toutes les features fonctionnent en prod
- [ ] Auth fonctionne (login, OAuth, reset)
- [ ] Génération IA fonctionne

### Techniques
- [ ] Build sans erreurs
- [ ] Variables env configurées
- [ ] Sentry reçoit les erreurs
- [ ] Health check OK
- [ ] HTTPS actif

### Performance
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 4s
- [ ] Lighthouse score > 80

---

## Dépendances

### Requiert

| Task | Raison |
|------|--------|
| Toutes | App complète avant deploy |

### Post-MVP

- CI/CD avec GitHub Actions
- Environnement staging
- Tests E2E automatisés
- Monitoring avancé (Datadog, etc.)

---

## Notes d'implémentation

### ⚠️ Points d'attention

- **Variables d'environnement** : Configurer toutes les clés API sur Vercel
- **Health check Xano** : L'endpoint `/health` n'existe pas dans le swagger, vérifier avec l'équipe Xano
- **Region** : `cdg1` = Paris (proche des utilisateurs français)

### 💡 Suggestions

- Ajouter un endpoint `/api/health/xano` qui vérifie la connexion
- Configurer des alertes Sentry pour les erreurs critiques

---

## 📡 Variables d'environnement requises

### Xano

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_XANO_BASE_URL` | URL de l'API Xano (publique) |
| `XANO_API_KEY` | Clé API Xano (serveur uniquement) |

### Services externes

| Variable | Service | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | OpenAI | Transcription Whisper |
| `ANTHROPIC_API_KEY` | Anthropic | Génération Claude |
| `RESEND_API_KEY` | Resend | Envoi emails |
| `GOOGLE_CLIENT_ID` | Google | OAuth |
| `GOOGLE_CLIENT_SECRET` | Google | OAuth |
| `SENTRY_DSN` | Sentry | Monitoring erreurs |

### App

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL de l'app en production |
| `EMAIL_FROM` | Adresse email expéditeur |
