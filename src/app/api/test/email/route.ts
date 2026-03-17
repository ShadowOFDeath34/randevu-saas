import { NextResponse } from 'next/server'
import { sendEmail, sendBookingConfirmationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      )
    }

    const { to, type = 'basic' } = await req.json()

    if (!to) {
      return NextResponse.json(
        { error: 'E-posta adresi gerekli' },
        { status: 400 }
      )
    }

    let result

    if (type === 'booking') {
      // Test booking confirmation email
      result = await sendBookingConfirmationEmail(
        to,
        {
          customerName: 'Test Kullanıcı',
          serviceName: 'Saç Kesimi',
          date: '15 Mart 2024',
          time: '14:00',
          staffName: 'Ahmet Usta',
          businessName: 'Test İşletme',
          confirmationCode: 'ABC123',
        }
      )
    } else {
      // Basic test email
      result = await sendEmail({
        to,
        subject: 'RandevuAI - Test E-postası',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">Test E-postası</h1>
            <p>Bu bir test e-postasıdır.</p>
            <p>Eğer bu e-postayı alıyorsanız, e-posta entegrasyonu çalışıyor demektir.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 14px;">RandevuAI - Akıllı Randevu Yönetimi</p>
          </div>
        `,
        text: 'Bu bir test e-postasıdır. E-posta entegrasyonu çalışıyor.',
      })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'E-posta başarıyla gönderildi',
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'E-posta gönderilemedi' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
