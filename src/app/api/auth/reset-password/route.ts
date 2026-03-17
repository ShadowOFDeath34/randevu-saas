import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { checkIPRateLimit, defaultConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import { z } from 'zod'

const passwordSchema = z.string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .regex(/[A-Z]/, 'Şifre en az 1 büyük harf içermeli')
  .regex(/[a-z]/, 'Şifre en az 1 küçük harf içermeli')
  .regex(/[0-9]/, 'Şifre en az 1 rakam içermeli')
  .regex(/[^A-Za-z0-9]/, 'Şifre en az 1 özel karakter içermeli')

export async function POST(req: Request) {
  try {
    // Rate limiting check - 5 requests per 15 minutes
    const rateLimitResult = await checkIPRateLimit(req, defaultConfigs.auth)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token ve yeni şifre gereklidir' }, { status: 400 })
    }

    // Strong password validation
    const passwordValidation = passwordSchema.safeParse(password)
    if (!passwordValidation.success) {
      const errorMessage = passwordValidation.error.issues[0]?.message || 'Geçersiz şifre'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
