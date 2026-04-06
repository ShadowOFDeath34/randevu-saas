import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - List audit logs with filtering
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      tenantId: session.user.tenantId
    }

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (userId) {
      where.actorUserId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      db.auditLog.count({ where })
    ])

    // Get unique actions and entity types for filters
    const [actions, entityTypes] = await Promise.all([
      db.auditLog.findMany({
        where: { tenantId: session.user.tenantId },
        select: { action: true },
        distinct: ['action']
      }),
      db.auditLog.findMany({
        where: { tenantId: session.user.tenantId },
        select: { entityType: true },
        distinct: ['entityType']
      })
    ])

    return NextResponse.json({
      logs: logs.map(log => ({
        ...log,
        metadata: log.metadataJson ? JSON.parse(log.metadataJson) : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        actions: actions.map(a => a.action).filter(Boolean),
        entityTypes: entityTypes.map(e => e.entityType).filter(Boolean)
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
