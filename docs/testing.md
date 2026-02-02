# Guide de Tests - Orchestr

## Vue d'ensemble

Ce projet utilise deux frameworks de test complémentaires :
- **Vitest** pour les tests unitaires (fonctions utilitaires, validations, hooks)
- **Playwright** pour les tests end-to-end (parcours utilisateur complets)

## Tests Unitaires (Vitest)

### Configuration

La configuration se trouve dans `vitest.config.ts` :
- Environment: jsdom (simulation du DOM)
- Setup file: `vitest.setup.ts` (mocks Next.js)
- Coverage: v8 provider

### Commandes

```bash
# Lancer les tests en mode watch
npm test

# Lancer les tests avec l'interface UI
npm run test:ui

# Générer un rapport de couverture
npm run test:coverage
```

### Structure des Tests

Les tests unitaires sont colocalisés avec le code testé :
```
src/
  lib/
    validations/
      candidate.ts
      candidate.test.ts  # Tests pour les validations
    hooks/
      use-debounce.ts
      use-debounce.test.ts  # Tests pour le hook
```

### Exemples de Tests

#### Test de fonction utilitaire

```typescript
import { describe, it, expect } from 'vitest'
import { parseSemicolonList } from './candidate'

describe('parseSemicolonList', () => {
  it('should parse semicolon-separated string', () => {
    const result = parseSemicolonList('skill1; skill2; skill3')
    expect(result).toEqual(['skill1', 'skill2', 'skill3'])
  })
})
```

#### Test de hook React

```typescript
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './use-debounce'

it('should debounce value changes', () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: 'initial' } }
  )
  
  rerender({ value: 'updated' })
  expect(result.current).toBe('initial')
  
  act(() => { vi.advanceTimersByTime(300) })
  expect(result.current).toBe('updated')
})
```

### Qu'est-ce qu'on teste ?

✅ **À tester** :
- Fonctions de transformation de données
- Fonctions de validation (Zod schemas)
- Hooks React personnalisés
- Fonctions utilitaires (parsing, formatting)
- Calculs métier

❌ **À ne pas tester** :
- Composants UI complexes (utiliser E2E)
- Server Actions (nécessitent DB)
- Intégrations externes

## Tests End-to-End (Playwright)

### Configuration

La configuration se trouve dans `playwright.config.ts` :
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Base URL: http://localhost:3000
- Auto-start du serveur de dev

### Commandes

```bash
# Lancer tous les tests E2E
npm run test:e2e

# Lancer avec l'interface UI
npm run test:e2e:ui

# Lancer en mode debug
npm run test:e2e:debug

# Installer les navigateurs (première fois)
npx playwright install
```

### Structure des Tests

Les tests E2E sont dans le dossier `tests/e2e/` :
```
tests/
  e2e/
    auth.setup.ts      # Setup d'authentification
    candidates.spec.ts # Tests candidats
    missions.spec.ts   # Tests missions
    clients.spec.ts    # Tests clients
```

### Parcours Critiques Testés

#### 1. Gestion des Candidats
- ✅ Affichage de la liste
- ✅ Navigation vers le détail
- ✅ Recherche
- ✅ Ajout de tags
- ✅ Visualisation des interactions

#### 2. Gestion des Missions
- ✅ Affichage de la liste
- ✅ Navigation vers le détail
- ✅ Pipeline Kanban
- ✅ Basculement Kanban/Liste
- ✅ Navigation vers Sourcing

#### 3. Gestion des Clients
- ✅ Affichage de la liste
- ✅ Navigation vers le détail
- ✅ Recherche
- ✅ Ajout de contacts
- ✅ Visualisation des missions

### Exemple de Test E2E

```typescript
import { test, expect } from '@playwright/test'

test.describe('Candidate Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/candidates')
  })

  test('should display candidates list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Candidats/i })).toBeVisible()
    await expect(page.getByPlaceholder(/Rechercher/i)).toBeVisible()
  })

  test('should search candidates', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher/i)
    await searchInput.fill('John')
    await page.waitForTimeout(500) // Debounce
  })
})
```

## Meilleures Pratiques

### Tests Unitaires

1. **Un test = une fonctionnalité**
   - Testez un seul comportement par test
   - Nommez clairement : `should do X when Y`

2. **Arrange-Act-Assert**
   ```typescript
   it('should uppercase lastName', () => {
     // Arrange
     const input = { firstName: 'John', lastName: 'doe' }
     
     // Act
     const result = transformCandidate(input)
     
     // Assert
     expect(result.lastName).toBe('DOE')
   })
   ```

3. **Testez les cas limites**
   - Valeurs nulles/undefined
   - Chaînes vides
   - Arrays vides
   - Erreurs attendues

### Tests E2E

1. **Utilisez des sélecteurs sémantiques**
   ```typescript
   // ✅ Bon
   page.getByRole('button', { name: /Nouveau candidat/i })
   page.getByPlaceholder(/Rechercher/i)
   
   // ❌ Éviter
   page.locator('.btn-primary')
   page.locator('#search-input')
   ```

2. **Attendez les états asynchrones**
   ```typescript
   // Attendre une navigation
   await page.waitForURL('/candidates/123')
   
   // Attendre un élément
   await expect(page.getByText('Success')).toBeVisible()
   
   // Attendre un timeout (debounce)
   await page.waitForTimeout(500)
   ```

3. **Isolez les tests**
   - Chaque test doit être indépendant
   - Nettoyez les données de test
   - Utilisez des fixtures

## CI/CD

### GitHub Actions

Les tests peuvent être intégrés dans un workflow CI/CD :

```yaml
- name: Run unit tests
  run: npm test -- --run

- name: Run E2E tests
  run: npm run test:e2e
```

## Couverture de Code

Objectif : **> 70%** de couverture

Pour générer le rapport :
```bash
npm run test:coverage
```

Le rapport HTML sera généré dans `coverage/index.html`.

### Zones Prioritaires

1. **Validations** (80%+)
   - Schémas Zod
   - Transformations de données

2. **Utils** (70%+)
   - Parsing
   - Formatting
   - Calculs

3. **Hooks** (60%+)
   - Hooks personnalisés

## Debugging

### Vitest

```bash
# Mode watch avec UI
npm run test:ui

# Debug dans VSCode
# Ajouter breakpoint et lancer "Debug Vitest"
```

### Playwright

```bash
# Mode debug
npm run test:e2e:debug

# UI mode (recommandé)
npm run test:e2e:ui

# Traces
npx playwright show-trace trace.zip
```

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
