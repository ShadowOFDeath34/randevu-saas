import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getBranchById, updateBranch, deactivateBranch } from '@/lib/branch/service'

// GET - Şube detayını getir
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
    const branch = await getBranchById(id, session.user.tenantId)

    if (!branch) {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Error fetching branch:', error)
    return NextResponse.json({ error: 'Error fetching branch' }, { status: 500 })
  }
}

// PUT - Şube güncelle
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece owner ve admin güncelleyebilir
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const branch = await updateBranch(id, session.user.tenantId, body)

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Error updating branch:', error)
    if (error.message === 'Branch not found') {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error updating branch' }, { status: 500 })
  }
}

// DELETE - Şube sil (deaktive et)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece owner silebilir
    if (session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { id } = await params

    await deactivateBranch(id, session.user.tenantId)

    return NextResponse.json({ success: true, message: 'Şube deaktive edildi' })
  } catch (error: any) {
    console.error('Error deactivating branch:', error)
    if (error.message === 'Branch not found') {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }
    if (error.message === 'Ana şube silinemez') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error deactivating branch' }, { status: 500 })
  }
}
