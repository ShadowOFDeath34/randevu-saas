import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { slugify } from '@/lib/utils'
import { registerSchema } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    const existingTenant = await db.tenant.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Bu URL adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    const tenant = await db.tenant.create({
      data: {
        name: validatedData.businessName,
        slug: validatedData.slug,
        users: {
          create: {
            name: validatedData.name,
            email: validatedData.email,
            passwordHash,
            role: 'owner'
          }
        },
        businessProfile: {
          create: {
            businessName: validatedData.businessName,
            bookingSlug: validatedData.slug
          }
        },
        businessHours: {
          create: [
            { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isClosed: false },
            { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00', isClosed: false },
            { dayOfWeek: 0, isClosed: true }
          ]
        }
      },
      include: {
        users: true,
        businessProfile: true
      }
    })

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      message: 'İşletme başarıyla oluşturuldu'
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
