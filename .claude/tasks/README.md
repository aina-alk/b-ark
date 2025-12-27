# Implementation Tasks — ORL Consultation Intelligente

> Généré le 22 décembre 2024  
> Total estimé : **58h**  
> Stack : Next.js 15 + Xano (HDS) + Whisper + Claude API

## Vue d'ensemble

**Objectif** : Application d'assistance IA pour médecins ORL permettant la dictée vocale, la transcription automatique, la génération de comptes-rendus (consultation/opératoire), ordonnances et courriers médicaux. Temps cible : < 6 minutes au lieu de 15.

**Stack** : Next.js 15 App Router, Xano (PostgreSQL HDS), TanStack Query, Zustand, shadcn/ui, Whisper API, Claude API, react-pdf, Resend

**État actuel** :
- ✅ Implémenté : Rien (nouveau projet)
- 🚧 En cours : Phase de planification
- ❌ À faire : Toutes les tâches ci-dessous

---

## Guide d'exécution

### Ordre d'exécution

Les tâches doivent être exécutées dans l'ordre numérique. Chaque tâche indique ses dépendances. **Backend Xano en premier** pour éviter les erreurs d'intégration.

### Pour chaque tâche

1. Lire la tâche **en entier** avant de coder
2. Vérifier que les dépendances sont complètes
3. Suivre les patterns ARCHI.md
4. Valider les critères de succès
5. Tester manuellement
6. Commit avec message conventionnel
7. Marquer comme fait ✅

### Commandes utiles

```bash
# Développement
pnpm dev

# Vérification TypeScript
pnpm tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build
```

---

## Tâches MVP

### Phase 1 : Foundation — Backend Xano (Backend First)
> Configuration complète du backend avant le frontend

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 01 | [Setup projet Next.js](./01-mvp/01-setup-nextjs.md) | 2h | ⬜ |
| 02 | [Xano - Tables principales](./01-mvp/02-xano-tables-principales.md) | 1.5h | ⬜ |
| 03 | [Xano - Tables médicales](./01-mvp/03-xano-tables-medicales.md) | 1.5h | ⬜ |
| 04 | [Xano - Tables RAG](./01-mvp/04-xano-tables-rag.md) | 1h | ⬜ |
| 05 | [Xano - Tables système](./01-mvp/05-xano-tables-systeme.md) | 1h | ⬜ |
| 06 | [Xano - Auth configuration](./01-mvp/06-xano-auth.md) | 1.5h | ⬜ |
| 07 | [Xano - Endpoints API](./01-mvp/07-xano-endpoints.md) | 2h | ⬜ |

### Phase 2 : Frontend Foundation
> Client API, Auth pages, Layout

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 08 | [Client Xano & Providers](./01-mvp/08-client-xano-providers.md) | 1.5h | ⬜ |
| 09 | [Auth - Login & Register](./01-mvp/09-auth-login-register.md) | 2h | ⬜ |
| 10 | [Auth - OAuth & Reset](./01-mvp/10-auth-oauth-reset.md) | 1.5h | ⬜ |
| 11 | [Auth - Guards & Session](./01-mvp/11-auth-guards-session.md) | 1.5h | ⬜ |
| 12 | [Layout & Navigation](./01-mvp/12-layout-navigation.md) | 2h | ⬜ |

### Phase 3 : UI Base
> Pages statiques et Dashboard

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 13 | [Landing Page](./01-mvp/13-landing-page.md) | 1.5h | ⬜ |
| 14 | [Pages statiques (404, 500)](./01-mvp/14-pages-statiques.md) | 1h | ⬜ |
| 15 | [Dashboard médecin](./01-mvp/15-dashboard-medecin.md) | 2h | ⬜ |

### Phase 4 : Core — Patients
> CRUD patients avec IPP anonymisé

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 16 | [Patients - Liste & Création](./01-mvp/16-patients-liste-creation.md) | 2h | ⬜ |
| 17 | [Patients - Historique & Détail](./01-mvp/17-patients-historique-detail.md) | 1.5h | ⬜ |

