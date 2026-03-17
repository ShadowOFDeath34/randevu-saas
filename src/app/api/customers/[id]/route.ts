import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Tekil müşteri getir
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

    const customer = await db.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      },
      include: {
        bookings: {
          where: { deletedAt: null },
          orderBy: { bookingDate: 'desc' },
          take: 10,
          include: {
            service: true,
            staff: true
          }
        },
        _count: {
          select: { bookings: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Error fetching customer' }, { status: 500 })
  }
}

// PUT - Müşteri güncelle (tam güncelleme)
export async function PUT(
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
    const { fullName, phone, email, notes, customerSegment } = body

    // Müşterinin var olduğunu ve bu tenant'a ait olduğunu kontrol et
    const existingCustomer = await db.customer.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    // Telefon numarası değiştiyse, başka müşteride olup olmadığını kontrol et
    if (phone && phone !== existingCustomer.phone) {
      const phoneExists = await db.customer.findFirst({
        where: {
          tenantId: session.user.tenantId,
          phone,
          id: { not: id }
        }
      })

      if (phoneExists) {
        return NextResponse.json(
          { error: 'Bu telefon numarası başka bir müşteriye ait' },
          { status: 400 }
        )
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: {
        fullName: fullName || existingCustomer.fullName,
        phone: phone || existingCustomer.phone,
        email: email !== undefined ? email : existingCustomer.email,
        notes: notes !== undefined ? notes : existingCustomer.notes,
        customerSegment: customerSegment || existingCustomer.customerSegment
      }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'CUSTOMER_UPDATE',
        entityType: 'Customer',
        entityId: id,
        metadataJson: JSON.stringify({
          oldData: existingCustomer,
          newData: { fullName, phone, email, notes, customerSegment }
        })
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Error updating customer' }, { status: 500 })
  }
}

// PATCH - Müşteri güncelle (kısmi güncelleme)
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

    // Müşterinin var olduğunu ve bu tenant'a ait olduğunu kontrol et
    const existingCustomer = await db.customer.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    // Telefon numarası değiştiyse kontrol et
    if (body.phone && body.phone !== existingCustomer.phone) {
      const phoneExists = await db.customer.findFirst({
        where: {
          tenantId: session.user.tenantId,
          phone: body.phone,
          id: { not: id }
        }
      })

      if (phoneExists) {
        return NextResponse.json(
          { error: 'Bu telefon numarası başka bir müşteriye ait' },
          { status: 400 }
        )
      }
    }

    // Sadece gönderilen alanları güncelle
    const updateData: any = {}
    if (body.fullName !== undefined) updateData.fullName = body.fullName
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.customerSegment !== undefined) updateData.customerSegment = body.customerSegment

    const customer = await db.customer.update({
      where: { id },
      data: updateData
    })

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'CUSTOMER_PATCH',
        entityType: 'Customer',
        entityId: id,
        metadataJson: JSON.stringify(updateData)
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error patching customer:', error)
    return NextResponse.json({ error: 'Error patching customer' }, { status: 500 })
  }
}

// DELETE - Müşteri sil (soft delete)
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

    // Müşterinin var olduğunu ve bu tenant'a ait olduğunu kontrol et
    const existingCustomer = await db.customer.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        bookings: {
          where: {
            status: { in: ['pending', 'confirmed'] },
            deletedAt: null
          }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    // Aktif randevuları kontrol et
    if (existingCustomer.bookings.length > 0) {
      return NextResponse.json(
        {
          error: 'Bu müşterinin aktif randevuları var. Önce randevuları iptal edin veya tamamlayın.',
          activeBookings: existingCustomer.bookings.length
        },
        { status: 400 }
      )
    }

    // Müşteriyi sil (Prisma cascade delete ile ilişkili kayıtları da siler)
    await db.customer.delete({
      where: { id }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'CUSTOMER_DELETE',
        entityType: 'Customer',
        entityId: id,
        metadataJson: JSON.stringify({
          fullName: existingCustomer.fullName,
          phone: existingCustomer.phone
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Müşteri başarıyla silindi'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Error deleting customer' }, { status: 500 })
  }
}
