import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AIChatFull } from '@/components/ai-chat-full'

export default async function ChatPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  // Get tenant slug from user's tenant
  let tenantSlug = 'demo'
  if (session.user.tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true }
    })
    if (tenant) {
      tenantSlug = tenant.slug
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Asistan</h1>
              <p className="text-muted-foreground">24/7 size yardımcı olmaya hazır</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
            <AIChatFull tenantSlug={tenantSlug} customerId={session.user.id} />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Randevu Alın</h3>
            <p className="text-xs text-muted-foreground">Hızlıca randevu oluşturun</p>
          </div>

          <div className="bg-white p-4 rounded-xl border text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Hizmet Bilgisi</h3>
            <p className="text-xs text-muted-foreground">Tüm hizmetler hakkında bilgi</p>
          </div>

          <div className="bg-white p-4 rounded-xl border text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 9v4m0 0H9m3 0h3" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Destek</h3>
            <p className="text-xs text-muted-foreground">Sorularınıza anında yanıt</p>
          </div>
        </div>
      </div>
    </div>
  )
}
