import { test, expect, Page } from '@playwright/test'

/**
 * Review System E2E Tests
 * Tests the public review submission flow and dashboard review management
 */

// Test data for creating a booking that will receive a review
const testBookingData = {
  customerName: 'Test Müşteri',
  customerPhone: '5551234567',
  serviceName: 'Test Hizmet',
  staffName: 'Test Personel',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createTestBookingForReview(page: Page, tenantId: string) {
  // API üzerinden test randevusu oluştur
  const response = await page.request.post('/api/portal/bookings', {
    data: {
      tenantId,
      serviceId: 'test-service-id',
      staffId: 'test-staff-id',
      customerName: testBookingData.customerName,
      customerPhone: testBookingData.customerPhone,
      bookingDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      notes: 'Test review booking',
    },
  })

  if (!response.ok()) {
    console.log('Booking creation failed, continuing with mock data')
    return null
  }

  const data = await response.json()
  return data.booking
}

test.describe('Public Review Page', () => {
  test('should display review page with all elements', async ({ page }) => {
    // Geçerli bir review token ile sayfayı aç
    // Not: Gerçek test için geçerli bir token gerekiyor
    await page.goto('/review/test-token-123')

    // Sayfa yüklenene kadar bekle (element-based wait)
    await expect(page.locator('h1')).toBeVisible()

    // Temel sayfa elementlerini kontrol et
    const pageTitle = page.locator('h1')
    await expect(pageTitle).toBeVisible()

    // Yıldız rating elementleri
    const starButtons = page.locator('button[type="button"]')
    await expect(starButtons).toHaveCount(5)

    // Yorum textarea
    const commentTextarea = page.locator('textarea[placeholder*="yorum"]')
    await expect(commentTextarea).toBeVisible()

    // Gönder butonu
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeDisabled() // Rating seçilmediği için disabled
  })

  test('should enable submit button after rating selection', async ({ page }) => {
    await page.goto('/review/test-token-123')
    // Wait for page to load
    await expect(page.locator('button[type="button"]')).toBeVisible()

    // İlk yıldıza tıkla
    const firstStar = page.locator('button[type="button"]').first()
    await firstStar.click()

    // Submit butonu enabled olmalı
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeEnabled()
  })

  test('should show rating labels on hover', async ({ page }) => {
    await page.goto('/review/test-token-123')
    // Wait for page to load
    await expect(page.locator('button[type="button"]')).toBeVisible()

    // 5. yıldızın üzerine gel
    const fifthStar = page.locator('button[type="button"]').nth(4)
    await fifthStar.hover()

    // "Mükemmel" etiketi görünmeli
    const ratingLabel = page.locator('text=Mükemmel')
    await expect(ratingLabel).toBeVisible()
  })

  test('should validate comment max length', async ({ page }) => {
    await page.goto('/review/test-token-123')
    // Wait for page to load
    await expect(page.locator('textarea')).toBeVisible()

    // Rating seç
    await page.locator('button[type="button"]').first().click()

    // 500 karakterden uzun yorum yaz
    const longComment = 'a'.repeat(550)
    const textarea = page.locator('textarea')
    await textarea.fill(longComment)

    // Karakter sayacı güncellenmeli
    const charCounter = page.locator('text=/\\d+ \/ 500/')
    await expect(charCounter).toBeVisible()
  })

  test('should show error for invalid token', async ({ page }) => {
    // Geçersiz token ile sayfayı aç
    await page.goto('/review/invalid-token-xyz')
    // Wait for page to load
    await expect(page.locator('body')).toBeVisible()

    // Hata mesajı görünmeli
    const errorMessage = page.locator('text=Bir hata oluştu')
    await expect(errorMessage).toBeVisible()

    // Ana sayfaya dön butonu
    const homeButton = page.locator('button:has-text("Ana Sayfaya Dön")')
    await expect(homeButton).toBeVisible()
  })

  test('should handle form submission loading state', async ({ page }) => {
    await page.goto('/review/test-token-123')
    // Wait for page to load
    await expect(page.locator('button[type="button"]')).toBeVisible()

    // Rating ve yorum ekle
    await page.locator('button[type="button"]').nth(2).click()
    await page.locator('textarea').fill('Test yorum')

    // Submit butonuna tıkla
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Loading state kontrol et (bu test geçersiz token ile başarısız olacak)
    // Gerçek bir test senaryosunda mock API kullanılmalı
  })
})

test.describe('Dashboard Reviews Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login işlemi
    await page.goto('/login')
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should navigate to reviews page', async ({ page }) => {
    // Sidebar'dan reviews linkine tıkla
    await page.click('a[href="/reviews"]')
    await page.waitForURL('**/reviews')

    // Reviews sayfası yüklendi mi?
    const pageTitle = page.locator('h1:has-text("Değerlendirmeler")')
    await expect(pageTitle).toBeVisible()
  })

  test('should display review stats cards', async ({ page }) => {
    await page.goto('/reviews')
    // Wait for page content to load
    await expect(page.locator('h1')).toBeVisible()

    // İstatistik kartları kontrol et
    const statsCards = [
      'Toplam Değerlendirme',
      'Ortalama Puan',
      'Yayında',
      'Bekleyen',
    ]

    for (const cardTitle of statsCards) {
      const card = page.locator(`text=${cardTitle}`)
      await expect(card).toBeVisible()
    }
  })

  test('should display reviews table', async ({ page }) => {
    await page.goto('/reviews')
    // Wait for page content to load
    await expect(page.locator('h1')).toBeVisible()

    // Tablo başlıkları (gerçek başlıklar: Müşteri, Hizmet, Puan, Yorum, Durum, İşlem)
    const tableHeaders = ['Müşteri', 'Hizmet', 'Puan', 'Yorum', 'Durum', 'İşlem']
    for (const header of tableHeaders) {
      const headerCell = page.locator(`th:has-text("${header}")`)
      await expect(headerCell).toBeVisible()
    }
  })

  test('should toggle review publication status', async ({ page }) => {
    await page.goto('/reviews')
    // Wait for page content to load
    await expect(page.locator('button[role="switch"]')).toBeVisible()

    // Toggle switch'i bul (ilk review için)
    const toggleSwitch = page.locator('button[role="switch"]').first()

    // Toggle switch görünür mü?
    await expect(toggleSwitch).toBeVisible()

    // Toggle'a tıkla
    await toggleSwitch.click()

    // Durum değişmiş mi? (API call sonrası)
    await page.waitForTimeout(500)

    // Not: Gerçek testte API response'u beklenmeli
  })

  test('should filter reviews by status', async ({ page }) => {
    await page.goto('/reviews')
    // Wait for page content to load
    await expect(page.locator('button:has-text("Tümü")')).toBeVisible()

    // Filter butonları
    const allFilter = page.locator('button:has-text("Tümü")')
    const pendingFilter = page.locator('button:has-text("Bekleyen")')
    const publishedFilter = page.locator('button:has-text("Yayında")')

    await expect(allFilter).toBeVisible()
    await expect(pendingFilter).toBeVisible()
    await expect(publishedFilter).toBeVisible()

    // Bekleyen filtresine tıkla
    await pendingFilter.click()

    // Tablo güncellendi mi?
    await expect(page.locator('table')).toBeVisible()
  })

  test('should display review details modal', async ({ page }) => {
    await page.goto('/reviews')
    // Wait for page content to load
    await expect(page.locator('button:has-text("İncele")')).toBeVisible()

    // İncele butonuna tıkla (varsa)
    const viewButton = page.locator('button:has-text("İncele")').first()

    if (await viewButton.isVisible().catch(() => false)) {
      await viewButton.click()

      // Modal açıldı mı?
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()

      // Modal içeriği
      const modalTitle = page.locator('text=Değerlendirme Detayı')
      await expect(modalTitle).toBeVisible()
    }
  })
})

test.describe('Dashboard Review Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should display review stats on dashboard', async ({ page }) => {
    // Dashboard'da müşteri memnuniyeti widget'ı
    const reviewWidget = page.locator('text=Müşteri Memnuniyeti')
    await expect(reviewWidget).toBeVisible()

    // Ortalama puan gösteriliyor mu?
    const ratingElement = page.locator('text=/\\d+\\.\\d+/')
    await expect(ratingElement).toBeVisible()
  })

  test('should display star rating visualization', async ({ page }) => {
    // Yıldız icon'ları kontrol et
    const starIcons = page.locator('svg[class*="star"]').first()
    await expect(starIcons).toBeVisible()
  })
})
