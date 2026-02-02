import { test, expect } from '@playwright/test'

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clients')
    await expect(page).toHaveTitle(/Clients/)
  })

  test('should display clients list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Clients/i })).toBeVisible()
  })

  test('should navigate to client detail', async ({ page }) => {
    const firstClient = page.locator('[data-testid="client-card"]').first()
    const clientExists = await firstClient.count() > 0
    
    if (clientExists) {
      await firstClient.click()
      await expect(page).toHaveURL(/\/clients\/[a-zA-Z0-9-]+/)
    }
  })

  test('should open create client form', async ({ page }) => {
    await page.getByRole('button', { name: /Nouveau client/i }).click()
    await expect(page).toHaveURL('/clients/new')
  })

  test('should search clients', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Rechercher/i)
    await searchInput.fill('Company')
    
    await page.waitForTimeout(500)
  })
})

test.describe('Client Detail', () => {
  test('should display client information', async ({ page }) => {
    await page.goto('/clients/test-client-id')
    
    await expect(page.getByText(/Informations/i)).toBeVisible()
  })

  test('should display client missions', async ({ page }) => {
    await page.goto('/clients/test-client-id')
    
    await expect(page.getByText(/Missions/i)).toBeVisible()
  })

  test('should allow adding contacts', async ({ page }) => {
    await page.goto('/clients/test-client-id')
    
    const addContactButton = page.getByRole('button', { name: /Ajouter un contact/i })
    if (await addContactButton.isVisible()) {
      await addContactButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()
    }
  })
})
