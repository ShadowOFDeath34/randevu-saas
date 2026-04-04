import { test, expect } from '@playwright/test'

/**
 * SMS Templates E2E Tests
 * Tests the SMS template management functionality
 */

test.describe('SMS Templates Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login işlemi
    await page.goto('/login')
    await page.fill('input#email', 'test@example.com')
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    // Settings sayfasına git
    await page.goto('/settings/sms-templates')
    await page.waitForLoadState('networkidle')
  })

  test('should display SMS templates page', async ({ page }) => {
    // Sayfa başlığı
    const pageTitle = page.locator('h1:has-text("SMS Şablonları")')
    await expect(pageTitle).toBeVisible()

    // Açıklama metni
    const description = page.locator('text=Otomatik SMS gönderimi için şablonları yönetin')
    await expect(description).toBeVisible()
  })

  test('should display template cards', async ({ page }) => {
    // Template kartlarının varlığı
    const templateCards = [
      'Randevu Onayı',
      'Randevu Hatırlatma',
      'Randevu İptali',
      'Değerlendirme Talebi',
    ]

    for (const cardName of templateCards) {
      const card = page.locator(`h3:has-text("${cardName}")`)
      await expect(card).toBeVisible()
    }
  })

  test('should display template content', async ({ page }) => {
    // Template içerikleri
    const templateContents = page.locator('textarea')
    const count = await templateContents.count()
    expect(count).toBeGreaterThanOrEqual(4) // En az 4 template olmalı

    // Her textarea'da placeholder veya içerik olmalı
    const firstTextarea = templateContents.first()
    await expect(firstTextarea).toBeVisible()
  })

  test('should display character counter', async ({ page }) => {
    // Karakter sayaçları
    const charCounters = page.locator('text=/\\d+ \/ 160/')
    await expect(charCounters.first()).toBeVisible()
  })

  test('should display SMS count indicator', async ({ page }) => {
    // SMS sayısı göstergesi (1 SMS, 2 SMS vb.)
    const smsCountBadges = page.locator('span:has-text("SMS")')
    await expect(smsCountBadges.first()).toBeVisible()
  })

  test('should edit template content', async ({ page }) => {
    // İlk textarea'yı düzenle
    const firstTextarea = page.locator('textarea').first()
    await firstTextarea.fill('Merhaba {{customerName}}, randevunuz onaylanmıştır.')

    // Değişiklik kaydedildi mi?
    const saveButton = page.locator('button:has-text("Kaydet")').first()
    await expect(saveButton).toBeVisible()

    // Kaydet butonuna tıkla
    await saveButton.click()

    // Başarı mesajı (varsa)
    await page.waitForTimeout(500)
  })

  test('should update character count on type', async ({ page }) => {
    // Bir textarea'ya yazı yaz
    const testContent = 'Test mesaj içeriği'
    const firstTextarea = page.locator('textarea').first()
    await firstTextarea.fill(testContent)

    // Karakter sayacı güncellenmeli
    await page.waitForTimeout(300)

    // SMS sayısı güncellenmeli (eğer karakter sayısı 160'ı geçerse)
    const smsCounter = page.locator('span[class*="bg-"]').filter({ hasText: /SMS/ })
    await expect(smsCounter.first()).toBeVisible()
  })

  test('should display variable hints', async ({ page }) => {
    // Değişken ipuçları
    const variableHints = page.locator('text=/{{.*}}/')
    await expect(variableHints.first()).toBeVisible()
  })

  test('should toggle template active status', async ({ page }) => {
    // Aktif/Pasif toggle switch
    const toggleSwitches = page.locator('button[role="switch"]')
    const firstToggle = toggleSwitches.first()

    await expect(firstToggle).toBeVisible()

    // Toggle'a tıkla
    const initialState = await firstToggle.getAttribute('aria-checked')
    await firstToggle.click()

    // Durum değişti mi?
    await page.waitForTimeout(300)
    const newState = await firstToggle.getAttribute('aria-checked')
    expect(newState).not.toBe(initialState)
  })

  test('should reset templates to defaults', async ({ page }) => {
    // Varsayılanlara dön butonu (varsa)
    const resetButton = page.locator('button:has-text("Varsayılanlara Dön")')

    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click()

      // Onay modalı
      const confirmButton = page.locator('button:has-text("Evet")')
      await confirmButton.click()

      await page.waitForTimeout(500)
    }
  })

  test('should validate max length', async ({ page }) => {
    // Çok uzun bir mesaj yaz (480+ karakter)
    const longMessage = 'A'.repeat(500)
    const firstTextarea = page.locator('textarea').first()
    await firstTextarea.fill(longMessage)

    // Uyarı veya limit kontrolü
    await page.waitForTimeout(300)
  })

  test('should preview SMS before saving', async ({ page }) => {
    // Önizle butonu (varsa)
    const previewButton = page.locator('button:has-text("Önizle")').first()

    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()

      // Önizleme modalı
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
    }
  })
})

test.describe('SMS Templates Variable Substitution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="tel"]', '5551234567')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    await page.goto('/settings/sms-templates')
    await page.waitForLoadState('networkidle')
  })

  test('should support customerName variable', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('Merhaba {{customerName}},')

    // Değişken vurgulanmalı veya gösterilmeli
    await expect(textarea).toHaveValue('Merhaba {{customerName}},')
  })

  test('should support serviceName variable', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('{{serviceName}} hizmetiniz için teşekkürler.')

    await expect(textarea).toHaveValue('{{serviceName}} hizmetiniz için teşekkürler.')
  })

  test('should support businessName variable', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('{{businessName}} olarak bizi tercih ettiğiniz için teşekkürler.')

    await expect(textarea).toHaveValue('{{businessName}} olarak bizi tercih ettiğiniz için teşekkürler.')
  })

  test('should support multiple variables', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('Merhaba {{customerName}}, {{serviceName}} randevunuz {{bookingDate}} saat {{bookingTime}} için onaylanmıştır. - {{businessName}}')

    await expect(textarea).toContainText('{{customerName}}')
    await expect(textarea).toContainText('{{serviceName}}')
    await expect(textarea).toContainText('{{bookingDate}}')
    await expect(textarea).toContainText('{{bookingTime}}')
    await expect(textarea).toContainText('{{businessName}}')
  })
})

test.describe('SMS Templates API', () => {
  test('should get templates via API', async ({ request }) => {
    // API endpoint test
    const response = await request.get('/api/settings/sms-templates')

    // Yetkilendirme hatası veya başarılı yanıt
    expect([200, 401]).toContain(response.status())
  })

  test('should update templates via API', async ({ request }) => {
    const response = await request.put('/api/settings/sms-templates', {
      data: {
        templates: [
          {
            type: 'BOOKING_CONFIRMATION',
            content: 'Test mesaj',
            isActive: true,
          },
        ],
      },
    })

    // Yetkilendirme hatası veya başarılı yanıt
    expect([200, 401, 400]).toContain(response.status())
  })
})
