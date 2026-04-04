import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getHours, PUT as putHours } from '@/app/api/settings/hours/route'
import { GET as getClosedDates, POST as postClosedDate } from '@/app/api/settings/closed-dates/route'
import { GET as getNotificationSettings, PUT as putNotificationSettings } from '@/app/api/settings/notifications/route'
import { GET as getProfile, PUT as putProfile } from '@/app/api/settings/profile/route'
import { GET as getTheme, PUT as putTheme } from '@/app/api/settings/theme/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    businessHour: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    notificationTemplate: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    businessProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tenant: {
      update: vi.fn(),
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

describe('settings routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('settings/hours/route.ts', () => {
    it('GET returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await getHours()

      expect(response.status).toBe(401)
    })

    it('GET returns business hours', async () => {
      const hours = [{ dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }]

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessHour.findMany.mockResolvedValueOnce(hours)

      const response = await getHours()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(hours)
    })

    it('GET returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessHour.findMany.mockRejectedValueOnce(new Error('hours failed'))

      const response = await getHours()

      expect(response.status).toBe(500)
    })

    it('PUT returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await putHours(
        new Request('http://localhost/api/settings/hours', {
          method: 'PUT',
          body: JSON.stringify([]),
        })
      )

      expect(response.status).toBe(401)
    })

    it('PUT upserts all hours and returns refreshed list', async () => {
      const payload = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false },
        { dayOfWeek: 2, openTime: '10:00', closeTime: '19:00', isClosed: false },
      ]

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessHour.upsert.mockResolvedValue({ id: 'hour-1' })
      mocks.db.businessHour.findMany.mockResolvedValueOnce(payload)

      const response = await putHours(
        new Request('http://localhost/api/settings/hours', {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(payload)
      expect(mocks.db.businessHour.upsert).toHaveBeenCalledTimes(2)
      expect(mocks.db.businessHour.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { dayOfWeek: 'asc' },
      })
    })

    it('PUT returns 500 when upsert fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessHour.upsert.mockRejectedValueOnce(new Error('upsert failed'))

      const response = await putHours(
        new Request('http://localhost/api/settings/hours', {
          method: 'PUT',
          body: JSON.stringify([{ dayOfWeek: 1, isClosed: true }]),
        })
      )

      expect(response.status).toBe(500)
    })
  })

  describe('settings/closed-dates/route.ts', () => {
    it('GET returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await getClosedDates()

      expect(response.status).toBe(401)
    })

    it('GET maps closed bookings to closed dates payload', async () => {
      const rows = [
        { id: 'closed-1', bookingDate: '2026-04-10', notes: 'Holiday' },
      ]

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.booking.findMany.mockResolvedValueOnce(rows)

      const response = await getClosedDates()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([
        { id: 'closed-1', date: '2026-04-10', reason: 'Holiday' },
      ])
    })

    it('GET returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.booking.findMany.mockRejectedValueOnce(new Error('closed failed'))

      const response = await getClosedDates()

      expect(response.status).toBe(500)
    })

    it('POST returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await postClosedDate(
        new Request('http://localhost/api/settings/closed-dates', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('POST creates a closed date entry', async () => {
      const created = { id: 'closed-1' }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.booking.create.mockResolvedValueOnce(created)

      const response = await postClosedDate(
        new Request('http://localhost/api/settings/closed-dates', {
          method: 'POST',
          body: JSON.stringify({ date: '2026-04-10', reason: 'Holiday' }),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(created)
      expect(mocks.db.booking.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          customerId: 'system',
          serviceId: 'system',
          staffId: 'system',
          bookingDate: '2026-04-10',
          startTime: '00:00',
          endTime: '23:59',
          status: 'closed',
          notes: 'Holiday',
        },
      })
    })

    it('POST returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.booking.create.mockRejectedValueOnce(new Error('create failed'))

      const response = await postClosedDate(
        new Request('http://localhost/api/settings/closed-dates', {
          method: 'POST',
          body: JSON.stringify({ date: '2026-04-10' }),
        })
      )

      expect(response.status).toBe(500)
    })
  })

  describe('settings/notifications/route.ts', () => {
    it('GET returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await getNotificationSettings()

      expect(response.status).toBe(401)
    })

    it('GET returns defaults when no settings template exists', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.findFirst.mockResolvedValueOnce(null)

      const response = await getNotificationSettings()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        emailEnabled: true,
        smsEnabled: false,
        whatsappEnabled: false,
        reminderHours: [24, 2],
        bookingConfirmation: true,
        bookingReminder: true,
        bookingCancellation: true,
        reviewRequest: true,
      })
    })

    it('GET parses stored notification settings', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.findFirst.mockResolvedValueOnce({
        body: JSON.stringify({ smsEnabled: true }),
      })

      const response = await getNotificationSettings()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ smsEnabled: true })
    })

    it('GET returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.findFirst.mockRejectedValueOnce(new Error('settings failed'))

      const response = await getNotificationSettings()

      expect(response.status).toBe(500)
    })

    it('PUT returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await putNotificationSettings(
        new Request('http://localhost/api/settings/notifications', {
          method: 'PUT',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('PUT upserts notification settings', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.upsert.mockResolvedValueOnce({ id: 'template-1' })

      const payload = { smsEnabled: true, reminderHours: [12] }
      const response = await putNotificationSettings(
        new Request('http://localhost/api/settings/notifications', {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(mocks.db.notificationTemplate.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_type_channel: {
            tenantId: 'tenant-1',
            type: 'settings',
            channel: 'system',
          },
        },
        update: {
          body: JSON.stringify(payload),
          isActive: true,
        },
        create: {
          tenantId: 'tenant-1',
          type: 'settings',
          channel: 'system',
          title: 'Notification Settings',
          body: JSON.stringify(payload),
          isActive: true,
        },
      })
    })

    it('PUT returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.upsert.mockRejectedValueOnce(new Error('upsert failed'))

      const response = await putNotificationSettings(
        new Request('http://localhost/api/settings/notifications', {
          method: 'PUT',
          body: JSON.stringify({ smsEnabled: true }),
        })
      )

      expect(response.status).toBe(500)
    })
  })

  describe('settings/profile/route.ts', () => {
    it('GET returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await getProfile()

      expect(response.status).toBe(401)
    })

    it('GET returns business profile', async () => {
      const profile = { businessName: 'Salon', city: 'Istanbul' }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.findUnique.mockResolvedValueOnce(profile)

      const response = await getProfile()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(profile)
    })

    it('GET returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.findUnique.mockRejectedValueOnce(new Error('profile failed'))

      const response = await getProfile()

      expect(response.status).toBe(500)
    })

    it('PUT returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await putProfile(
        new Request('http://localhost/api/settings/profile', {
          method: 'PUT',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('PUT updates profile and tenant name', async () => {
      const updatedProfile = { id: 'profile-1', businessName: 'New Name' }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.update.mockResolvedValueOnce(updatedProfile)
      mocks.db.tenant.update.mockResolvedValueOnce({ id: 'tenant-1' })

      const response = await putProfile(
        new Request('http://localhost/api/settings/profile', {
          method: 'PUT',
          body: JSON.stringify({
            businessName: 'New Name',
            phone: '5551234567',
            allowOnlineBooking: true,
          }),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(updatedProfile)
      expect(mocks.db.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { name: 'New Name' },
      })
    })

    it('PUT returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.update.mockRejectedValueOnce(new Error('update failed'))

      const response = await putProfile(
        new Request('http://localhost/api/settings/profile', {
          method: 'PUT',
          body: JSON.stringify({ businessName: 'New Name' }),
        })
      )

      expect(response.status).toBe(500)
    })
  })

  describe('settings/theme/route.ts', () => {
    it('GET returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await getTheme()

      expect(response.status).toBe(401)
    })

    it('GET returns the default theme payload with stored logo', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.findUnique.mockResolvedValueOnce({ logoUrl: 'https://cdn/logo.png' })

      const response = await getTheme()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        primaryColor: '#4f46e5',
        logoUrl: 'https://cdn/logo.png',
        coverImage: '',
      })
    })

    it('GET returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.findUnique.mockRejectedValueOnce(new Error('theme failed'))

      const response = await getTheme()

      expect(response.status).toBe(500)
    })

    it('PUT returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await putTheme(
        new Request('http://localhost/api/settings/theme', {
          method: 'PUT',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('PUT returns 400 for oversized base64 logo payload', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await putTheme(
        new Request('http://localhost/api/settings/theme', {
          method: 'PUT',
          body: JSON.stringify({
            logoUrl: 'x'.repeat(3 * 1024 * 1024 + 1),
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(typeof data.error).toBe('string')
      expect(mocks.db.businessProfile.update).not.toHaveBeenCalled()
    })

    it('PUT stores the logo url', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.update.mockResolvedValueOnce({ id: 'profile-1' })

      const response = await putTheme(
        new Request('http://localhost/api/settings/theme', {
          method: 'PUT',
          body: JSON.stringify({ logoUrl: 'https://cdn/logo.png' }),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(mocks.db.businessProfile.update).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: {
          logoUrl: 'https://cdn/logo.png',
        },
      })
    })

    it('PUT returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.businessProfile.update.mockRejectedValueOnce(new Error('save failed'))

      const response = await putTheme(
        new Request('http://localhost/api/settings/theme', {
          method: 'PUT',
          body: JSON.stringify({ logoUrl: 'https://cdn/logo.png' }),
        })
      )

      expect(response.status).toBe(500)
    })
  })
})
