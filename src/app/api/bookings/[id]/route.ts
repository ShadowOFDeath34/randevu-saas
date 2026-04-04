import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import { sendSMS } from '@/lib/sms'
import { sendBookingStatusEmail } from '@/lib/email'
import { smsTemplateService } from '@/lib/sms/template-service'

// GET - Tekil booking getir
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

    const booking = await db.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null
      },
      include: {
        customer: true,
        service: true,
        staff: true,
        statusLogs: {
          orderBy: { changedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Error fetching booking' }, { status: 500 })
  }
}

// PATCH - Booking güncelle (status veya tam düzenleme)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, serviceId, staffId, bookingDate, startTime, notes } = body

    const existingBooking = await db.booking.findFirst({
      where: { id, tenantId: session.user.tenantId, deletedAt: null },
      include: { customer: true, service: true, staff: true, tenant: true }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Sadece status güncellemesi
    if (status && !serviceId && !staffId && !bookingDate && !startTime) {
      const booking = await db.booking.update({
        where: { id },
        data: { status }
      })

      await db.bookingStatusLog.create({
        data: {
          tenantId: session.user.tenantId,
          bookingId: id,
          oldStatus: existingBooking.status as BookingStatus,
          newStatus: status as BookingStatus,
          changedByUserId: session.user.id
        }
      })

      // Müşteriye durum güncellemesi bildirimi
      if (existingBooking.customer?.phone && ['confirmed', 'cancelled', 'completed'].includes(status)) {
        let message: string | null = null

        if (status === 'cancelled') {
          message = await smsTemplateService.formatBookingCancellation(
            session.user.tenantId,
            {
              customerName: existingBooking.customer.fullName,
              serviceName: existingBooking.service.name,
              date: existingBooking.bookingDate,
              time: existingBooking.startTime,
              businessName: existingBooking.tenant?.name || 'RandevuAI',
            }
          )
        }

        const finalMessage = message || (status === 'confirmed'
          ? `Merhaba ${existingBooking.customer.fullName}, ${existingBooking.bookingDate} ${existingBooking.startTime} tarihli randevunuz onaylandi. Bizi tercih ettiginiz icin tesekkurler!`
          : status === 'completed'
          ? `Merhaba ${existingBooking.customer.fullName}, ${existingBooking.service.name} hizmetimizi tamamladiniz. Degerlendirmenizi bekliyoruz!`
          : `Merhaba ${existingBooking.customer.fullName}, ${existingBooking.bookingDate} ${existingBooking.startTime} tarihli randevunuz iptal edildi. Daha fazla bilgi icin bizi arayabilirsiniz.`)

        sendSMS({
          phone: existingBooking.customer.phone,
          message: finalMessage,
          tenantId: session.user.tenantId,
          bookingId: id
        }).catch(err => console.error('Status SMS sending failed:', err))
      }

      // Randevu tamamlandığında ReviewRequest oluştur ve değerlendirme SMS'i gönder
      if (status === 'completed' && existingBooking.customer) {
        try {
          // Mevcut review request var mı kontrol et
          const existingReviewRequest = await db.reviewRequest.findFirst({
            where: { bookingId: id }
          })

          if (!existingReviewRequest) {
            // Review request oluştur
            await db.reviewRequest.create({
              data: {
                tenantId: session.user.tenantId,
                bookingId: id,
                customerId: existingBooking.customerId,
                channel: 'sms',
                status: 'pending',
              }
            })

            // Review link'i oluştur (token: sadece bookingId)
            const token = Buffer.from(id).toString('base64')
            const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.randevuai.com'}/review/${token}`

            // Değerlendirme SMS'i gönder
            if (existingBooking.customer.phone) {
              const reviewMessage = await smsTemplateService.formatReviewRequest(
                session.user.tenantId,
                {
                  customerName: existingBooking.customer.fullName,
                  serviceName: existingBooking.service.name,
                  businessName: existingBooking.tenant?.name || 'RandevuAI',
                  reviewLink,
                }
              )

              const message = reviewMessage || `Merhaba ${existingBooking.customer.fullName}, ${existingBooking.service.name} hizmetimizi degerlendirmek icin tiklayin: ${reviewLink}`

              sendSMS({
                phone: existingBooking.customer.phone,
                message,
                tenantId: session.user.tenantId,
                bookingId: id
              }).catch(err => console.error('Review SMS sending failed:', err))
            }
          }
        } catch (reviewError) {
          console.error('Review request creation error:', reviewError)
          // Review oluşturma hatası booking işlemini engellememeli
        }
      }

      if (existingBooking.customer?.email && ['confirmed', 'cancelled'].includes(status)) {
        sendBookingStatusEmail(existingBooking.customer.email, {
          customerName: existingBooking.customer.fullName,
          status: status as BookingStatus,
          bookingDate: existingBooking.bookingDate,
          bookingTime: existingBooking.startTime
        }).catch(err => console.error('Status email sending failed:', err))
      }

      return NextResponse.json(booking)
    }

    // Tam randevu düzenleme (tarih, saat, personel, hizmet değişikliği)
    const updateData: Record<string, string | null> = {}
    if (notes !== undefined) updateData.notes = notes

    // Yeni değerleri belirle (değişmemişse mevcut değerleri kullan)
    const newServiceId = serviceId || existingBooking.serviceId
    const newStaffId = staffId || existingBooking.staffId
    const newBookingDate = bookingDate || existingBooking.bookingDate
    const newStartTime = startTime || existingBooking.startTime

    // Servis bilgilerini al (süre hesaplaması için)
    const service = await db.service.findFirst({
      where: { id: newServiceId, tenantId: session.user.tenantId }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Bitiş saatini hesapla
    const startMinutes = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1])
    const endMinutes = startMinutes + service.durationMinutes
    const newEndTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

    // Geçmiş tarih kontrolü
    const bookingDateTime = new Date(`${newBookingDate}T${newStartTime}:00`)
    if (bookingDateTime < new Date()) {
      return NextResponse.json({ error: 'Geçmiş tarihe randevu alınamaz' }, { status: 400 })
    }

    // Transaction ile çakışma kontrolü ve güncelleme
    const updatedBooking = await db.$transaction(async (tx) => {
      // Çakışma kontrolü (kendi dışındaki randevularla)
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          tenantId: session.user.tenantId,
          staffId: newStaffId,
          bookingDate: newBookingDate,
          id: { not: id }, // Kendisi hariç
          status: { notIn: ['cancelled'] },
          deletedAt: null,
          OR: [
            { startTime: { lte: newStartTime }, endTime: { gt: newStartTime } },
            { startTime: { lt: newEndTime }, endTime: { gte: newEndTime } },
            { startTime: { gte: newStartTime }, endTime: { lte: newEndTime } }
          ]
        }
      })

      if (conflictingBooking) {
        throw new Error('BU_SAAT_DOLU')
      }

      // Randevuyu güncelle
      const booking = await tx.booking.update({
        where: { id },
        data: {
          serviceId: newServiceId,
          staffId: newStaffId,
          bookingDate: newBookingDate,
          startTime: newStartTime,
          endTime: newEndTime,
          notes: notes !== undefined ? notes : existingBooking.notes,
          status: status || existingBooking.status
        },
        include: {
          customer: true,
          service: true,
          staff: true,
          tenant: true
        }
      })

      // Audit log oluştur
      await tx.auditLog.create({
        data: {
          tenantId: session.user.tenantId,
          actorUserId: session.user.id,
          action: 'BOOKING_EDIT',
          entityType: 'Booking',
          entityId: id,
          metadataJson: JSON.stringify({
            oldData: {
              serviceId: existingBooking.serviceId,
              staffId: existingBooking.staffId,
              bookingDate: existingBooking.bookingDate,
              startTime: existingBooking.startTime,
              endTime: existingBooking.endTime,
              notes: existingBooking.notes
            },
            newData: {
              serviceId: newServiceId,
              staffId: newStaffId,
              bookingDate: newBookingDate,
              startTime: newStartTime,
              endTime: newEndTime,
              notes: notes !== undefined ? notes : existingBooking.notes
            }
          })
        }
      })

      return booking
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    })

    // Müşteriye değişiklik bildirimi (eğer önemli değişiklikler varsa)
    const hasMajorChanges =
      newBookingDate !== existingBooking.bookingDate ||
      newStartTime !== existingBooking.startTime ||
      newStaffId !== existingBooking.staffId

    if (hasMajorChanges && updatedBooking.customer?.phone) {
      const updateMessage = await smsTemplateService.formatBookingUpdate(
        session.user.tenantId,
        {
          customerName: updatedBooking.customer.fullName,
          serviceName: updatedBooking.service.name,
          date: newBookingDate,
          time: newStartTime,
          businessName: updatedBooking.tenant?.name || 'RandevuAI',
        }
      )

      const message = updateMessage || `Merhaba ${updatedBooking.customer.fullName}, randevunuz guncellendi. Yeni bilgiler: ${newBookingDate} ${newStartTime}, ${updatedBooking.staff.fullName}. Bizi tercih ettiginiz icin tesekkurler!`

      sendSMS({
        phone: updatedBooking.customer.phone,
        message,
        tenantId: session.user.tenantId,
        bookingId: id
      }).catch(err => console.error('Update SMS sending failed:', err))
    }

    return NextResponse.json(updatedBooking)
  } catch (error: unknown) {
    console.error('Error updating booking:', error)
    const err = error as Error
    if (err.message === 'BU_SAAT_DOLU') {
      return NextResponse.json({ error: 'Bu saat dilimi maalesef dolu. Lütfen başka bir saat seçin.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error updating booking' }, { status: 500 })
  }
}

// DELETE - Booking soft delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingBooking = await db.booking.findFirst({
      where: { id, tenantId: session.user.tenantId, deletedAt: null }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Sadece pending veya cancelled booking'ler silinebilir
    const allowedStatusesForDelete: BookingStatus[] = [BookingStatus.pending, BookingStatus.cancelled]
    if (!allowedStatusesForDelete.includes(existingBooking.status)) {
      return NextResponse.json(
        { error: 'Sadece bekleyen veya iptal edilmiş randevular silinebilir' },
        { status: 400 }
      )
    }

    // Soft delete
    const booking = await db.booking.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'BOOKING_SOFT_DELETE',
        entityType: 'Booking',
        entityId: id,
        metadataJson: JSON.stringify({
          bookingDate: existingBooking.bookingDate,
          startTime: existingBooking.startTime,
          status: existingBooking.status
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Randevu başarıyla silindi',
      booking
    })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Error deleting booking' }, { status: 500 })
  }
}
