import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageTransition } from '@/components/page-transition'
import { DashboardHeader } from '@/components/dashboard-header'
import { NotificationProvider } from '@/components/notification-provider'
import { Toaster } from '@/components/toaster'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Scissors,
  Users,
  Shield,
  BarChart3,
  Clock,
  CalendarOff,
  Zap,
  Bell,
  Palette,
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
        { href: '/settings/profile', icon: Palette, label: 'İşletme Profili' },
        { href: '/settings/billing', icon: CreditCard, label: 'Abonelik' },
        { href: '/settings/notifications', icon: Bell, label: 'Bildirimler' },
        { href: '/settings/theme', icon: Palette, label: 'Tema' },
        { href: '/settings/closed-dates', icon: CalendarOff, label: 'Tatil Günleri' },
        ...(session.user.role === 'super_admin' ? [{ href: '/admin', icon: Shield, label: 'Admin Panel' }] : [])
      ]
    }
  ]

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-surface-1">
        {/* ── Top Bar ── */}
        <DashboardHeader
          businessName={businessProfile?.businessName}
          tenantSlug={session.user.tenantSlug}
          userRole={session.user.role}
        />

        <div className="pt-16 flex">
          {/* ── Sidebar ── */}
          <aside className="w-64 bg-background border-r border-surface-3 min-h-screen fixed left-0 top-16 bottom-0 hidden md:block overflow-y-auto">
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
                        className="group flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 rounded-xl hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                      >
                        <item.icon className="w-4.5 h-4.5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
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

        <Toaster />
      </div>
    </NotificationProvider>
  )
}
