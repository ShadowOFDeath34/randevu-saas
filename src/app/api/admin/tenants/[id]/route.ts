import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    const tenant = await db.tenant.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json({ error: 'Error updating tenant' }, { status: 500 })
  }
}
