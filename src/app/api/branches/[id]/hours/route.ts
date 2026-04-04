import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateBranchHours } from '@/lib/branch/service'

// GET - Şube çalışma saatlerini getir
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

    const hours = await db.branchBusinessHour.findMany({
      where: { branchId: id },
      orderBy: { dayOfWeek: 'asc' }
    })

    return NextResponse.json(hours)
  } catch (error) {
    console.error('Error fetching branch hours:', error)
    return NextResponse.json({ error: 'Error fetching branch hours' }, { status: 500 })
  }
}

// PUT - Şube çalışma saatlerini güncelle
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
    const { hours } = body

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: 'Saatler array olmalı' }, { status: 400 })
    }

    await updateBranchHours(id, session.user.tenantId, hours)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating branch hours:', error)
    if (error.message === 'Branch not found') {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error updating branch hours' }, { status: 500 })
  }
}