### Phase 5 : Core — Consultation (Cœur de l'app)
> Workflow complet de consultation — Feature critique PRD

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 18 | [Consultation - Workflow & Stepper](./01-mvp/18-consultation-workflow-stepper.md) | 1.5h | ⬜ |
| 19 | [Consultation - Recording Audio](./01-mvp/19-consultation-recording-audio.md) | 2h | ⬜ |
| 20 | [Consultation - Transcription Whisper](./01-mvp/20-consultation-transcription-whisper.md) | 2h | ⬜ |
| 21 | [Consultation - Détection Contexte](./01-mvp/21-consultation-detection-contexte.md) | 1.5h | ⬜ |
| 22 | [Consultation - Génération CR Claude](./01-mvp/22-consultation-generation-cr.md) | 2.5h | ⬜ |
| 23 | [Consultation - Éditeur & Validation](./01-mvp/23-consultation-editeur-validation.md) | 2h | ⬜ |

### Phase 6 : Core — Intervention
> Workflow CR opératoire

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 24 | [Intervention - Workflow CRO](./01-mvp/24-intervention-workflow-cro.md) | 2h | ⬜ |
| 25 | [Intervention - Génération & Validation](./01-mvp/25-intervention-generation-validation.md) | 2h | ⬜ |

### Phase 7 : Core — Documents
> Ordonnances et Courriers

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 26 | [Documents - Liste & Preview](./01-mvp/26-documents-liste-preview.md) | 1.5h | ⬜ |
| 27 | [Documents - Ordonnances Consultation](./01-mvp/27-documents-ordonnances-consultation.md) | 2h | ⬜ |
| 28 | [Documents - Ordonnances Post-Op](./01-mvp/28-documents-ordonnances-postop.md) | 1.5h | ⬜ |
| 29 | [Documents - Courriers](./01-mvp/29-documents-courriers.md) | 1.5h | ⬜ |

### Phase 8 : Integrations
> PDF, Email, RAG

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 30 | [Export PDF (react-pdf)](./01-mvp/30-export-pdf.md) | 2h | ⬜ |
| 31 | [Envoi Email (Resend)](./01-mvp/31-envoi-email-resend.md) | 1.5h | ⬜ |
| 32 | [RAG - Médicaments & Interactions](./01-mvp/32-rag-medicaments-interactions.md) | 2h | ⬜ |
| 33 | [RAG - Protocoles & Templates](./01-mvp/33-rag-protocoles-templates.md) | 1.5h | ⬜ |

### Phase 9 : Admin
> Dashboard admin et gestion

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 34 | [Admin - Dashboard & Stats](./01-mvp/34-admin-dashboard-stats.md) | 2h | ⬜ |
| 35 | [Admin - Gestion Users](./01-mvp/35-admin-gestion-users.md) | 1.5h | ⬜ |
| 36 | [Admin - Analytics & Audit](./01-mvp/36-admin-analytics-audit.md) | 1.5h | ⬜ |

### Phase 10 : Polish
> UX, Error handling, Responsive

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 37 | [Settings utilisateur](./01-mvp/37-settings-utilisateur.md) | 1h | ⬜ |
| 38 | [Error Handling global](./01-mvp/38-error-handling-global.md) | 1h | ⬜ |
| 39 | [Loading & Empty States](./01-mvp/39-loading-empty-states.md) | 1h | ⬜ |
| 40 | [Responsive & Mobile](./01-mvp/40-responsive-mobile.md) | 1.5h | ⬜ |

### Phase 11 : Deployment
> Production ready

| # | Tâche | Durée | Status |
|---|-------|-------|--------|
| 41 | [Deployment & Monitoring](./01-mvp/41-deployment-monitoring.md) | 2h | ⬜ |

---

## Graphe de dépendances

