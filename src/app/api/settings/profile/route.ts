import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.businessProfile.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { businessName, phone, email, address, city, district, description } = body

    const profile = await db.businessProfile.update({
      where: { tenantId: session.user.tenantId },
      data: {
        businessName,
        phone,
        email,
        address,
        city,
        district,
        description
      }
    })

    await db.tenant.update({
      where: { id: session.user.tenantId },
      data: { name: businessName }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
  }
}
