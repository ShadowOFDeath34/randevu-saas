import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/analytics/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    $queryRawUnsafe: vi.fn(),
    customer: {
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/db', () => ({
  db: mocks.db,
}))

const session = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
  },
}

function mockSuccessfulAnalyticsQueries() {
  mocks.db.$queryRawUnsafe
    .mockResolvedValueOnce([
      { status: 'completed', count: 3n, revenue: 900 },
      { status: 'cancelled', count: 1n, revenue: 0 },
      { status: 'no_show', count: 1n, revenue: 0 },
    ])
    .mockResolvedValueOnce([{ repeat_count: 2n }])
    .mockResolvedValueOnce([{ name: 'Haircut', count: 4n, revenue: 1200 }])
    .mockResolvedValueOnce([{ name: 'Jane Doe', count: 3n, revenue: 900 }])
    .mockResolvedValueOnce([
      { date: '2026-04-03', count: 2n, revenue: 600 },
      { date: '2026-04-04', count: 1n, revenue: 300 },
    ])
  mocks.db.customer.count.mockResolvedValueOnce(5)
}

describe('analytics/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-04T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 401 when unauthenticated', async () => {
    mocks.auth.mockResolvedValueOnce(null)

    const response = await GET(new Request('http://localhost/api/analytics'))

    expect(response.status).toBe(401)
  })

  it('returns processed analytics data for week period', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mockSuccessfulAnalyticsQueries()

    const response = await GET(
      new Request('http://localhost/api/analytics?period=week')
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalBookings).toBe(5)
    expect(data.completedBookings).toBe(3)
    expect(data.cancelledBookings).toBe(1)
    expect(data.noShowBookings).toBe(1)
    expect(data.totalRevenue).toBe(900)
    expect(data.totalCustomers).toBe(5)
    expect(data.repeatCustomers).toBe(2)
    expect(data.popularServices).toEqual([{ name: 'Haircut', count: 4 }])
    expect(data.topStaff).toEqual([{ name: 'Jane Doe', count: 3 }])
    expect(data.dailyBookings).toEqual([
      { date: '2026-04-03', count: 2 },
      { date: '2026-04-04', count: 1 },
    ])
    expect(data.weeklyStats).toEqual(
      expect.arrayContaining([
        { day: 'Cum', bookings: 2, revenue: 600 },
        { day: 'Cmt', bookings: 1, revenue: 300 },
      ])
    )
    expect(mocks.db.$queryRawUnsafe).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('GROUP BY b.status'),
      'tenant-1',
      '2026-03-28'
    )
  })

  it('supports year period', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mockSuccessfulAnalyticsQueries()

    const response = await GET(
      new Request('http://localhost/api/analytics?period=year')
    )

    expect(response.status).toBe(200)
    expect(mocks.db.$queryRawUnsafe).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      'tenant-1',
      '2025-04-04'
    )
  })

  it('falls back to month period by default', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mockSuccessfulAnalyticsQueries()

    const response = await GET(new Request('http://localhost/api/analytics'))

    expect(response.status).toBe(200)
    expect(mocks.db.$queryRawUnsafe).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      'tenant-1',
      '2026-03-04'
    )
  })

  it('returns 500 when analytics aggregation fails', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe.mockRejectedValueOnce(new Error('raw failed'))

    const response = await GET(new Request('http://localhost/api/analytics'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Error fetching analytics' })
  })

  it('handles empty repeat customers result', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe
      .mockResolvedValueOnce([
        { status: 'completed', count: 3n, revenue: 900 },
      ])
      .mockResolvedValueOnce([]) // Empty repeat customers
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mocks.db.customer.count.mockResolvedValueOnce(5)

    const response = await GET(new Request('http://localhost/api/analytics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.repeatCustomers).toBe(0)
  })

  it('handles missing completed, cancelled, and no_show in stats', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe
      .mockResolvedValueOnce([
        { status: 'pending', count: 2n, revenue: 0 },
        { status: 'confirmed', count: 3n, revenue: 0 },
      ])
      .mockResolvedValueOnce([{ repeat_count: 0n }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mocks.db.customer.count.mockResolvedValueOnce(5)

    const response = await GET(new Request('http://localhost/api/analytics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.completedBookings).toBe(0)
    expect(data.cancelledBookings).toBe(0)
    expect(data.noShowBookings).toBe(0)
    expect(data.totalRevenue).toBe(0)
  })

  it('processes daily bookings into all days of week', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe
      .mockResolvedValueOnce([
        { status: 'completed', count: 7n, revenue: 2100 },
      ])
      .mockResolvedValueOnce([{ repeat_count: 3n }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { date: '2026-03-29', count: 1n, revenue: 300 }, // Pazar (0)
        { date: '2026-03-30', count: 1n, revenue: 300 }, // Pazartesi (1)
        { date: '2026-03-31', count: 1n, revenue: 300 }, // Salı (2)
        { date: '2026-04-01', count: 1n, revenue: 300 }, // Çarşamba (3)
        { date: '2026-04-02', count: 1n, revenue: 300 }, // Perşembe (4)
        { date: '2026-04-03', count: 1n, revenue: 300 }, // Cuma (5)
        { date: '2026-04-04', count: 1n, revenue: 300 }, // Cumartesi (6)
      ])
    mocks.db.customer.count.mockResolvedValueOnce(10)

    const response = await GET(new Request('http://localhost/api/analytics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.weeklyStats).toHaveLength(7)
    // Verify each day has at least 1 booking
    expect(data.weeklyStats.every((s: any) => s.bookings >= 1)).toBe(true)
  })

  it('handles empty daily bookings gracefully', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe
      .mockResolvedValueOnce([
        { status: 'completed', count: 5n, revenue: 1500 },
      ])
      .mockResolvedValueOnce([{ repeat_count: 2n }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]) // Empty daily bookings
    mocks.db.customer.count.mockResolvedValueOnce(5)

    const response = await GET(new Request('http://localhost/api/analytics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.weeklyStats).toHaveLength(7)
    expect(data.weeklyStats.every((s: any) => s.bookings === 0)).toBe(true)
    expect(data.weeklyStats.every((s: any) => s.revenue === 0)).toBe(true)
  })

  it('handles database error in customer count', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe.mockRejectedValueOnce(new Error('DB connection error'))

    const response = await GET(new Request('http://localhost/api/analytics'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Error fetching analytics' })
  })

  it('aggregates revenue from multiple completed bookings', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe
      .mockResolvedValueOnce([
        { status: 'completed', count: 2n, revenue: 500 },
        { status: 'completed', count: 3n, revenue: 1200 }, // Multiple completed entries
      ])
      .mockResolvedValueOnce([{ repeat_count: 5n }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mocks.db.customer.count.mockResolvedValueOnce(10)

    const response = await GET(new Request('http://localhost/api/analytics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalRevenue).toBe(1700)
  })

  it('processes popular services with zero counts', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe
      .mockResolvedValueOnce([
        { status: 'completed', count: 5n, revenue: 1500 },
      ])
      .mockResolvedValueOnce([{ repeat_count: 2n }])
      .mockResolvedValueOnce([
        { name: 'Inactive Service', count: 0n, revenue: 0 },
        { name: 'Active Service', count: 5n, revenue: 1500 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mocks.db.customer.count.mockResolvedValueOnce(5)

    const response = await GET(new Request('http://localhost/api/analytics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.popularServices).toHaveLength(2)
    expect(data.popularServices[0].count).toBe(0)
    expect(data.popularServices[1].count).toBe(5)
  })

  it('processes top staff with zero counts', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.$queryRawUnsafe
      .mockResolvedValueOnce([
        { status: 'completed', count: 5n, revenue: 1500 },
      ])
      .mockResolvedValueOnce([{ repeat_count: 2n }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { name: 'Inactive Staff', count: 0n, revenue: 0 },
        { name: 'Active Staff', count: 10n, revenue: 3000 },
      ])
      .mockResolvedValueOnce([])
    mocks.db.customer.count.mockResolvedValueOnce(5)

    const response = await GET(new Request('http://localhost/api/analytics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.topStaff).toHaveLength(2)
    expect(data.topStaff[0].count).toBe(0)
    expect(data.topStaff[1].count).toBe(10)
  })
})
