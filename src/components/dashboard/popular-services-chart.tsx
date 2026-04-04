'use client'

import { Scissors } from 'lucide-react'

interface Service {
  id: string
  name: string
  _count: { bookings: number }
}

export function PopularServicesChart({ services }: { services: Service[] }) {
  const totalBookings = services.reduce((sum, s) => sum + s._count.bookings, 0)
  const maxBookings = Math.max(...services.map(s => s._count.bookings), 1)

  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-violet-500',
    'bg-rose-500'
  ]

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-blue-500" />
            Popüler Hizmetler
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">Bu ay</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-blue-600">{totalBookings}</p>
          <p className="text-xs text-neutral-400">Randevu</p>
        </div>
      </div>

      <div className="space-y-3">
        {services.length === 0 ? (
          <div className="text-center text-neutral-400 text-sm py-8">Henüz veri yok</div>
        ) : (
          services.map((service, index) => (
            <div key={service.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-900 truncate">{service.name}</span>
                  <span className="text-xs text-neutral-500">{service._count.bookings}</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                    style={{ width: `${(service._count.bookings / maxBookings) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
