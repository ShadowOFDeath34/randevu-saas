import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notificationService } from '@/lib/notification'
import crypto from 'crypto'
import { checkIPRateLimit, defaultConfigs, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Rate limiting: 5 requests per 15 minutes per IP
  const rateLimit = await checkIPRateLimit(req, defaultConfigs.auth)
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit)
  }
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi gereklidir' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Güvenlik: Kullanıcı bulunamasa bile aynı başarılı yanıtı dön (email enumeration saldırılarını önlemek için)
      return NextResponse.json({ success: true })
    }

    // Token oluştur
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 saat geçerli

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // E-posta gönder
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    
    await notificationService.sendEmail({
      to: user.email,
      subject: 'Şifre Sıfırlama İsteği',
      html: `
        <h2>Şifre Sıfırlama</h2>
        <p>Merhaba ${user.name},</p>
        <p>Şifrenizi sıfırlamak için bir istekte bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#4f46e5;color:white;text-decoration:none;border-radius:5px;">Şifremi Sıfırla</a>
        <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        <p>Bu bağlantı 1 saat boyunca geçerlidir.</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
