'use client'

import { useState } from 'react'
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react'
import { useNotifications } from './notification-provider'
import Link from 'next/link'

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected
  } = useNotifications()

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await markAsRead(id)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteNotification(id)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Şimdi'
    if (minutes < 60) return `${minutes} dk önce`
    if (hours < 24) return `${hours} saat önce`
    if (days < 7) return `${days} gün önce`
    return date.toLocaleDateString('tr-TR')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-500 hover:text-foreground hover:bg-surface-2 rounded-lg transition-all duration-200"
        title="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-warning rounded-full" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-background border border-surface-3 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-3">
              <h3 className="font-semibold text-sm">Bildirimler</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Tümünü okundu işaretle
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  Henüz bildirim yok
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-surface-3 last:border-0 hover:bg-surface-1 transition-colors ${
                      !notification.read ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-neutral-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
                              onClick={() => setIsOpen(false)}
                            >
                              Git
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="Okundu olarak işaretle"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-surface-3 bg-surface-1">
              <Link
                href="/settings/notifications"
                className="text-xs text-neutral-500 hover:text-foreground flex items-center justify-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                Tüm bildirimleri gör
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
