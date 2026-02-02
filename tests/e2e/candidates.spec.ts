import { test, expect } from '@playwright/test'

test.describe('Candidate Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/candidates')
    await expect(page).toHaveTitle(/Candidats/)
  })

  test('should display candidates list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Candidats/i })).toBeVisible()
    
    // Check for search input
    await expect(page.getByPlaceholder(/Rechercher/i)).toBeVisible()
  })

  test('should navigate to candidate detail', async ({ page }) => {
    // Click on first candidate card (if any exist)
    const firstCandidate = page.locator('[data-testid="candidate-card"]').first()
    const candidateExists = await firstCandidate.count() > 0
    
    if (candidateExists) {
      await firstCandidate.click()
      await expect(page).toHaveURL(/\/candidates\/[a-zA-Z0-9-]+/)
    }
  })

  test('should open create candidate form', async ({ page }) => {
    await page.getByRole('button', { name: /Nouveau candidat/i }).click()
    await expect(page).toHaveURL('/candidates/new')
  })

  test('should search candidates', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher/i)
    await searchInput.fill('John')
    
    // Wait for search results (debounced)
    await page.waitForTimeout(500)
  })
})

test.describe('Candidate Detail', () => {
  test('should display candidate profile information', async ({ page }) => {
    // Navigate to a test candidate (you'll need to create fixtures)
    await page.goto('/candidates/test-candidate-id')
    
    // Check for key profile sections
    await expect(page.getByText(/Informations/i)).toBeVisible()
  })

  test('should allow adding tags', async ({ page }) => {
    await page.goto('/candidates/test-candidate-id')
    
    // Look for tags section
    const tagsSection = page.locator('[data-testid="tags-editor"]')
    if (await tagsSection.isVisible()) {
      // Test tag addition
      await tagsSection.getByRole('button', { name: /Ajouter/i }).click()
    }
  })

  test('should display candidate interactions', async ({ page }) => {
    await page.goto('/candidates/test-candidate-id')
    
    // Check for interactions section
    await expect(page.getByText(/Interactions/i)).toBeVisible()
  })
})
