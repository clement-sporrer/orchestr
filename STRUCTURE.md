# Structure du dépôt

Organisation du code pour un repo privé, clair et scalable.

---

## Racine

| Fichier / Dossier | Rôle |
|-------------------|------|
| `src/` | Code applicatif (Next.js, composants, lib) |
| `prisma/` | Schéma DB et migrations |
| `supabase/` | Politiques RLS (sécurité base) |
| `chrome-extension/` | Extension navigateur (capture LinkedIn) |
| `docs/` | Documentation interne |
| `public/` | Assets statiques (extension zip, etc.) |
| `scripts/` | Scripts utilitaires (migrations manuelles, vérif) |
| `.github/` | CI (build, lint), CodeQL, Dependabot, template PR |
| `.env.example` | Modèle des variables d’environnement |
| `next.config.ts`, `tsconfig.json`, etc. | Config projet |

---

## `src/`

### `app/` — Routes (App Router)

- **`(auth)/`** — Connexion, inscription, invite
- **`(dashboard)/`** — App principale (candidats, clients, missions, pipeline, paramètres, tâches, pools, import, onboarding)
- **`(marketing)/`** — Pages publiques (accueil, pricing, extension, contact, legal)
- **`(portals)/`** — Portails candidat et client (accès par token)
- **`api/`** — Routes API (webhooks Stripe/Zoom/Meet, extension, health, auth)
- **`auth/`** — Callback auth
- **`globals.css`**, **`global-error.tsx`** — Globaux

### `components/` — Composants React

- **`ui/`** — Composants génériques (shadcn)
- **`auth/`** — Carte auth, exports
- **`billing/`** — Pricing, upgrade
- **`candidates/`** — Formulaire, enrichissement, statut, tags, export, messages
- **`clients/`** — CRUD client, contacts, dialogs
- **`missions/`** — Shortlist, sourcing, statuts
- **`pipeline/`** — Kanban, liste, colonnes
- **`job-builder/`** — Formulaire mission, visibilité, preview
- **`portals/`** — Portails candidat / client (client components)
- **`interviews/`** — Panneau entretiens
- **`pools/`**, **`tasks/`**, **`search/`** — Pools, tâches, recherche globale
- **`layout/`** — Header, sidebar dashboard
- **`marketing/`** — Hero, features, footer, CTA (pages marketing)

### `lib/` — Logique métier et infra

- **`actions/`** — Server Actions (candidats, clients, missions, pipeline, billing, etc.)
- **`ai/`** — OpenAI (scoring, structuration, messages)
- **`auth/`** — Helpers auth
- **`supabase/`** — Client navigateur, serveur, middleware
- **`utils/`** — Dates, tokens, chiffrement, visibilité
- **`validations/`** — Schémas Zod
- **`filters/`** — Filtres (ex. candidats)
- **`data/`** — Données statiques (ex. lieux)
- **`hooks/`** — Hooks React (ex. debounce)
- **`prisma.ts`**, **`env.ts`**, **`db-errors.ts`**, **`plan-limits.ts`**, **`stripe.ts`** — Config / accès DB / Stripe

### Autres

- **`i18n/`** — Config next-intl, messages EN/FR
- **`types/`** — Réexports types (ex. Prisma)
- **`middleware.ts`** — Auth, i18n, rewrites

---

## `prisma/`

- **`schema.prisma`** — Source de vérité du schéma
- **`migrations/`** — Migrations versionnées
- **`seed.ts`** — Données de seed (optionnel)

Le client Prisma est généré dans **`src/generated/prisma/`** (ignoré par Git, régénéré via `npm run db:generate` ou `postinstall`).

---

## `docs/` (interne)

- **architecture.md** — Vue système, flux
- **database.md** — Schéma, entités
- **api.md** — Endpoints, webhooks
- **business-logic.md** — Règles métier
- **security.md** — Auth, RLS, bonnes pratiques
- **deployment.md** — Vercel, Supabase
- **chrome-extension.md** — Extension LinkedIn
- **prd-v2-*.md** — Suivi produit / écarts

---

## Conventions

- **Imports** : alias `@/` pour `src/`
- **Types** : depuis `@/generated/prisma` ou `src/types`
- **Nouveaux domaines** : un dossier sous `components/` et des actions dédiées sous `lib/actions/`
- **Pas de code open-source** : pas de CONTRIBUTING/CODE_OF_CONDUCT type OSS ; README et SECURITY orientés usage interne.
