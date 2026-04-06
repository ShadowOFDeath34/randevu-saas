/**
 * Test Utilities
 * Helper functions for unit and integration tests
 */

import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Prisma mock
export const prismaMock = mockDeep<PrismaClient>()

// Before each test, reset the mock
beforeEach(() => {
  mockReset(prismaMock)
})

/**
 * Create mock NextRequest
 */
export function createMockRequest(options?: {
  method?: string
  url?: string
  body?: unknown
  headers?: Record<string, string>
}): Request {
  const url = options?.url || 'http://localhost:3000/api/test'
  const method = options?.method || 'GET'
  const body = options?.body ? JSON.stringify(options.body) : null

  return new Request(url, {
    method,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

/**
 * Create mock session
 */
export function createMockSession(options?: {
  user?: {
    id?: string
    email?: string
    name?: string
    role?: string
  }
  expires?: string
}) {
  return {
    user: {
      id: options?.user?.id || 'user-test-id',
      email: options?.user?.email || 'test@example.com',
      name: options?.user?.name || 'Test User',
      role: options?.user?.role || 'user',
    },
    expires: options?.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Create mock tenant
 */
export function createMockTenant(options?: {
  id?: string
  name?: string
  slug?: string
  isActive?: boolean
}) {
  return {
    id: options?.id || 'tenant-test-id',
    name: options?.name || 'Test Tenant',
    slug: options?.slug || 'test-tenant',
    isActive: options?.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create mock booking
 */
export function createMockBooking(options?: {
  id?: string
  tenantId?: string
  customerName?: string
  customerPhone?: string
  status?: string
  startTime?: Date
  endTime?: Date
}) {
  const startTime = options?.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000)
  const endTime = options?.endTime || new Date(startTime.getTime() + 60 * 60 * 1000)

  return {
    id: options?.id || 'booking-test-id',
    tenantId: options?.tenantId || 'tenant-test-id',
    customerName: options?.customerName || 'Test Customer',
    customerPhone: options?.customerPhone || '+905551234567',
    status: options?.status || 'confirmed',
    startTime,
    endTime,
    notes: null,
    serviceId: 'service-test-id',
    staffId: 'staff-test-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Assert response status and return json
 */
export async function assertResponse(
  response: Response,
  expectedStatus: number
): Promise<unknown> {
  expect(response.status).toBe(expectedStatus)
  return response.json()
}

/**
 * Wait for promises to resolve
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Mock fetch response
 */
export function mockFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

/**
 * Mock fetch error
 */
export function mockFetchError(message: string, status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(message),
  } as Response)
}

/**
 * Generate random test data
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (condition()) return
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error('Timeout waiting for condition')
}
