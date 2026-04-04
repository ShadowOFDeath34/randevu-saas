import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assignStaffToBranch } from '@/lib/branch/service'

// GET - Şube personellerini getir
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

    const assignments = await db.staffBranchAssignment.findMany({
      where: { branchId: id, isActive: true },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            title: true,
            phone: true,
            email: true,
            avatarUrl: true,
            isActive: true
          }
        }
      },
      orderBy: {
        staff: { fullName: 'asc' }
      }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching branch staff:', error)
    return NextResponse.json({ error: 'Error fetching branch staff' }, { status: 500 })
  }
}

// POST - Şubeye personel ata
export async function POST(
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

    const { id: branchId } = await params
    const body = await req.json()
    const { staffId, isPrimary, workingDays, startTime, endTime } = body

    if (!staffId) {
      return NextResponse.json({ error: 'Personel ID gereklidir' }, { status: 400 })
    }

    const assignment = await assignStaffToBranch(
      staffId,
      branchId,
      session.user.tenantId,
      { isPrimary, workingDays, startTime, endTime }
    )

    return NextResponse.json(assignment)
  } catch (error: any) {
    console.error('Error assigning staff to branch:', error)
    if (error.message === 'Staff or branch not found') {
      return NextResponse.json({ error: 'Personel veya şube bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error assigning staff to branch' }, { status: 500 })
  }
}
