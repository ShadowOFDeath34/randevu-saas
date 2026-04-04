import { test, expect } from '@playwright/test'

/**
 * Dashboard E2E Tests
 * Tests the main dashboard page with all widgets and statistics
 */

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login işlemi
    await page.goto('/login')
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should display all stat cards', async ({ page }) => {
    // Tüm istatistik kartlarının görünürlüğü
    const statCards = [
      'Bugünkü Randevular',
      'Bu Hafta',
      'Aylık Gelir',
      'Toplam Müşteri',
      'Müşteri Memnuniyeti',
    ]

    for (const cardTitle of statCards) {
      // Kart başlığı <p> elementi içinde, sadece label metniyle eşleşmeli
      const cardElement = page.locator('.card-premium').filter({
        has: page.locator('p.text-neutral-500', { hasText: cardTitle })
      })
      await expect(cardElement).toBeVisible()
    }
  })

  test('should display revenue chart', async ({ page }) => {
    // Wait for the revenue chart to load and display title
    // The chart fetches data client-side and shows animate-pulse while loading
    const revenueChartTitle = page.locator('h3:has-text("Günlük Gelir")')
    await expect(revenueChartTitle).toBeVisible({ timeout: 15000 })

    // Verify the chart container is present
    const chartContainer = page.locator('.card-premium').filter({
      has: page.locator('h3:has-text("Günlük Gelir")')
    })
    await expect(chartContainer).toBeVisible()
  })

  test('should display weekly stats chart', async ({ page }) => {
    // Wait for the weekly stats chart to load and display title
    const weeklyChartTitle = page.locator('h3:has-text("Haftalık Trend")')
    await expect(weeklyChartTitle).toBeVisible({ timeout: 15000 })

    // Verify the chart container is present
    const chartContainer = page.locator('.card-premium').filter({
      has: page.locator('h3:has-text("Haftalık Trend")')
    })
    await expect(chartContainer).toBeVisible()
  })

  test('should display popular services chart', async ({ page }) => {
    // Popüler hizmetler widget'ı
    const popularServices = page.locator('h3:has-text("Popüler Hizmetler")')
    await expect(popularServices).toBeVisible()
  })

  test('should display recent bookings list', async ({ page }) => {
    // Son randevular başlığı
    const recentBookings = page.locator('h2:has-text("Son Randevular")')
    await expect(recentBookings).toBeVisible()

    // Liste konteyneri görünür mü?
    const bookingsList = page.locator('.card-premium').filter({
      has: page.locator('h2:has-text("Son Randevular")')
    })
    await expect(bookingsList).toBeVisible()

    // Liste öğeleri (divide-y class ile ayrılmış div'ler)
    const listItems = bookingsList.locator('.divide-y > div')
    // En az bir öğe var mı veya "Henüz randevu yok" mesajı
    const emptyMessage = bookingsList.locator('text=Henüz randevu yok')
    await expect(listItems.or(emptyMessage)).toBeVisible()
  })

  test('should navigate to all bookings page', async ({ page }) => {
    // "Tümünü Gör" linkine tıkla - text içeren link seç
    const viewAllLink = page.locator('a:text-is("Tümünü Gör")')
    await expect(viewAllLink).toBeVisible()
    await viewAllLink.click()

    // Randevular sayfasına yönlendirildi mi?
    await page.waitForURL('**/bookings')

    const pageTitle = page.locator('h1:has-text("Randevular")')
    await expect(pageTitle).toBeVisible()
  })

  test('should have working quick action buttons', async ({ page }) => {
    // Hızlı işlem butonları (Hızlı İşlemler kartı içinde)
    const quickActions = [
      { name: 'Yeni Randevu', href: '/bookings' },
      { name: 'Hizmet Ekle', href: '/services' },
      { name: 'Personel Ekle', href: '/staff' },
      { name: 'Kiosk Modu', href: '/kiosk' },
    ]

    // Hızlı İşlemler kartını bul
    const quickActionsCard = page.locator('.card-premium').filter({
      has: page.locator('h2:has-text("Hızlı İşlemler")')
    })
    await expect(quickActionsCard).toBeVisible()

    for (const action of quickActions) {
      const button = quickActionsCard.locator(`a:has-text("${action.name}")`)
      await expect(button).toBeVisible()

      // Href attribute kontrolü
      const href = await button.getAttribute('href')
      expect(href).toContain(action.href)
    }
  })

  test('should display charts with loading states', async ({ page }) => {
    // Sayfayı yeniden yükle
    await page.reload()

    // Wait for charts to load - charts fetch data client-side and show titles after loading
    // Use specific chart titles with longer timeout since data fetching takes time
    const revenueChart = page.locator('h3:has-text("Günlük Gelir")')
    const weeklyChart = page.locator('h3:has-text("Haftalık Trend")')
    const popularServices = page.locator('h3:has-text("Popüler Hizmetler")')

    // All charts should eventually be visible
    await expect(revenueChart).toBeVisible({ timeout: 15000 })
    await expect(weeklyChart).toBeVisible({ timeout: 15000 })
    await expect(popularServices).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Dashboard Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should display correctly on mobile', async ({ page }) => {
    // Mobil viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Sayfa düzgün yükleniyor mu?
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()

    // Stat kartları dikey sıralanmalı
    const statCards = page.locator('.card-premium')
    const count = await statCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display correctly on tablet', async ({ page }) => {
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()

    // Grafikler görünür mü?
    const charts = page.locator('.card-premium')
    await expect(charts.first()).toBeVisible()
  })

  test('should display correctly on desktop', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()

    // Tüm widget'lar aynı anda görünür
    const revenueChart = page.locator('h3:has-text("Günlük Gelir")')
    const weeklyChart = page.locator('h3:has-text("Haftalık Trend")')
    const popularServices = page.locator('h3:has-text("Popüler Hizmetler")')

    await expect(revenueChart).toBeVisible()
    await expect(weeklyChart).toBeVisible()
    await expect(popularServices).toBeVisible()
  })
})

