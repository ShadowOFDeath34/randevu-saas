import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { primaryCustomerId, duplicateCustomerId, mergeData } = body

    if (!primaryCustomerId || !duplicateCustomerId) {
      return NextResponse.json(
        { error: 'Birincil ve yinelenen müşteri ID\'leri gerekli' },
        { status: 400 }
      )
    }

    if (primaryCustomerId === duplicateCustomerId) {
      return NextResponse.json(
        { error: 'Aynı müşteri birleştirilemez' },
        { status: 400 }
      )
    }

    // Her iki müşterinin de var olduğunu ve bu tenant'a ait olduğunu kontrol et
    const [primaryCustomer, duplicateCustomer] = await Promise.all([
      db.customer.findFirst({
        where: { id: primaryCustomerId, tenantId: session.user.tenantId }
      }),
      db.customer.findFirst({
        where: { id: duplicateCustomerId, tenantId: session.user.tenantId }
      })
    ])

    if (!primaryCustomer) {
      return NextResponse.json(
        { error: 'Birincil müşteri bulunamadı' },
        { status: 404 }
      )
    }

    if (!duplicateCustomer) {
      return NextResponse.json(
        { error: 'Yinelenen müşteri bulunamadı' },
        { status: 404 }
      )
    }

    // Transaction ile birleştirme işlemi
    const result = await db.$transaction(async (tx) => {
      // 1. Yinelenen müşterinin booking'lerini birincil müşteriye aktar
      await tx.booking.updateMany({
        where: { customerId: duplicateCustomerId },
        data: { customerId: primaryCustomerId }
      })

      // 2. Yinelenen müşterinin notification log'larını aktar
      await tx.notificationLog.updateMany({
        where: { customerId: duplicateCustomerId },
        data: { customerId: primaryCustomerId }
      })

      // 3. Yinelenen müşterinin review request'lerini aktar
      await tx.reviewRequest.updateMany({
        where: { customerId: duplicateCustomerId },
        data: { customerId: primaryCustomerId }
      })

      // 4. Birincil müşteriyi güncelle (mergeData varsa)
      if (mergeData) {
        const updateData: any = {}

        // Hangi alanların korunacağını belirle
        if (mergeData.keepEmail === 'duplicate' && duplicateCustomer.email) {
          updateData.email = duplicateCustomer.email
        }
        if (mergeData.keepNotes === 'duplicate' && duplicateCustomer.notes) {
          updateData.notes = duplicateCustomer.notes
        }
        if (mergeData.keepName === 'duplicate') {
          updateData.fullName = duplicateCustomer.fullName
        }

        // İstatistikleri birleştir
        updateData.noShowCount = (primaryCustomer.noShowCount || 0) + (duplicateCustomer.noShowCount || 0)
        updateData.totalBookings = (primaryCustomer.totalBookings || 0) + (duplicateCustomer.totalBookings || 0)

        if (Object.keys(updateData).length > 0) {
          await tx.customer.update({
            where: { id: primaryCustomerId },
            data: updateData
          })
        }
      }

      // 5. Yinelenen müşteriyi sil
      await tx.customer.delete({
        where: { id: duplicateCustomerId }
      })

      // 6. Birincil müşteriyi getir
      const mergedCustomer = await tx.customer.findUnique({
        where: { id: primaryCustomerId },
        include: {
          _count: {
            select: { bookings: true }
          }
        }
      })

      return mergedCustomer
    })

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'CUSTOMER_MERGE',
        entityType: 'Customer',
        entityId: primaryCustomerId,
        metadataJson: JSON.stringify({
          primaryCustomerId,
          duplicateCustomerId,
          primaryName: primaryCustomer.fullName,
          duplicateName: duplicateCustomer.fullName,
          mergeData
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Müşteriler başarıyla birleştirildi',
      customer: result
    })
  } catch (error) {
    console.error('Error merging customers:', error)
    return NextResponse.json(
      { error: 'Müşteriler birleştirilirken hata oluştu' },
      { status: 500 }
    )
  }
}
