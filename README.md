# ORCHESTR

Plateforme de recrutement pour agences. CRM clients, missions, base candidats, pipeline, portails candidat/client, scoring IA.

**Propriétaire** — Sporrer. Usage interne uniquement.

---

## Stack

| Couche      | Techno |
|------------|--------|
| Frontend   | Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui |
| Backend    | Server Actions |
| Base       | PostgreSQL (Supabase), Prisma |
| Auth       | Supabase Auth + RLS |
| Paiements  | Stripe |
| Déploiement| Vercel |

---

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner les variables
npm run db:generate
npm run db:migrate
psql $DATABASE_URL < supabase/policies.sql
npm run dev
```

→ http://localhost:3000

---

## Structure du repo

Voir [docs/architecture.md](docs/architecture.md) et [STRUCTURE.md](STRUCTURE.md).

| Dossier | Rôle |
|---------|------|
| `src/app/` | Routes Next.js : (auth), (dashboard), (marketing), (portals), api |
| `src/components/` | Composants React par domaine (candidates, clients, pipeline, ui…) |
| `src/lib/` | Actions serveur, AI, auth, DB, utils, validations |
| `src/i18n/` | Traductions EN/FR |
| `prisma/` | Schéma et migrations |
| `supabase/` | Politiques RLS |
| `chrome-extension/` | Extension LinkedIn |
| `docs/` | Doc interne |

---

## Commandes

| Commande | Usage |
|----------|--------|
| `npm run dev` | Serveur de dev (Turbopack) |
| `npm run build` | Build prod |
| `npm run lint` | ESLint |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:migrate` | Migrations (dev) |
| `npm run db:deploy` | Migrations (prod) |
| `npm run db:studio` | Prisma Studio |

Variables d’environnement : voir `.env.example`.
