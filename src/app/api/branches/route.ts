import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createBranch, getBranches } from '@/lib/branch/service'

// GET - Tüm şubeleri getir
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branches = await getBranches(session.user.tenantId, true)

    return NextResponse.json(branches)
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json({ error: 'Error fetching branches' }, { status: 500 })
  }
}

// POST - Yeni şube oluştur
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece owner ve admin şube oluşturabilir
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const body = await req.json()
    const { name, type, code, phone, email, address, city, district } = body

    if (!name) {
      return NextResponse.json({ error: 'Şube adı gereklidir' }, { status: 400 })
    }

    const branch = await createBranch({
      tenantId: session.user.tenantId,
      name,
      type: type || 'satellite',
      code,
      phone,
      email,
      address,
      city,
      district
    })

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Error creating branch:', error)
    if (error.message?.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Bu isimde bir şube zaten var' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error creating branch' }, { status: 500 })
  }
}
