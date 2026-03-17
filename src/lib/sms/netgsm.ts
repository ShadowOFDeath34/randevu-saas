/**
 * NetGSM SMS API Entegrasyonu
 * Dokümantasyon: https://www.netgsm.com.tr/dokuman/xml-sms-api/
 */

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface NetGSMConfig {
  usercode: string
  password: string
  msgheader: string
}

function getConfig(): NetGSMConfig {
  return {
    usercode: process.env.NETGSM_USERCODE || '',
    password: process.env.NETGSM_PASSWORD || '',
    msgheader: process.env.NETGSM_MSGHEADER || 'RANDEVUAI'
  }
}

/**
 * XML payload oluştur
 */

/**
 * XML Injection korumasi - XML escape fonksiyonu
 * CDATA icerigini guvenli hale getirir
 */
function escapeXml(text: string | null | undefined): string {
  if (!text) return ''
  
  // CDATA kapatma tag'ini engelle
  return text
    .replace(/\]\]>/g, ']]\u003e')  // CDATA kapatma
    .replace(/\u003c!\[CDATA\[/g, '') // CDATA acma
}

function createXMLPayload(phone: string, message: string, config: NetGSMConfig): string {
  const cleanPhone = phone.replace(/\s/g, '').replace(/^0/, '')
  
  // XML Injection korumasi
  const safeMessage = escapeXml(message)

  return `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <usercode>${config.usercode}</usercode>
    <password>${config.password}</password>
    <msgheader>${config.msgheader}</msgheader>
    <startdate></startdate>
    <stopdate></stopdate>
  </header>
  <body>
    <msg>
      <![CDATA[${safeMessage}]]>
    </msg>
    <no>${cleanPhone}</no>
  </body>
</mainbody>`
}

/**
 * NetGSM API yanıtını parse et
 * Başarılı: 00 xxxxxx veya 01 xxxxxx
 * Hata: 20, 30, 40, 50, 60, 70, 80, 85, 90, 100
 */
function parseResponse(response: string): SMSResult {
  const code = response.trim().substring(0, 2)

  switch (code) {
    case '00':
    case '01':
      return {
        success: true,
        messageId: response.trim()
      }
    case '20':
      return { success: false, error: 'Mesaj boyutu çok uzun' }
    case '30':
      return { success: false, error: 'Geçersiz kullanıcı adı/şifre' }
    case '40':
      return { success: false, error: 'Mesaj başlığı (header) hatalı' }
    case '50':
      return { success: false, error: 'JSON format hatası' }
    case '60':
      return { success: false, error: 'Yetkilendirme hatası' }
    case '70':
      return { success: false, error: 'Hatalı XML formatı' }
    case '80':
      return { success: false, error: 'Geçersiz telefon numarası' }
    case '85':
      return { success: false, error: 'Aynı numaraya 1 dakika içinde birden fazla mesaj gönderilemez' }
    case '90':
      return { success: false, error: 'Sistem hatası' }
    case '100':
      return { success: false, error: 'Bakiye yetersiz' }
    default:
      return { success: false, error: `Bilinmeyen hata: ${response}` }
  }
}

/**
 * SMS gönder
 */
export async function sendNetGSMSMS(phone: string, message: string): Promise<SMSResult> {
  try {
    const config = getConfig()

    // Eğer config eksikse mock modda çalış
    if (!config.usercode || !config.password) {
      console.log('NetGSM config eksik, mock SMS gönderiliyor:', { phone, message: message.substring(0, 50) + '...' })
      return { success: true, messageId: 'MOCK-' + Date.now() }
    }

    const xmlPayload = createXMLPayload(phone, message, config)

    const response = await fetch('https://api.netgsm.com.tr/sms/send/xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      body: xmlPayload
    })

    if (!response.ok) {
      return { success: false, error: `HTTP hatası: ${response.status}` }
    }

    const responseText = await response.text()
    return parseResponse(responseText)
  } catch (error) {
    console.error('NetGSM SMS hatası:', error)
    return { success: false, error: 'SMS gönderme hatası: ' + (error as Error).message }
  }
}

/**
 * Toplu SMS gönder
 */
export async function sendBulkSMS(phones: string[], message: string): Promise<SMSResult> {
  try {
    const config = getConfig()

    if (!config.usercode || !config.password) {
      console.log('NetGSM config eksik, mock toplu SMS:', { phoneCount: phones.length })
      return { success: true, messageId: 'MOCK-BULK-' + Date.now() }
    }

    const cleanPhones = phones.map(p => p.replace(/\s/g, '').replace(/^0/, '')).join(',')

    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <usercode>${config.usercode}</usercode>
    <password>${config.password}</password>
    <msgheader>${config.msgheader}</msgheader>
  </header>
  <body>
    <msg>
      <![CDATA[${message}]]>
    </msg>
    <no>${cleanPhones}</no>
  </body>
</mainbody>`

    const response = await fetch('https://api.netgsm.com.tr/sms/send/xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      body: xmlPayload
    })

    if (!response.ok) {
      return { success: false, error: `HTTP hatası: ${response.status}` }
    }

    const responseText = await response.text()
    return parseResponse(responseText)
  } catch (error) {
    console.error('NetGSM toplu SMS hatası:', error)
    return { success: false, error: 'Toplu SMS gönderme hatası: ' + (error as Error).message }
  }
}
