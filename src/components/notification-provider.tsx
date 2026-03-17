'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  actionUrl?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  isConnected: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Connect to SSE endpoint
  useEffect(() => {
    let eventSource: EventSource | null = null

    const connect = () => {
      eventSource = new EventSource('/api/notifications/stream')

      eventSource.onopen = () => {
        setIsConnected(true)
        console.log('Notifications: Connected to SSE')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'initial') {
            setNotifications(data.notifications)
          } else if (data.type === 'new') {
            setNotifications(prev => [data.notification, ...prev])

            // Show toast for new notification
            toast({
              title: data.notification.title,
              description: data.notification.message,
              variant: data.notification.type === 'error' ? 'destructive' : 'default',
            })
          } else if (data.type === 'update') {
            setNotifications(prev =>
              prev.map(n => n.id === data.notification.id ? data.notification : n)
            )
          } else if (data.type === 'delete') {
            setNotifications(prev => prev.filter(n => n.id !== data.id))
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        console.log('Notifications: Disconnected from SSE')
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSource?.readyState === EventSource.CLOSED) {
            connect()
          }
        }, 5000)
      }
    }

    connect()

    return () => {
      eventSource?.close()
    }
  }, [toast])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
