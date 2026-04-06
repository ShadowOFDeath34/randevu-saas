import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// GET - List API keys for tenant
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await db.apiKey.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: { not: 'REVOKED' }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        rateLimitPerDay: true,
        usageCountTotal: true,
        permissions: true,
        createdAt: true
      }
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new API key
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Generate API key
    const keyBytes = randomBytes(32)
    const apiKey = `ak_live_${keyBytes.toString('hex')}`
    const keyHash = createHash('sha256').update(apiKey).digest('hex')
    const keyPrefix = apiKey.substring(0, 12)

    const apiKeyRecord = await db.apiKey.create({
      data: {
        tenantId: session.user.tenantId,
        name: data.name,
        description: data.description,
        keyHash,
        keyPrefix,
        permissions: JSON.stringify(data.permissions || []),
        allowedIps: data.allowedIps ? JSON.stringify(data.allowedIps) : null,
        rateLimitPerMinute: data.rateLimitPerMinute || 60,
        rateLimitPerHour: data.rateLimitPerHour || 1000,
        rateLimitPerDay: data.rateLimitPerDay || 10000,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdBy: session.user.id
      }
    })

    // Log creation
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'API_KEY_CREATED',
        entityType: 'ApiKey',
        entityId: apiKeyRecord.id,
        metadataJson: JSON.stringify({
          name: data.name,
          permissions: data.permissions
        })
      }
    })

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        key: apiKey, // Only returned once on creation
        keyPrefix: apiKeyRecord.keyPrefix
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
