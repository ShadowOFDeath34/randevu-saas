import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import BookingForm from './booking-form'
import ChatWidget from '@/components/chat-widget'
import { MapPin, Phone, Clock } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params

  const tenant = await db.tenant.findUnique({
    where: { slug },
    include: {
      businessProfile: true,
      businessHours: true,
      services: {
        where: { isActive: true },
        orderBy: { name: 'asc' }
      },
      staff: {
        where: { isActive: true },
        orderBy: { fullName: 'asc' }
      }
    }
  })

  if (!tenant || !tenant.businessProfile) {
    notFound()
  }

  const today = new Date()
  const dates: string[] = []
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }

  const profile = tenant.businessProfile

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Premium Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.06]" />
        
        {/* Floating Orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-4 sm:gap-5">
            {profile.logoUrl ? (
              <img 
                src={profile.logoUrl} 
                alt={profile.businessName} 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-lg" 
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
                <span className="text-white text-2xl font-bold">
                  {profile.businessName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{profile.businessName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {profile.address && (
                  <span className="inline-flex items-center gap-1.5 text-primary-200/70 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.address}
                  </span>
                )}
                {profile.phone && (
                  <span className="inline-flex items-center gap-1.5 text-primary-200/70 text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 -mt-4 relative z-20 pb-12">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Online Randevu Al</h2>
          </div>
          <BookingForm 
            tenant={tenant}
            services={tenant.services}
            staff={tenant.staff}
            dates={dates}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-6 text-center">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} {profile.businessName} · Powered by{' '}
          <span className="text-gradient font-semibold">RandevuAI</span>
        </p>
      </footer>

      <ChatWidget tenantSlug={slug} />
    </div>
  )
}
