import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/RandevuAI/)
    await expect(page.locator('h2:has-text("Hesabınıza giriş yapın")')).toBeVisible()
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input#email', 'invalid@example.com')
    await page.fill('input#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=E-posta veya şifre hatalı')).toBeVisible({ timeout: 5000 })
  })

  test('login form validation works', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')
    // HTML5 validation should prevent submission
    await expect(page).toHaveURL('/login')
  })

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.locator('input#name')).toBeVisible()
    await expect(page.locator('input#businessName')).toBeVisible()
  })

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('h2:has-text("Şifremi Unuttum")')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('navigation between auth pages works', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Hemen kayıt olun')
    await expect(page).toHaveURL('/register')

    await page.click('text=Giriş yapın')
    await expect(page).toHaveURL('/login')
  })
})
