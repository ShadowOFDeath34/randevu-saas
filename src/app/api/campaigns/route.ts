import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaigns = await db.campaign.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json({ campaigns })
  } catch (error: unknown) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, targetSegment, type, content, aiGenerated } = await req.json()

    if (!name || !targetSegment || !type || !content) {
      return NextResponse.json({ error: 'Eksik bilgi girdiniz' }, { status: 400 })
    }

    const campaign = await db.campaign.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        targetSegment,
        type,
        content,
        aiGenerated: !!aiGenerated,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Kampanya oluşturulamadı' }, { status: 500 })
  }
}
