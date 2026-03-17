import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Bu randevu iptal edilemez' }, { status: 400 })
    }

    await db.booking.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Portal cancel error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
