import { test, expect, Page } from '@playwright/test'

test.describe('Bookings', () => {
  test('bookings page requires authentication', async ({ page }) => {
    await page.goto('/bookings')
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('public booking page loads', async ({ page }) => {
    await page.goto('/b/demo-berber')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('kiosk page loads', async ({ page }) => {
    await page.goto('/kiosk/demo-berber')
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Dashboard Bookings (Authenticated)', () => {
  // These tests are skipped by default as they require a test user
  // To enable: create a test user and set TEST_USER_EMAIL/TEST_USER_PASSWORD env vars
  test.skip('dashboard bookings page loads after login', async ({ page }: { page: Page }) => {
    await login(page)
    await page.goto('/bookings')
    await expect(page.locator('h1:has-text("Randevular")')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test.skip('booking filter works', async ({ page }: { page: Page }) => {
    await login(page)
    await page.goto('/bookings')
    await page.selectOption('select', 'confirmed')
    await expect(page.locator('table')).toBeVisible()
  })

  test.skip('booking search works', async ({ page }: { page: Page }) => {
    await login(page)
    await page.goto('/bookings')
    await page.fill('input[placeholder="Müşteri ara..."]', 'Test')
    await expect(page.locator('table')).toBeVisible()
  })
})

// Helper function to login - used by skipped tests
async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input#email', process.env.TEST_USER_EMAIL || 'test@example.com')
  await page.fill('input#password', process.env.TEST_USER_PASSWORD || 'password')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 10000 })
}
