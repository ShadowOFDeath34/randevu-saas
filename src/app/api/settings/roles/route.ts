import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const permissionCategories = {
  bookings: ['bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete'],
  customers: ['customers:read', 'customers:manage'],
  staff: ['staff:read', 'staff:manage'],
  services: ['services:read', 'services:manage'],
  calendar: ['calendar:read', 'calendar:manage'],
  analytics: ['analytics:read', 'analytics:export'],
  settings: ['settings:read', 'settings:manage'],
  billing: ['billing:read', 'billing:manage'],
  admin: ['admin:full_access']
}

// GET - List all roles
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = await db.role.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      roles,
      permissionCategories
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new role
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validation
    const schema = z.object({
      name: z.string().min(1).max(50),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      permissions: z.array(z.string()),
      autoAssignNewUsers: z.boolean().optional()
    })

    const validated = schema.parse(data)

    // Check if role name already exists
    const existing = await db.role.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name: validated.name
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 409 }
      )
    }

    const role = await db.role.create({
      data: {
        tenantId: session.user.tenantId,
        name: validated.name,
        description: validated.description,
        color: validated.color || '#4f46e5',
        permissions: JSON.stringify(validated.permissions),
        autoAssignNewUsers: validated.autoAssignNewUsers || false,
        type: 'CUSTOM'
      }
    })

    // Log creation
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'ROLE_CREATED',
        entityType: 'Role',
        entityId: role.id,
        metadataJson: JSON.stringify({
          name: validated.name,
          permissions: validated.permissions
        })
      }
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
