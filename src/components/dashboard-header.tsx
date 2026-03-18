'use client'

import Link from 'next/link'
import { LogOut, ExternalLink } from 'lucide-react'
import { ThemeToggleSimple } from './theme-toggle'
import { NotificationDropdown } from './notification-dropdown'
import { signOut } from 'next-auth/react'

interface DashboardHeaderProps {
  businessName?: string | null
  tenantSlug?: string | null
  userRole?: string
}

export function DashboardHeader({
  businessName,
  tenantSlug
}: DashboardHeaderProps) {

  return (
    <header className="bg-background/80 backdrop-blur-lg border-b border-surface-3 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-xl font-bold">
              <span className="text-gradient">Randevu</span>
              <span className="text-foreground">AI</span>
            </Link>
            {businessName && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-neutral-400" />
                <span className="text-sm text-neutral-500 font-medium">
                  {businessName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {tenantSlug && (
              <Link
                href={`/b/${tenantSlug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-500/10"
              >
                Randevu Sayfası
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Notifications */}
            <NotificationDropdown />

            {/* Theme Toggle */}
            <ThemeToggleSimple />

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
