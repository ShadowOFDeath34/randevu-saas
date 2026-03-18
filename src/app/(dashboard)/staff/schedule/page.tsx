'use client'

import { useState, useEffect } from 'react'
import { useStaff } from '@/hooks/use-staff'
import { Skeleton } from '@/components/ui/skeleton'

interface WorkingHour {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

interface StaffWithHours {
  id: string
  name: string
  workingHours: WorkingHour[]
}

export default function StaffSchedulePage() {
  const { data: staff = [], isLoading } = useStaff()
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [hours, setHours] = useState<WorkingHour[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Cast staff to include workingHours (API returns this but hook type doesn't include it)
  const staffWithHours = staff as unknown as StaffWithHours[]

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  useEffect(() => {
    if (staff.length > 0 && !selectedStaff) {
      setSelectedStaff(staff[0].id)
    }
  }, [staff, selectedStaff])

  useEffect(() => {
    if (selectedStaff) {
      const member = staffWithHours.find((s: StaffWithHours) => s.id === selectedStaff)
      if (member) {
        setHours(member.workingHours)
      }
    }
  }, [selectedStaff, staffWithHours])

  const updateHours = (dayOfWeek: number, field: keyof WorkingHour, value: string | boolean | null) => {
    setHours(prev => prev.map(h =>
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    ))
  }

  const saveHours = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/staff/${selectedStaff}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours)
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving hours:', error)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Personel Çizelgesi</h1>
        {saved && <span className="text-green-600 font-medium">Kaydedildi!</span>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Personel Seçin</label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg"
          >
            {staffWithHours.map((s: StaffWithHours) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {hours.map((hour) => (
            <div key={hour.dayOfWeek} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="w-28 font-medium text-gray-700">
                {dayNames[hour.dayOfWeek]}
              </div>

              <div className="flex items-center gap-4 flex-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hour.isClosed}
                    onChange={(e) => updateHours(hour.dayOfWeek, 'isClosed', !e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-600">
                    {hour.isClosed ? 'Kapalı' : 'Açık'}
                  </span>
                </label>

                {!hour.isClosed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hour.openTime || '09:00'}
                      onChange={(e) => updateHours(hour.dayOfWeek, 'openTime', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="time"
                      value={hour.closeTime || '18:00'}
                      onChange={(e) => updateHours(hour.dayOfWeek, 'closeTime', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveHours}
          disabled={saving}
          className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
