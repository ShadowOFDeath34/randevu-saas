import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageTransition } from '@/components/page-transition'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Scissors,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Clock,
  CalendarOff,
  Zap,
  Bell,
  Palette,
  ExternalLink,
  Briefcase,
  CreditCard,
  Sparkles
} from 'lucide-react'
import { db } from '@/lib/db'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const businessProfile = await db.businessProfile.findUnique({
    where: { tenantId: session.user.tenantId }
  })

  const navSections = [
    {
      title: 'Genel',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/bookings/quick', icon: Zap, label: 'Hızlı Randevu' },
        { href: '/calendar', icon: Calendar, label: 'Takvim' },
        { href: '/bookings', icon: ClipboardList, label: 'Randevular' },
        { href: '/analytics', icon: BarChart3, label: 'İstatistikler' },
      ]
    },
    { 
      title: 'İşletme', 
      items: [
        { href: '/customers', icon: Users, label: 'Müşteriler' },
        { href: '/staff', icon: Briefcase, label: 'Personel' },
        { href: '/services', icon: Scissors, label: 'Hizmetler' },
        { href: '/staff/schedule', icon: Clock, label: 'Çizelge' },
      ]
    },
    {
      title: 'Pazarlama (Yapay Zeka)',
      items: [
        { href: '/campaigns', icon: Sparkles, label: 'Akıllı Kampanyalar' },
      ]
    },
    { 
      title: 'Ayarlar', 
      items: [
        { href: '/settings/profile', icon: Settings, label: 'İşletme Profili' },
        { href: '/settings/billing', icon: CreditCard, label: 'Abonelik' },
        { href: '/settings/notifications', icon: Bell, label: 'Bildirimler' },
        { href: '/settings/theme', icon: Palette, label: 'Tema' },
        { href: '/settings/closed-dates', icon: CalendarOff, label: 'Tatil Günleri' },
        ...(session.user.role === 'super_admin' ? [{ href: '/admin', icon: Shield, label: 'Admin Panel' }] : [])
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-neutral-200/60 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="inline-flex items-center gap-1 text-xl font-bold">
                <span className="text-gradient">Randevu</span>
                <span className="text-neutral-900">AI</span>
              </Link>
              {businessProfile?.businessName && (
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-neutral-300" />
                  <span className="text-sm text-neutral-500 font-medium">
                    {businessProfile.businessName}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href={`/b/${session.user.tenantSlug}`} 
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50"
              >
                Randevu Sayfası
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              
              <form action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}>
                <button 
                  type="submit" 
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16 flex">
        {/* ── Sidebar ── */}
        <aside className="w-64 bg-white border-r border-neutral-200/60 min-h-screen fixed left-0 top-16 bottom-0 hidden md:block overflow-y-auto">
          <nav className="p-3 space-y-6 pb-8">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-all duration-200"
                    >
                      <item.icon className="w-4.5 h-4.5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
