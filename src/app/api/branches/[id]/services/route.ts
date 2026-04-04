import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { manageBranchServices } from '@/lib/branch/service'

// GET - Şube hizmetlerini getir
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const branch = await db.branch.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }

    const services = await db.branchService.findMany({
      where: { branchId: id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
            isActive: true
          }
        }
      },
      orderBy: {
        service: { name: 'asc' }
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching branch services:', error)
    return NextResponse.json({ error: 'Error fetching branch services' }, { status: 500 })
  }
}

// PUT - Şube hizmetlerini güncelle
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { services } = body

    if (!Array.isArray(services)) {
      return NextResponse.json({ error: 'Hizmetler array olmalı' }, { status: 400 })
    }

    await manageBranchServices(id, session.user.tenantId, services)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating branch services:', error)
    if (error.message === 'Branch not found') {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error updating branch services' }, { status: 500 })
  }
}
