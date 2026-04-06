import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// DELETE - Revoke API key
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

    const key = await db.apiKey.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      }
    })

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    await db.apiKey.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: session.user.id,
        revokeReason: 'User initiated'
      }
    })

    // Log revocation
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'API_KEY_REVOKED',
        entityType: 'ApiKey',
        entityId: id,
        metadataJson: JSON.stringify({
          name: key.name
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
