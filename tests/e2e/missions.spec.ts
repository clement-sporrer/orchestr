import { test, expect } from '@playwright/test'

test.describe('Mission Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/missions')
    await expect(page).toHaveTitle(/Missions/)
  })

  test('should display missions list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Missions/i })).toBeVisible()
  })

  test('should navigate to mission detail', async ({ page }) => {
    const firstMission = page.locator('[data-testid="mission-card"]').first()
    const missionExists = await firstMission.count() > 0
    
    if (missionExists) {
      await firstMission.click()
      await expect(page).toHaveURL(/\/missions\/[a-zA-Z0-9-]+/)
    }
  })

  test('should open create mission form', async ({ page }) => {
    await page.getByRole('button', { name: /Nouvelle mission/i }).click()
    await expect(page).toHaveURL('/missions/new')
  })
})

test.describe('Mission Pipeline', () => {
  test('should display pipeline kanban view', async ({ page }) => {
    await page.goto('/missions/test-mission-id?tab=pipeline')
    
    // Check for kanban columns
    await expect(page.getByText(/Sourcé/i)).toBeVisible()
    await expect(page.getByText(/Contacté/i)).toBeVisible()
  })

  test('should switch between kanban and list view', async ({ page }) => {
    await page.goto('/missions/test-mission-id?tab=pipeline')
    
    // Switch to list view
    const listButton = page.getByRole('button', { name: /Liste/i })
    if (await listButton.isVisible()) {
      await listButton.click()
      await expect(page.getByRole('table')).toBeVisible()
    }
  })

  test('should navigate to sourcing tab', async ({ page }) => {
    await page.goto('/missions/test-mission-id')
    
    await page.getByRole('tab', { name: /Sourcing/i }).click()
    await expect(page).toHaveURL(/tab=sourcing/)
  })
})
