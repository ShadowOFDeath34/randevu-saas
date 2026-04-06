import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET - Get single role
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const role = await db.role.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      },
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

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Check if role exists and belongs to tenant
    const existing = await db.role.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Cannot edit system roles
    if (existing.type === 'SYSTEM') {
      return NextResponse.json(
        { error: 'Cannot edit system roles' },
        { status: 403 }
      )
    }

    // Validation
    const schema = z.object({
      name: z.string().min(1).max(50).optional(),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      permissions: z.array(z.string()).optional(),
      autoAssignNewUsers: z.boolean().optional(),
      isActive: z.boolean().optional()
    })

    const validated = schema.parse(data)

    // Check name uniqueness if changing name
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await db.role.findFirst({
        where: {
          tenantId: session.user.tenantId,
          name: validated.name,
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Role name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = { ...validated }
    if (validated.permissions) {
      updateData.permissions = JSON.stringify(validated.permissions)
    }

    const role = await db.role.update({
      where: { id },
      data: updateData
    })

    // Log update
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'ROLE_UPDATED',
        entityType: 'Role',
        entityId: id,
        metadataJson: JSON.stringify({
          updatedFields: Object.keys(validated)
        })
      }
    })

    return NextResponse.json(role)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete role
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.role.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Cannot delete system roles
    if (existing.type === 'SYSTEM') {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 403 }
      )
    }

    // Check if role has users
    const userCount = await db.userRole.count({
      where: { roleId: id }
    })

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Reassign users first.' },
        { status: 400 }
      )
    }

    await db.role.delete({ where: { id } })

    // Log deletion
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'ROLE_DELETED',
        entityType: 'Role',
        entityId: id,
        metadataJson: JSON.stringify({
          name: existing.name
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
