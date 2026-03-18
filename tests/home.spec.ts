import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/RandevuAI/)
    await expect(page.getByRole('heading', { name: /Randevularınızı dijitalleş/ })).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a:has-text("Giriş Yap")')).toBeVisible()
    await expect(page.locator('a:has-text("Ücretsiz Başla")')).toBeVisible()
  })

  test('features section is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2:has-text("Tüm ihtiyaçlarınız tek platformda")')).toBeVisible()
    // Use more specific selectors for headings
    await expect(page.getByRole('heading', { name: 'Online Randevu' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Otomatik Hatırlatmalar' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Müşteri Takibi' })).toBeVisible()
  })

  test('header navigation is visible', async ({ page }) => {
    await page.goto('/')
    // Use header-specific selectors
    const header = page.locator('header')
    await expect(header.locator('a:has-text("Özellikler")').first()).toBeVisible()
    await expect(header.locator('a:has-text("Fiyatlandırma")').first()).toBeVisible()
    await expect(header.locator('a:has-text("SSS")').first()).toBeVisible()
  })
})
