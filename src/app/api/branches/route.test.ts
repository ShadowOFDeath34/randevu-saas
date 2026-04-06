import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getBranches: vi.fn(),
  createBranch: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/branch/service', () => ({
  getBranches: mocks.getBranches,
  createBranch: mocks.createBranch,
}))

const ownerSession = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
    role: 'owner',
  },
}

const adminSession = {
  user: {
    id: 'user-2',
    tenantId: 'tenant-1',
    role: 'admin',
  },
}

const staffSession = {
  user: {
    id: 'user-3',
    tenantId: 'tenant-1',
    role: 'staff',
  },
}

describe('branches/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('returns list of branches', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)
      mocks.getBranches.mockResolvedValueOnce([
        {
          id: 'branch-1',
          name: 'Main Branch',
          type: 'main',
          code: 'MAIN',
          phone: '+90 555 111 2233',
          email: 'main@example.com',
          address: '123 Main St',
          city: 'Istanbul',
          district: 'Kadikoy',
          isActive: true,
        },
        {
          id: 'branch-2',
          name: 'Satellite Branch',
          type: 'satellite',
          code: 'SAT01',
          phone: null,
          email: null,
          address: null,
          city: null,
          district: null,
          isActive: true,
        },
      ])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Main Branch')
      expect(data[1].type).toBe('satellite')
      expect(mocks.getBranches).toHaveBeenCalledWith('tenant-1', true)
    })

    it('returns empty array when no branches exist', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)
      mocks.getBranches.mockResolvedValueOnce([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('returns 500 when service fails', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)
      mocks.getBranches.mockRejectedValueOnce(new Error('Service error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({ name: 'New Branch' }),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 403 when staff tries to create branch', async () => {
      mocks.auth.mockResolvedValueOnce(staffSession)

      const response = await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({ name: 'New Branch' }),
        })
      )

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Yetkisiz erişim' })
    })

    it('allows admin to create branch', async () => {
      mocks.auth.mockResolvedValueOnce(adminSession)
      mocks.createBranch.mockResolvedValueOnce({
        id: 'branch-1',
        name: 'Admin Created Branch',
        type: 'satellite',
        code: 'ADMIN01',
        phone: '+90 555 444 5566',
        email: 'admin@example.com',
        address: '456 Admin St',
        city: 'Istanbul',
        district: 'Besiktas',
        isActive: true,
      })

      const response = await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Admin Created Branch',
            code: 'ADMIN01',
            phone: '+90 555 444 5566',
            email: 'admin@example.com',
            address: '456 Admin St',
            city: 'Istanbul',
            district: 'Besiktas',
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Admin Created Branch')
    })

    it('allows owner to create branch', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)
      mocks.createBranch.mockResolvedValueOnce({
        id: 'branch-1',
        name: 'Owner Created Branch',
        type: 'main',
        code: 'OWNER01',
        isActive: true,
      })

      const response = await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Owner Created Branch',
            type: 'main',
            code: 'OWNER01',
          }),
        })
      )

      expect(response.status).toBe(200)
    })

    it('returns 400 when name is missing', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)

      const response = await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({ code: 'NO_NAME' }),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Şube adı gereklidir' })
    })

    it('uses satellite type by default', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)
      mocks.createBranch.mockResolvedValueOnce({
        id: 'branch-1',
        name: 'Default Type Branch',
        type: 'satellite',
      })

      await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({ name: 'Default Type Branch' }),
        })
      )

      expect(mocks.createBranch).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          name: 'Default Type Branch',
          type: 'satellite',
        })
      )
    })

    it('returns 409 when branch name already exists', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)
      mocks.createBranch.mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`name`)')
      )

      const response = await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({ name: 'Duplicate Branch' }),
        })
      )

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({
        error: 'Bu isimde bir şube zaten var',
      })
    })

    it('returns 500 when service fails', async () => {
      mocks.auth.mockResolvedValueOnce(ownerSession)
      mocks.createBranch.mockRejectedValueOnce(new Error('Service error'))

      const response = await POST(
        new Request('http://localhost/api/branches', {
          method: 'POST',
          body: JSON.stringify({ name: 'New Branch' }),
        })
      )

      expect(response.status).toBe(500)
    })
  })
})
