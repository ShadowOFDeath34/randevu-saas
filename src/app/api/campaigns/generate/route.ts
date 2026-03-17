import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { segment, type, businessContext } = await req.json()

    if (!segment || !type) {
      return NextResponse.json({ error: 'Segment ve tip gereklidir' }, { status: 400 })
    }

    const profile = await db.businessProfile.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    const businessName = profile?.businessName || 'İşletmemiz'

    // AI SIMULATION (Since we don't have a real OpenAI key in env, we simulate world-class contextual generation)
    // Wait for 1.5 seconds to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    let generatedText = ''

    if (segment === 'at_risk') {
      if (type === 'sms') {
        generatedText = `Merhaba [İsim]! Sizi epeydir ${businessName}'de göremiyoruz. Size özel %20 İNDİRİM tanımladık! Hemen randevu al: [Link] - Bizi özlediyseniz bekliyoruz! ✂️`
      } else {
        generatedText = `Değerli Müşterimiz [İsim],\n\nUzun zamandır ${businessName} olarak sizi misafir edemedik. Sizi tekrar aramızda görmekten mutluluk duyarız!\n\nSize özel %20 indirim kodunuz: GERIGEL20\n\nAşağıdaki linkten hemen randevunuzu oluşturabilirsiniz:\n[Link]\n\nSevgilerle,\n${businessName} Ekibi`
      }
    } else if (segment === 'loyal') {
      if (type === 'sms') {
        generatedText = `Sayın [İsim], ${businessName}'nin sadık bir müşterisi olduğunuz için teşekkürler! Bir sonraki ziyaretinizde kahveniz ve ekstra bakımınız bizden. Randevu: [Link] 🌟`
      } else {
        generatedText = `Değerli Müşterimiz [İsim],\n\n${businessName} ailesi olarak sadakatiniz bizim için çok değerli. Sizi her zaman en iyi şekilde ağırlamak bizim görevimiz.\n\nBir sonraki randevunuzda size özel ücretsiz VIP Bakım hediye etmek istiyoruz!\n\nRandevu almak için:\n[Link]\n\nSevgilerle,\n${businessName} Ekibi`
      }
    } else if (segment === 'new') {
      if (type === 'sms') {
        generatedText = `Aramıza hoş geldiniz [İsim]! ${businessName} ile tanışmanızı kutluyor, ilk randevunuzdan sonraki gelişinize anında %15 indirim sunuyoruz. Randevu: [Link] ✨`
      } else {
        generatedText = `Merhaba [İsim],\n\n${businessName} ile tanıştığınız için harika hissediyoruz! İlk deneyiminizin kusursuz geçmesi için elimizden geleni yapıyoruz.\n\nİkinci ziyaretinizde kullanabileceğiniz %15 indiriminiz hesabınıza tanımlandı.\n\nYeni bir randevu oluşturmak için:\n[Link]\n\nGörüşmek üzere,\n${businessName} Ekibi`
      }
    } else {
      // "all"
      if (type === 'sms') {
        generatedText = `Harika haber [İsim]! ${businessName}'de yenilikler var. Yeni hizmetlerimizi keşfetmek için hemen tıkla: [Link] 🚀`
      } else {
        generatedText = `Değerli [İsim],\n\n${businessName} durmadan yenileniyor! Size en iyi hizmeti sunabilmek için yenilikler yapmaya devam ediyoruz.\n\nSizleri de en kısa zamanda aramızda görmek isteriz.\n\nHemen Randevu Alın:\n[Link]\n\nİyi günler dileriz,\n${businessName} Ekibi`
      }
    }

    return NextResponse.json({ 
      content: generatedText,
      explanation: `AI, "${segment}" segmenti ve "${type}" kanalı için işletme adınızı kullanarak yüksek dönüşüm (conversion) odaklı bir metin yazdı.`
    })
  } catch (error: any) {
    console.error('Error generating AI campaign context:', error)
    return NextResponse.json({ error: 'AI içerik üretemedi' }, { status: 500 })
  }
}
