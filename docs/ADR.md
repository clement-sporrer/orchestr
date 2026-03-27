# Architecture Decision Records — ORCHESTR
# Retrofitted by Claude Code on 2026-03-27
# Decisions inferred from reading the actual codebase.

---

## ADR-001 — Prisma ORM + Supabase SDK (dual usage)

**Statut :** Actif

**Contexte :**
Supabase expose un SDK JS et une API REST. Prisma est un ORM TypeScript avec type-safety.

**Décision :**
- Prisma pour toutes les opérations DB (CRUD, migrations, schema)
- Supabase SDK uniquement pour l'auth (sessions, cookies SSR via `@supabase/ssr`)
- PgBouncer (port 6543) pour le runtime serverless, direct URL (port 5432) pour les migrations

**Conséquences :**
- Type-safety totale sur les queries DB
- Migrations gérées par Prisma (pas Supabase migrations)
- RLS Supabase reste actif comme defense-in-depth
- Deux clients à maintenir (Prisma + Supabase Auth) — complexité acceptable

---

## ADR-002 — Server Actions comme couche RPC principale

**Statut :** Actif

**Contexte :**
Next.js propose des Server Actions et des API Routes. Les deux permettent du code serveur.

**Décision :**
Server Actions (`'use server'`) pour toutes les mutations métier. API Routes uniquement pour :
- Webhooks externes (Stripe, Calendly) — nécessitent des headers HTTP bruts
- Extension Chrome — API externe au browser
- Health checks

**Conséquences :**
- Couplage fort front/back — acceptable pour une app monolithique
- Type-safety de bout en bout sans génération de client
- Pas de versionning d'API pour la logique interne
- Webhooks isolés dans `src/app/api/`

---

## ADR-003 — Multi-tenancy via RLS PostgreSQL

**Statut :** Actif

**Contexte :**
Isolation des données entre organisations : filtering applicatif ou RLS DB.

**Décision :**
Double couche : `organizationId` sur toutes les tables + RLS Supabase via `current_org_id()`.
Les Server Actions vérifient également l'org en amont (defense-in-depth).

**Conséquences :**
- Isolation garantie même si une action oublie le filtre applicatif
- `current_org_id()` SECURITY DEFINER — à auditer si Supabase est mis à jour
- Complexité de setup initial (policies.sql à maintenir manuellement)

---

## ADR-004 — TanStack Query v5 pour le cache client

**Statut :** Actif

**Contexte :**
Next.js App Router avec Server Components réduit le besoin de data fetching client.
Mais certaines vues (dashboard filtres, pipeline) nécessitent un cache réactif.

**Décision :**
React Query pour les vues interactives avec filtres/pagination côté client.
Server Components pour le rendu initial des pages. Pas de Redux ou autre state manager global pour la data serveur.

**Conséquences :**
- Bundle légèrement plus lourd (@tanstack/react-query)
- Invalidation de cache explicite après chaque mutation (Server Action → `queryClient.invalidateQueries`)
- Pattern : fetch initial SSR + hydratation React Query côté client

---

## ADR-005 — Vitest (unit) + Playwright (E2E) au lieu de Jest

**Statut :** Actif — sous-utilisé

**Contexte :**
Jest est le standard historique React. Vitest est plus rapide et compatible ESM nativement.

**Décision :**
Vitest pour les tests unitaires, Playwright pour les E2E.
Config présente (`vitest.config.ts`, `playwright.config.ts`) mais tests unitaires non écrits.

**Conséquences :**
- Setup correct mais dette : aucun test unitaire existant
- E2E Playwright couvre auth, candidates, clients, missions
- CI ne run pas les tests — risque de régression non détectée

---

## ADR-006 — next-intl pour l'internationalisation EN/FR

**Statut :** Actif

**Contexte :**
L'app cible des agences francophones mais avec une codebase en anglais.

**Décision :**
next-intl v4 avec middleware de routing. Traductions dans `src/i18n/`.
Toutes les strings UI passent par `useTranslations()`.

**Conséquences :**
- Overhead de maintenance des fichiers de traduction
- Pas de strings hardcodées autorisées dans les composants UI
- Routing automatique par locale

---

## ADR-007 — Stripe pour le billing avec plan limits

**Statut :** Actif

**Contexte :**
SaaS multi-tenant nécessite un contrôle des features par plan.

**Décision :**
Stripe pour les paiements + webhooks. Limites par plan dans `src/lib/plan-limits.ts`.
Webhooks Stripe via `src/app/api/webhooks/stripe/`.

**Conséquences :**
- Logique de billing centralisée dans `plan-limits.ts`
- Dépendance externe critique — les webhooks doivent être idempotents
- Pas de billing custom à maintenir

---

## ADR-008 — OpenAI GPT-4o-mini pour le scoring IA

**Statut :** Actif

**Contexte :**
Scoring automatique des candidats par rapport aux missions.

**Décision :**
GPT-4o-mini (coût/performance) pour les suggestions et scoring.
Logique dans `src/lib/ai/` et `src/lib/suggestions/`.

**Conséquences :**
- Coût variable selon usage — surveiller les tokens
- Latence ajoutée sur les vues avec scoring
- Pas de modèle custom — dépendance OpenAI API