test.describe('Dashboard Data Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test.skip('should refresh data periodically', async ({ page }) => {
    // Skip: SSE connections prevent networkidle state
    // Initial load
    await page.waitForLoadState('networkidle')

    // Veri yüklendikten sonra loading spinner yok
    const initialSpinner = page.locator('svg.animate-spin')
    await expect(initialSpinner).not.toBeVisible()
  })

  test('should handle empty data gracefully', async ({ page }) => {
    // Boş veri durumunda hata mesajı göstermemeli
    const errorMessage = page.locator('text=Bir hata oluştu')
    await expect(errorMessage).not.toBeVisible()
  })
})

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should navigate to settings page', async ({ page }) => {
    // Settings linkini bekle ve tıkla - sidebar'daki /settings/profile linki
    const settingsLink = page.locator('a[href="/settings/profile"]')
    await expect(settingsLink).toBeVisible()
    await settingsLink.click()

    await page.waitForURL('**/settings/**')

    // Settings page displays "Ayarlar" as the h1 title
    const settingsTitle = page.locator('h1:has-text("Ayarlar")')
    await expect(settingsTitle).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to reviews page', async ({ page }) => {
    // Reviews linkini bekle ve tıkla
    const reviewsLink = page.locator('a[href="/reviews"]')
    await expect(reviewsLink).toBeVisible()
    await reviewsLink.click()

    await page.waitForURL('**/reviews')

    const reviewsTitle = page.locator('h1:has-text("Değerlendirmeler")')
    await expect(reviewsTitle).toBeVisible({ timeout: 10000 })
  })

  test('should logout successfully', async ({ page }) => {
    // Çıkış butonunu bul (title attribute ile) ve tıkla
    const logoutButton = page.locator('button[title="Çıkış Yap"]')
    await expect(logoutButton).toBeVisible()
    await logoutButton.click()

    // Landing page'e yönlendirildi mi?
    await page.waitForURL('**/')

    // Landing page header'daki RandevuAI logo görünür (first match to avoid multiple elements)
    const landingPageLogo = page.locator('header span:text("RandevuAI")').first()
    await expect(landingPageLogo).toBeVisible()
  })
})
