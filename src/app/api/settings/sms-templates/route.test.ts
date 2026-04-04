import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST, PUT, templateVariables } from '@/app/api/settings/sms-templates/route'
import { NotificationChannel } from '@prisma/client'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    notificationTemplate: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
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

describe('settings/sms-templates/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('returns existing templates', async () => {
      const templates = [{ id: 'template-1', type: 'booking_confirmation' }]

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.findMany.mockResolvedValueOnce(templates)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        templates,
        variables: templateVariables,
      })
      expect(mocks.db.notificationTemplate.create).not.toHaveBeenCalled()
    })

    it('creates default templates when none exist', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.findMany.mockResolvedValueOnce([])
      mocks.db.notificationTemplate.create.mockImplementation(async ({ data }) => ({
        id: `${data.type}-id`,
        ...data,
      }))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toHaveLength(7)
      expect(mocks.db.notificationTemplate.create).toHaveBeenCalledTimes(7)
      expect(mocks.db.notificationTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          channel: NotificationChannel.sms,
        }),
      })
    })

    it('returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.findMany.mockRejectedValueOnce(new Error('lookup failed'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('PUT', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await PUT(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'PUT',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 when id is missing', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await PUT(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'PUT',
          body: JSON.stringify({ body: 'Hello' }),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Template ID required' })
    })

    it('updates a template', async () => {
      const template = { id: 'template-1', body: 'Updated body', isActive: false }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.update.mockResolvedValueOnce(template)

      const response = await PUT(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'PUT',
          body: JSON.stringify({
            id: 'template-1',
            body: 'Updated body',
            isActive: false,
          }),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ template })
      expect(mocks.db.notificationTemplate.update).toHaveBeenCalledWith({
        where: {
          id: 'template-1',
          tenantId: 'tenant-1',
        },
        data: {
          body: 'Updated body',
          isActive: false,
        },
      })
    })

    it('returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.update.mockRejectedValueOnce(new Error('update failed'))

      const response = await PUT(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'PUT',
          body: JSON.stringify({
            id: 'template-1',
            body: 'Updated body',
            isActive: true,
          }),
        })
      )

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'POST',
          body: JSON.stringify({ action: 'reset' }),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 for invalid action', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'POST',
          body: JSON.stringify({ action: 'noop' }),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid action' })
    })

    it('resets templates to defaults', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.deleteMany.mockResolvedValueOnce({ count: 4 })
      mocks.db.notificationTemplate.create.mockImplementation(async ({ data }) => ({
        id: `${data.type}-id`,
        ...data,
      }))

      const response = await POST(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'POST',
          body: JSON.stringify({ action: 'reset' }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toHaveLength(7)
      expect(mocks.db.notificationTemplate.deleteMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          channel: NotificationChannel.sms,
        },
      })
      expect(mocks.db.notificationTemplate.create).toHaveBeenCalledTimes(7)
    })

    it('returns 500 when reset fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationTemplate.deleteMany.mockRejectedValueOnce(new Error('reset failed'))

      const response = await POST(
        new Request('http://localhost/api/settings/sms-templates', {
          method: 'POST',
          body: JSON.stringify({ action: 'reset' }),
        })
      )

      expect(response.status).toBe(500)
    })
  })
})
