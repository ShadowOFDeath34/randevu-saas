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

    return NextResponse.json({
      primaryColor: '#4f46e5',
      logoUrl: profile?.logoUrl || '',
      coverImage: ''
    })
  } catch (error) {
    console.error('Error fetching theme:', error)
    return NextResponse.json({ error: 'Error fetching theme' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { logoUrl } = body

    // Server-side validation for base64 image size (approx 2MB limit)
    if (logoUrl && typeof logoUrl === 'string') {
      const MAX_LENGTH = 3 * 1024 * 1024 // ~3MB string length
      if (logoUrl.length > MAX_LENGTH) {
        return NextResponse.json({ error: 'Logo boyutu çok büyük. Maksimum 2MB olmalıdır.' }, { status: 400 })
      }
    }

    await db.businessProfile.update({
      where: { tenantId: session.user.tenantId },
      data: {
        logoUrl: logoUrl || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving theme:', error)
    return NextResponse.json({ error: 'Error saving theme' }, { status: 500 })
  }
}
