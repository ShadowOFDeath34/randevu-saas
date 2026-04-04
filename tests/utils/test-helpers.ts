import { Page, APIRequestContext, expect } from '@playwright/test'

/**
 * Test Helpers
 * Common utilities for E2E tests
 */

// Test credentials
export const TEST_CREDENTIALS = {
  valid: {
    email: 'test@example.com',
    password: 'password123',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
}

/**
 * Login with valid credentials
 */
export async function login(page: Page, email: string = TEST_CREDENTIALS.valid.email, password: string = TEST_CREDENTIALS.valid.password): Promise<void> {
  await page.goto('/login')
  await page.fill('input#email', email)
  await page.fill('input#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button/link
  const logoutButton = page.locator('button:has-text("Çıkış"), a:has-text("Çıkış")')
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click()
    await page.waitForURL('**/login', { timeout: 5000 })
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const dashboardLink = page.locator('a[href="/dashboard"]')
  return await dashboardLink.isVisible().catch(() => false)
}

/**
 * Navigate to a page and wait for load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

/**
 * Wait for toast/notification to appear
 */
export async function waitForToast(page: Page, text?: string, timeout: number = 5000): Promise<void> {
  const toastSelector = text
    ? `[role="status"]:has-text("${text}"), .toast:has-text("${text}"), [data-toast]:has-text("${text}")`
    : '[role="status"], .toast, [data-toast]'

  await page.locator(toastSelector).first().waitFor({ timeout })
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  options?: { clear?: boolean; validate?: boolean }
): Promise<void> {
  const field = page.locator(selector)
  await field.waitFor({ state: 'visible' })

  if (options?.clear) {
    await field.clear()
  }

  await field.fill(value)

  if (options?.validate) {
    const actualValue = await field.inputValue()
    expect(actualValue).toBe(value)
  }
}

/**
 * Submit form and wait for response
 */
export async function submitForm(page: Page, buttonSelector: string = 'button[type="submit"]'): Promise<void> {
  const submitButton = page.locator(buttonSelector)
  await submitButton.click()
  await page.waitForLoadState('networkidle')
}

/**
 * Get API token for authenticated requests
 */
export async function getAuthToken(request: APIRequestContext, credentials = TEST_CREDENTIALS.valid): Promise<string | null> {
  try {
    const response = await request.post('/api/auth/login', {
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    })

    if (!response.ok()) {
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch {
    return null
  }
}

/**
 * Create authenticated API request context
 */
export async function createAuthenticatedRequest(request: APIRequestContext, credentials = TEST_CREDENTIALS.valid): Promise<{ Authorization: string }> {
  const token = await getAuthToken(request, credentials)
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).count() > 0
}

/**
 * Wait for element to have specific text
 */
export async function waitForText(page: Page, selector: string, text: string, timeout: number = 5000): Promise<void> {
  await page.waitForFunction(
    ({ sel, txt }: { sel: string; txt: string }) => {
      const element = document.querySelector(sel)
      return element?.textContent?.includes(txt)
    },
    { sel: selector, txt: text },
    { timeout }
  )
}

/**
 * Scroll to element
 */
export async function scrollTo(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded()
}

/**
 * Mobile viewport sizes
 */
export const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
}

/**
 * Set viewport size
 */
export async function setViewport(page: Page, size: keyof typeof VIEWPORT_SIZES): Promise<void> {
  await page.setViewportSize(VIEWPORT_SIZES[size])
}

/**
 * Take screenshot with naming
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `./test-results/screenshots/${name}.png`, fullPage: true })
}

/**
 * Wait for network idle with timeout
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 10000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout })
  } catch {
    // Network idle timeout - proceed anyway
  }
}

/**
 * Clear local storage
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: object,
  status: number = 200
): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Generate random phone number
 */
export function generateRandomPhone(): string {
  return '555' + Math.floor(1000000 + Math.random() * 8999999).toString()
}

/**
 * Test data builders
 */
export const TestDataBuilder = {
  customer(overrides?: { name?: string; phone?: string; email?: string }) {
    return {
      fullName: overrides?.name || `Test Müşteri ${generateRandomString(5)}`,
      phone: overrides?.phone || generateRandomPhone(),
      email: overrides?.email || `test${generateRandomString(5)}@example.com`,
    }
  },

  booking(overrides?: {
    customerName?: string
    customerPhone?: string
    serviceId?: string
    staffId?: string
    date?: string
    time?: string
  }) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      customerName: overrides?.customerName || `Test Müşteri`,
      customerPhone: overrides?.customerPhone || generateRandomPhone(),
      serviceId: overrides?.serviceId || 'test-service-id',
      staffId: overrides?.staffId || 'test-staff-id',
      bookingDate: overrides?.date || tomorrow.toISOString().split('T')[0],
      startTime: overrides?.time || '10:00',
      notes: 'Test booking from E2E',
    }
  },

  smsTemplate(overrides?: { content?: string; isActive?: boolean }) {
    return {
      content: overrides?.content || 'Merhaba {{customerName}}, randevunuz onaylanmıştır.',
      isActive: overrides?.isActive ?? true,
    }
  },
}

/**
 * API helpers
 */
export const ApiHelpers = {
  async createBooking(request: APIRequestContext, tenantId: string, data: ReturnType<typeof TestDataBuilder.booking>, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return request.post('/api/portal/bookings', {
      headers,
      data: {
        tenantId,
        ...data,
      },
    })
  },

  async updateBookingStatus(request: APIRequestContext, bookingId: string, status: string, token: string) {
    return request.patch(`/api/bookings/${bookingId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: { status },
    })
  },

  async getReviews(request: APIRequestContext, token: string) {
    return request.get('/api/reviews', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  async updateReview(request: APIRequestContext, reviewId: string, data: { isPublished: boolean }, token: string) {
    return request.put('/api/reviews', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: {
        id: reviewId,
        ...data,
      },
    })
  },
}