```
PHASE 1: BACKEND XANO (Parallel possible)
[01-Setup] ──► [02-Tables-Princ] ──► [03-Tables-Med] ──► [04-Tables-RAG]
                      │                     │                  │
                      │                     ▼                  ▼
                      └──────────► [05-Tables-Sys] ──► [06-Auth] ──► [07-Endpoints]

PHASE 2: FRONTEND FOUNDATION
[07] ──► [08-Client] ──► [09-Login] ──► [10-OAuth] ──► [11-Guards] ──► [12-Layout]

PHASE 3-4: UI & PATIENTS
[12] ──┬──► [13-Landing]
       ├──► [14-Static]
       ├──► [15-Dashboard]
       └──► [16-Patients] ──► [17-Patients-Detail]

PHASE 5-6: CORE WORKFLOWS
[17] ──► [18-Consult-WF] ──► [19-Recording] ──► [20-Whisper] ──► [21-Context]
                                                                       │
              ┌────────────────────────────────────────────────────────┘
              ▼
         [22-CR-Gen] ──► [23-Editor] ──► [24-Interv-WF] ──► [25-Interv-Gen]

PHASE 7: DOCUMENTS
[25] ──► [26-Doc-List] ──┬──► [27-Ordo-Consult]
                         ├──► [28-Ordo-PostOp]
                         └──► [29-Courriers]

PHASE 8: INTEGRATIONS
[29] ──► [30-PDF] ──► [31-Email]
[27] ──► [32-RAG-Med] ──► [33-RAG-Proto]

PHASE 9: ADMIN
[15] ──► [34-Admin-Dash] ──► [35-Admin-Users] ──► [36-Admin-Audit]

PHASE 10-11: POLISH & DEPLOY
[All] ──► [37-Settings] ──► [38-Errors] ──► [39-Loading] ──► [40-Responsive] ──► [41-Deploy]
```

---

## Couverture PRD

| Épic PRD | User Stories | Tâche(s) | Status |
|----------|--------------|----------|--------|
| 1. Transcription vocale | US-001, US-002, US-003 | 19, 20, 21 | ⬜ |
| 2. CR Consultation | US-004, US-005 | 22, 23 | ⬜ |
| 3. CR Opératoire | US-006, US-007 | 24, 25 | ⬜ |
| 4. Ordonnances Consultation | US-008, US-009, US-010 | 27, 32 | ⬜ |
| 5. Ordonnances Post-Op | US-011, US-012 | 28 | ⬜ |
| 6. Courriers | US-013, US-014 | 29 | ⬜ |
| 7. Actions Consultation | US-015, US-016, US-017 | 22, 23 | ⬜ |
| 8. Actions Post-Op | US-018 | 25 | ⬜ |
| 9. Export Documents | US-019, US-020 | 30, 31 | ⬜ |

**Couverture** : 20/20 User Stories mappées ✅

---

## Temps par phase

| Phase | Tâches | Durée | % Total |
|-------|--------|-------|---------|
| 1. Foundation Backend | 01-07 | 10.5h | 18% |
| 2. Frontend Foundation | 08-12 | 8.5h | 15% |
| 3. UI Base | 13-15 | 4.5h | 8% |
| 4. Patients | 16-17 | 3.5h | 6% |
| 5. Consultation | 18-23 | 11.5h | 20% |
| 6. Intervention | 24-25 | 4h | 7% |
| 7. Documents | 26-29 | 6.5h | 11% |
| 8. Integrations | 30-33 | 7h | 12% |
| 9. Admin | 34-36 | 5h | 9% |
| 10. Polish | 37-40 | 4.5h | 8% |
| 11. Deployment | 41 | 2h | 3% |
| **Total** | **41** | **~58h** | **100%** |

---

## Post-MVP (Backlog V0.2+)

| Feature | Description | Priorité |
|---------|-------------|----------|
| Intégration TAMM/DrSanté | APIs logiciels métier | P2 |
| Base médicaments Vidal | Partenariat complet | P2 |
| App mobile React Native | iOS/Android | P3 |
| Portail patient | Espace patient dédié | P3 |
| Connexion DMP | Mon Espace Santé | P3 |
| Mode hors-ligne | PWA avec sync | P3 |

---

## Documentation liée

- [PRD.md](../PRD.md) — Product Requirements (20 User Stories)
- [ARCHI-XANO.md](../ARCHI-XANO.md) — Architecture technique
- [PROJECT_PLAN.md](../PROJECT_PLAN.md) — Structure détaillée du projet

---

## Notes importantes

### Conformité HDS
- Xano certifié HDS (Heroku EU)
- Logs d'audit automatiques (table `audit_log`)
- Données patient anonymisées (IPP uniquement)
- Chiffrement at rest et in transit

### Patterns à suivre (ARCHI.md)
- **Server Actions** pour mutations
- **TanStack Query** pour cache/fetching
- **Zustand** pour état workflow uniquement
- **nuqs** pour filtres URL
- **Zod** pour validation

### Points d'attention
- Latence transcription Whisper < 5s
- Réponse Claude < 10s
- Pas de stockage audio post-transcription
- Validation médecin obligatoire avant export

---

*Généré par task-generator • 22 décembre 2024*
