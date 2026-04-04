import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getAnalytics, POST as postCampaign } from '@/app/api/campaigns/route'
import { POST as generateCampaign } from '@/app/api/campaigns/generate/route'
import { POST as sendCampaign } from '@/app/api/campaigns/send/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  sendSMS: vi.fn(),
  sendEmail: vi.fn(),
  db: {
    campaign: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    businessProfile: {
      findUnique: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/db', () => ({
  db: mocks.db,
}))

vi.mock('@/lib/sms', () => ({
  sendSMS: mocks.sendSMS,
}))

vi.mock('@/lib/email', () => ({
  sendEmail: mocks.sendEmail,
}))

const session = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
  },
}

describe('campaigns/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await getAnalytics()

      expect(response.status).toBe(401)
    })

    it('returns campaigns with creator info', async () => {
      const campaigns = [{ id: 'campaign-1', name: 'Spring', user: { name: 'Ada' } }]

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.campaign.findMany.mockResolvedValueOnce(campaigns)

      const response = await getAnalytics()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ campaigns })
      expect(mocks.db.campaign.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      })
    })

    it('returns 500 when lookup fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.campaign.findMany.mockRejectedValueOnce(new Error('lookup failed'))

      const response = await getAnalytics()

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Internal Server Error' })
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await postCampaign(
        new Request('http://localhost/api/campaigns', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 when required fields are missing', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await postCampaign(
        new Request('http://localhost/api/campaigns', {
          method: 'POST',
          body: JSON.stringify({ name: 'Launch' }),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Eksik bilgi girdiniz' })
    })

    it('creates a campaign', async () => {
      const campaign = { id: 'campaign-1', name: 'Launch' }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.campaign.create.mockResolvedValueOnce(campaign)

      const response = await postCampaign(
        new Request('http://localhost/api/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Launch',
            targetSegment: 'all',
            type: 'sms',
            content: 'Hello',
            aiGenerated: true,
          }),
        })
      )

      expect(response.status).toBe(201)
      expect(await response.json()).toEqual({ campaign })
      expect(mocks.db.campaign.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          name: 'Launch',
          targetSegment: 'all',
          type: 'sms',
          content: 'Hello',
          aiGenerated: true,
          createdBy: 'user-1',
        },
      })
    })

    it('returns 500 when creation fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.campaign.create.mockRejectedValueOnce(new Error('create failed'))

      const response = await postCampaign(
        new Request('http://localhost/api/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Launch',
            targetSegment: 'all',
            type: 'sms',
            content: 'Hello',
          }),
        })
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Kampanya oluşturulamadı' })
    })
  })
})

describe('campaigns/generate/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 401 when unauthenticated', async () => {
    mocks.auth.mockResolvedValueOnce(null)

    const response = await generateCampaign(
      new Request('http://localhost/api/campaigns/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 400 when segment or type is missing', async () => {
    mocks.auth.mockResolvedValueOnce(session)

    const response = await generateCampaign(
      new Request('http://localhost/api/campaigns/generate', {
        method: 'POST',
        body: JSON.stringify({ segment: 'all' }),
      })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Segment ve tip gereklidir' })
  })

  it.each([
    { segment: 'at_risk', type: 'sms', expected: '%20' },
    { segment: 'loyal', type: 'email', expected: 'VIP' },
    { segment: 'new', type: 'sms', expected: '%15' },
    { segment: 'all', type: 'email', expected: 'yenilikler' },
  ])('generates content for $segment / $type', async ({ segment, type, expected }) => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.businessProfile.findUnique.mockResolvedValueOnce({
      businessName: 'Randevu Test',
    })

    const responsePromise = generateCampaign(
      new Request('http://localhost/api/campaigns/generate', {
        method: 'POST',
        body: JSON.stringify({ segment, type }),
      })
    )

    await vi.advanceTimersByTimeAsync(1500)
    const response = await responsePromise
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.content).toContain(expected)
    expect(data.explanation).toContain(segment)
    expect(data.explanation).toContain(type)
  })

  it('returns 500 when generation setup fails', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.businessProfile.findUnique.mockRejectedValueOnce(new Error('profile failed'))

    const response = await generateCampaign(
      new Request('http://localhost/api/campaigns/generate', {
        method: 'POST',
        body: JSON.stringify({ segment: 'all', type: 'sms' }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'AI içerik üretemedi' })
  })
})

describe('campaigns/send/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mocks.auth.mockResolvedValueOnce(null)

    const response = await sendCampaign(
      new Request('http://localhost/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 400 when campaignId is missing', async () => {
    mocks.auth.mockResolvedValueOnce(session)

    const response = await sendCampaign(
      new Request('http://localhost/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Kampanya ID gerekli' })
  })

  it('returns 404 when campaign cannot be found', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.campaign.findUnique.mockResolvedValueOnce(null)

    const response = await sendCampaign(
      new Request('http://localhost/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({ campaignId: 'campaign-1' }),
      })
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Kampanya bulunamadı' })
  })

  it('returns 400 when campaign was already sent', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.campaign.findUnique.mockResolvedValueOnce({
      id: 'campaign-1',
      status: 'sent',
    })

    const response = await sendCampaign(
      new Request('http://localhost/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({ campaignId: 'campaign-1' }),
      })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Bu kampanya zaten gönderilmiş' })
  })

  it('sends sms campaigns and updates the sent count with successful deliveries', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.campaign.findUnique.mockResolvedValueOnce({
      id: 'campaign-1',
      status: 'draft',
      targetSegment: 'all',
      type: 'sms',
      name: 'Promo',
      content: 'Hello',
      aiGenerated: false,
    })
    mocks.db.customer.findMany.mockResolvedValueOnce([
      { id: 'customer-1', phone: '5551112233' },
      { id: 'customer-2', phone: '5552223344' },
      { id: 'customer-3', phone: null },
    ])
    mocks.sendSMS
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('gateway failed'))
    mocks.db.campaign.update.mockResolvedValueOnce({ id: 'campaign-1' })

    const response = await sendCampaign(
      new Request('http://localhost/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({ campaignId: 'campaign-1' }),
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, sentCount: 2 })
    expect(mocks.sendSMS).toHaveBeenCalledTimes(2)
    expect(mocks.db.campaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: {
        status: 'sent',
        sentAt: expect.any(Date),
        sentCount: 1,
      },
    })
  })

  it('sends segmented email campaigns only to customers with email', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.campaign.findUnique.mockResolvedValueOnce({
      id: 'campaign-2',
      status: 'draft',
      targetSegment: 'vip',
      type: 'email',
      name: 'VIP Launch',
      content: 'Email body',
      aiGenerated: true,
    })
    mocks.db.customer.findMany.mockResolvedValueOnce([
      { id: 'customer-1', email: 'ada@example.com' },
      { id: 'customer-2', email: null },
    ])
    mocks.sendEmail.mockResolvedValueOnce(undefined)
    mocks.db.campaign.update.mockResolvedValueOnce({ id: 'campaign-2' })

    const response = await sendCampaign(
      new Request('http://localhost/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({ campaignId: 'campaign-2' }),
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, sentCount: 1 })
    expect(mocks.db.customer.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        customerSegment: 'vip',
      },
    })
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when send pipeline fails unexpectedly', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.campaign.findUnique.mockRejectedValueOnce(new Error('pipeline failed'))

    const response = await sendCampaign(
      new Request('http://localhost/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({ campaignId: 'campaign-3' }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Gönderim sırasında hata oluştu' })
  })
})
