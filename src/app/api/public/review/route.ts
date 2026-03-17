import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Kod gereklidir' }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { confirmationCode: code },
      include: {
        service: true,
        customer: true,
        tenant: {
          include: {
            businessProfile: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json({ error: 'Error fetching review' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, rating, comment } = body

    if (!code || !rating) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { confirmationCode: code }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 })
    }

    const existingRequest = await db.reviewRequest.findUnique({
      where: { bookingId: booking.id }
    })

    if (existingRequest) {
      if (existingRequest.status === 'completed') {
        return NextResponse.json({ error: 'Zaten değerlendirme yapılmış' }, { status: 400 })
      }

      await db.reviewRequest.update({
        where: { id: existingRequest.id },
        data: { status: 'completed' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ error: 'Error submitting review' }, { status: 500 })
  }
}
