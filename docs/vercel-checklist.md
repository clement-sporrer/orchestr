# Checklist Vercel - Configuration Production

## 1. Variables d'environnement (Settings → Environment Variables)

### Variables REQUISES (Build + Runtime)

| Variable | Scope | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Production, Preview | URL de connexion Supabase avec pooling (Transaction mode) |
| `DIRECT_URL` | Production, Preview | URL directe Supabase (Session mode) pour les migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | URL publique Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Clé anonyme Supabase |

### Variables OPTIONNELLES

| Variable | Scope | Description |
|----------|-------|-------------|
| `ENCRYPTION_KEY` | Production, Preview | Clé 64 hex pour chiffrement LinkedIn |
| `STRIPE_SECRET_KEY` | Production | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Production | Secret webhook Stripe |
| `OPENAI_API_KEY` | Production | Clé API OpenAI (scoring/messages) |

### Format des URLs Supabase

```bash
# DATABASE_URL - Utiliser le pooler (port 6543, Transaction mode)
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# DIRECT_URL - Connexion directe (port 5432, Session mode)
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

> ⚠️ Le `?pgbouncer=true` est REQUIS dans `DATABASE_URL` pour le pooling serverless.

---

## 2. Migrations en Production

### Option A : Migration manuelle (recommandé pour MVP)

```bash
# Avant chaque déploiement avec changements de schéma
npx prisma migrate deploy
```

### Option B : Migration automatique via Build Command

Dans **Project Settings → Build & Development Settings** :

```
Build Command: npm run db:deploy && npm run build
```

> ⚠️ Ne pas utiliser en production si plusieurs déploiements simultanés sont possibles.

### Option C : GitHub Action (recommandé pour équipe)

```yaml
# .github/workflows/migrate.yml
name: Database Migration
on:
  push:
    branches: [main]
    paths: ['prisma/migrations/**']

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 3. Vérification post-déploiement

### Healthcheck DB

```bash
curl https://your-app.vercel.app/api/health/db
```

Réponse attendue :
```json
{"status":"ok","timestamp":"2024-...","latencyMs":45}
```

### Logs d'erreur

Dans **Vercel Dashboard → Deployments → Functions** :
- Chercher les logs avec `[Dashboard Layout DB Error]` ou `[App Error]`
- Les codes d'erreur Prisma (P1001, P2002, etc.) indiquent le problème

---

## 4. Codes d'erreur Prisma courants

| Code | Signification | Solution |
|------|--------------|----------|
| `P1001` | Can't reach database server | Vérifier DATABASE_URL, IP allowlist |
| `P1002` | Connection timed out | Augmenter timeout, vérifier pooling |
| `P2002` | Unique constraint violation | Données dupliquées |
| `P2003` | Foreign key constraint failed | Référence invalide |
| `P2021` | Table does not exist | Exécuter `prisma migrate deploy` |
| `P2025` | Record not found | Données manquantes |

---

## 5. Configuration SSL (Supabase)

Le SSL est activé par défaut avec Supabase. Si problème de certificat :

```bash
# Ajouter à DATABASE_URL si nécessaire
?sslmode=require&sslaccept=accept_invalid_certs
```

---

## 6. Debugging en Production

### Activer les logs Prisma (temporaire)

```typescript
// src/lib/prisma.ts - NE PAS LAISSER EN PROD
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Debug seulement
  })
}
```

### Vérifier les env vars au runtime

```bash
# Dans la console Vercel (Functions)
console.log('DB URL defined:', !!process.env.DATABASE_URL)
```

---

## 7. Limites Serverless

- **Connections** : Max ~20 connections par instance (pooling requis)
- **Timeout** : 10s par défaut (30s pour API routes configurées)
- **Cold start** : ~500ms-2s avec Prisma

### Optimisations

1. Utiliser `?connection_limit=1` dans DATABASE_URL pour serverless
2. Activer Prisma Accelerate pour le cache de requêtes
3. Préférer les requêtes simples aux transactions longues

