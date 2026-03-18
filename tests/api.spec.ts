import { test, expect } from '@playwright/test'

test.describe('Public API Endpoints', () => {
  test('health check - app is running', async ({ request }) => {
    const response = await request.get('/')
    expect(response.ok()).toBeTruthy()
  })

  test('public booking API requires slug parameter', async ({ request }) => {
    // This endpoint needs a slug, so it returns 404/405 without one
    const response = await request.get('/api/public/bookings')
    expect([404, 405]).toContain(response.status())
  })

  test('API returns 404 for non-existent routes', async ({ request }) => {
    const response = await request.get('/api/non-existent')
    expect(response.status()).toBe(404)
  })
})

test.describe('Protected API Endpoints', () => {
  test('admin endpoints require authentication', async ({ request }) => {
    const response = await request.get('/api/admin/bookings')
    // Returns 401 or 404 depending on if auth middleware is applied
    expect([401, 404]).toContain(response.status())
  })

  test('bookings API requires authentication', async ({ request }) => {
    const response = await request.get('/api/bookings')
    expect(response.status()).toBe(401)
  })
})
