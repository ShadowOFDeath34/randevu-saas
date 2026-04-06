import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SEGMENT_LABELS: Record<string, string> = {
  at_risk: 'Kayıp risk altındaki müşteriler (uzun süredir gelmeyen)',
  loyal: 'Sadık müşteriler (sık gelen ve memnun)',
  new: 'Yeni müşteriler (ilk kez gelen)',
  all: 'Tüm müşteriler'
}

async function generateWithGemini(
  businessName: string,
  segment: string,
  type: 'sms' | 'email'
): Promise<{ content: string; explanation: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return generateFallback(businessName, segment, type)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const channelGuide = type === 'sms'
      ? 'SMS (maksimum 160 karakter, kısa ve net, emoji kullanabilirsin)'
      : 'E-posta (daha detaylı, profesyonel, paragraflar halinde)'

    const prompt = `İşletme adı: ${businessName}
Hedef kitle: ${SEGMENT_LABELS[segment] || segment}
Kanal: ${channelGuide}

Bu işletme için yüksek dönüşüm oranı sağlayacak bir pazarlama metni yaz.
Müşteri adı için [İsim], randevu linki için [Link] yer tutucularını kullan.
Sadece metni ver, başka açıklama ekleme.`

    const result = await model.generateContent(prompt)
    const content = result.response.text().trim()

    return {
      content,
      explanation: `Gemini AI, "${SEGMENT_LABELS[segment]}" segmenti için ${type === 'sms' ? 'SMS' : 'e-posta'} metni oluşturdu.`
    }
  } catch (error) {
    console.error('Gemini campaign generation error:', error)
    return generateFallback(businessName, segment, type)
  }
}

function generateFallback(
  businessName: string,
  segment: string,
  type: 'sms' | 'email'
): { content: string; explanation: string } {
  const templates: Record<string, Record<string, string>> = {
    at_risk: {
      sms: `Merhaba [İsim]! Sizi ${businessName}'de özledik. Size özel %20 indirim! Randevu: [Link]`,
      email: `Değerli [İsim],\n\n${businessName} olarak sizi bir süredir göremedik. Geri dönmeniz için size özel %20 indirim tanımladık.\n\nRandevu: [Link]\n\nGörüşmek üzere,\n${businessName}`
    },
    loyal: {
      sms: `Sayın [İsim], sadakatiniz için teşekkürler! Bir sonraki ziyaretinizde ekstra bakım bizden. Randevu: [Link] 🌟`,
      email: `Değerli [İsim],\n\n${businessName} ailesi olarak sadakatinizi takdir ediyoruz. Sizi her zaman en iyi şekilde ağırlamak için buradayız.\n\nBir sonraki randevunuzda ücretsiz VIP bakım hediye ediyoruz!\n\nRandevu: [Link]\n\n${businessName}`
    },
    new: {
      sms: `Hoş geldiniz [İsim]! ${businessName}'e ilk gelişiniz için teşekkürler. İkinci randevunuzda %15 indirim: [Link] ✨`,
      email: `Merhaba [İsim],\n\n${businessName}'e hoş geldiniz! İlk deneyiminizin harika geçmesini diliyoruz.\n\nİkinci ziyaretinize özel %15 indirim hesabınıza tanımlandı.\n\nRandevu: [Link]\n\n${businessName}`
    },
    all: {
      sms: `Harika haberler [İsim]! ${businessName}'de yenilikler var. Keşfetmek için: [Link] 🚀`,
      email: `Değerli [İsim],\n\n${businessName} durmadan yenileniyor! En iyi hizmeti sunabilmek için çalışmaya devam ediyoruz.\n\nYeni randevu için: [Link]\n\n${businessName}`
    }
  }

  const segmentTemplates = templates[segment] || templates.all
  return {
    content: segmentTemplates[type] || segmentTemplates.sms,
    explanation: `"${SEGMENT_LABELS[segment] || segment}" segmenti için ${type === 'sms' ? 'SMS' : 'e-posta'} şablonu oluşturuldu.`
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { segment, type } = await req.json()

    if (!segment || !type) {
      return NextResponse.json({ error: 'Segment ve tip gereklidir' }, { status: 400 })
    }

    const profile = await db.businessProfile.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    const businessName = profile?.businessName || 'İşletmemiz'
    const result = await generateWithGemini(businessName, segment, type as 'sms' | 'email')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Campaign generation error:', error)
    return NextResponse.json({ error: 'İçerik üretilemedi' }, { status: 500 })
  }
}
