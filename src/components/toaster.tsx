'use client'

import { useToast } from '@/hooks/use-toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-lg shadow-lg border max-w-sm animate-slide-up ${
            t.variant === 'destructive'
              ? 'bg-danger/10 border-danger/20 text-danger'
              : t.variant === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-background border-surface-3 text-foreground'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-sm">{t.title}</p>
              {t.description && (
                <p className="text-sm text-neutral-500 mt-1">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-neutral-400 hover:text-foreground transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
