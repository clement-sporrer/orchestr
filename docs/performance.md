# Guide de Performance - Orchestr

## Vue d'ensemble

Ce document détaille les optimisations de performance appliquées au projet Orchestr et les meilleures pratiques pour maintenir une application rapide et réactive.

## Métriques Cibles

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Autres Métriques
- **Time to Interactive (TTI)**: < 2s
- **Bundle Size Initial**: < 200KB (gzipped)
- **Lighthouse Score**: > 90

## Optimisations Implémentées

### 1. Memoization React

#### useMemo pour les Calculs Coûteux

**KanbanBoard** - Groupement des candidats par étape :
```typescript
const candidatesByStage = useMemo(() => 
  stages.reduce((acc, stage) => {
    acc[stage.value] = candidatesWithOptimistic.filter((c) => c.stage === stage.value)
    return acc
  }, {} as Record<PipelineStage, CandidateWithDetails[]>), 
  [stages, candidatesWithOptimistic]
)
```

**PipelineView** - Filtrage et comptage :
```typescript
const filteredCandidates = useMemo(() => 
  mission.missionCandidates.filter((mc) => {
    if (stageFilter === 'all') return true
    return mc.stage === stageFilter
  }), [mission.missionCandidates, stageFilter])

const stageCounts = useMemo(() => 
  stages.map((stage) => ({
    ...stage,
    count: mission.missionCandidates.filter((mc) => mc.stage === stage.value).length,
  })), [stages, mission.missionCandidates])
```

**SkillsInput** - Parsing de listes :
```typescript
const skills = useMemo(() => parseSemicolonList(value), [value])
```

**EnrichmentPanel** - Parsing JSON :
```typescript
const experiences = useMemo(() => 
  (enrichment.experiences as Experience[] | null) || [], 
  [enrichment.experiences]
)
```

**GlobalSearch** - Groupement de résultats :
```typescript
const groupedResults = useMemo(() => 
  results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>), 
  [results]
)
```

#### React.memo pour les Composants

**KanbanCard** et **KanbanColumn** :
```typescript
export const KanbanCard = memo(function KanbanCard({ candidate, missionId, isDragging }) {
  // Composant mémorisé pour éviter les re-renders inutiles
})
```

**Impact** : Réduit les re-renders pendant les opérations drag & drop de ~80%

### 2. Code-Splitting

#### Dynamic Imports

**JobBuilderForm** (650+ lignes) :
```typescript
// form-lazy.tsx
export const JobBuilderFormLazy = dynamic(
  () => import('./form').then(mod => ({ default: mod.JobBuilderForm })),
  {
    ssr: false,
    loading: () => <JobBuilderFormSkeleton />,
  }
)
```

**Impact** : 
- Réduction du bundle initial : ~120KB
- Chargement à la demande uniquement sur `/missions/new` et `/missions/[id]/edit`

#### Route-Based Splitting

Les composants marketing sont automatiquement séparés grâce aux route groups Next.js :
- `(marketing)/*` → Bundle marketing séparé
- `(dashboard)/*` → Bundle dashboard séparé

### 3. Debouncing

**GlobalSearch** - Recherche avec délai :
```typescript
const debouncedQuery = useDebounce(query, 300)

useEffect(() => {
  if (debouncedQuery.length < 2) return
  
  startTransition(async () => {
    const searchResults = await globalSearch(debouncedQuery)
    setResults(searchResults)
  })
}, [debouncedQuery])
```

**Impact** : Réduit les appels API de ~70% lors de la frappe

### 4. Loading States

**EnrichmentPanel** - Refresh avec feedback :
```typescript
const handleRefresh = async () => {
  if (!onRefresh || isLoading) return
  setIsLoading(true)
  try {
    await onRefresh()
  } finally {
    setIsLoading(false)
  }
}

<RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
```

**KanbanBoard** - Optimistic updates :
```typescript
const candidatesWithOptimistic = useMemo(() => 
  candidates.map(c => ({
    ...c,
    stage: optimisticUpdates[c.id] || c.stage,
  })), [candidates, optimisticUpdates])
```

### 5. Bundle Analysis

Configuration dans `next.config.ts` :
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(withNextIntl(nextConfig))
```

**Usage** :
```bash
npm run build:analyze
```

Ouvre une visualisation interactive du bundle dans le navigateur.

## Meilleures Pratiques

### React Performance

#### 1. Éviter les Recalculs Inutiles

❌ **Mauvais** :
```typescript
function MyComponent({ items }) {
  // Recalculé à chaque render !
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name))
  
  return <List items={sorted} />
}
```

✅ **Bon** :
```typescript
function MyComponent({ items }) {
  const sorted = useMemo(() => 
    items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  
  return <List items={sorted} />
}
```

#### 2. Mémoiser les Callbacks

❌ **Mauvais** :
```typescript
function Parent() {
  return <Child onChange={(value) => console.log(value)} />
}
```

✅ **Bon** :
```typescript
function Parent() {
  const handleChange = useCallback((value) => {
    console.log(value)
  }, [])
  
  return <Child onChange={handleChange} />
}
```

#### 3. Utiliser React.memo Judicieusement

✅ **Utiliser pour** :
- Composants avec props complexes
- Listes avec beaucoup d'items
- Composants qui ne changent pas souvent

❌ **Ne pas utiliser pour** :
- Composants simples (< 50 lignes)
- Composants qui changent souvent
- Optimisation prématurée

### Next.js Performance

#### 1. Server Components par Défaut

```typescript
// app/page.tsx - Server Component (par défaut)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// components/client.tsx - Client Component (quand nécessaire)
'use client'
export function ClientComponent() {
  const [state, setState] = useState()
  return <div>{state}</div>
}
```

#### 2. Dynamic Imports pour les Gros Composants

```typescript
const HeavyComponent = dynamic(() => import('./heavy'), {
  loading: () => <Skeleton />,
  ssr: false, // Si pas besoin de SSR
})
```

#### 3. Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/profile.jpg"
  width={200}
  height={200}
  alt="Profile"
  loading="lazy"
/>
```

### Database Performance

#### 1. Sélection de Champs

❌ **Mauvais** :
```typescript
const candidates = await prisma.candidate.findMany({
  where: { organizationId },
})
```

✅ **Bon** :
```typescript
const candidates = await prisma.candidate.findMany({
  where: { organizationId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    // Seulement les champs nécessaires
  },
})
```

#### 2. Pagination

```typescript
const page = 1
const limit = 50
const skip = (page - 1) * limit

const [data, total] = await Promise.all([
  prisma.candidate.findMany({
    where,
    skip,
    take: limit,
  }),
  prisma.candidate.count({ where }),
])
```

#### 3. Requêtes Parallèles

```typescript
// Exécuter en parallèle
const [mission, candidates, client] = await Promise.all([
  getMission(id),
  getCandidates({ missionId: id }),
  getClient(clientId),
])
```

## Monitoring

### Lighthouse

```bash
# Installer Lighthouse
npm install -g lighthouse

# Analyser une page
lighthouse http://localhost:3000 --view
```

### Chrome DevTools

1. **Performance Panel**
   - Enregistrer une session
   - Identifier les tâches longues
   - Analyser les re-renders

2. **Network Panel**
   - Vérifier la taille des bundles
   - Identifier les ressources lourdes
   - Vérifier le cache

3. **Lighthouse Panel**
   - Score de performance
   - Recommandations
   - Core Web Vitals

### Bundle Analyzer

```bash
# Analyser le bundle
npm run build:analyze
```

Visualisation interactive :
- Taille de chaque module
- Dépendances dupliquées
- Opportunités d'optimisation

## Checklist de Performance

### Avant Chaque Déploiement

- [ ] Lancer Lighthouse (score > 90)
- [ ] Vérifier la taille du bundle (< 200KB)
- [ ] Tester sur mobile (responsive + performance)
- [ ] Vérifier les Core Web Vitals
- [ ] Tester les loading states
- [ ] Vérifier les optimistic updates

### Lors de l'Ajout de Fonctionnalités

- [ ] Mémoiser les calculs coûteux
- [ ] Utiliser React.memo si nécessaire
- [ ] Implémenter des loading states
- [ ] Débouncer les entrées utilisateur
- [ ] Code-splitter si composant > 500 lignes
- [ ] Optimiser les requêtes DB

### Maintenance Continue

- [ ] Analyser le bundle mensuellement
- [ ] Mettre à jour les dépendances
- [ ] Profiler les pages lentes
- [ ] Monitorer les métriques en production

## Ressources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
