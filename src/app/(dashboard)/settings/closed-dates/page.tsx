'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react'

interface ClosedDate {
  id: string
  date: string
  reason: string
}

export default function ClosedDatesPage() {
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ date: '', reason: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClosedDates()
  }, [])

  const fetchClosedDates = async () => {
    try {
      const res = await fetch('/api/settings/closed-dates')
      const data = await res.json()
      setClosedDates(data)
    } catch (error) {
      console.error('Error fetching closed dates:', error)
    } finally {
      setLoading(false)
    }
  }

  const addClosedDate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/settings/closed-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchClosedDates()
        setShowModal(false)
        setFormData({ date: '', reason: '' })
      }
    } catch (error) {
      console.error('Error adding closed date:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteClosedDate = async (id: string) => {
    if (!confirm('Bu tatil gününü silmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch(`/api/settings/closed-dates/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchClosedDates()
      }
    } catch (error) {
      console.error('Error deleting closed date:', error)
    }
  }

  if (loading) return <div className="text-center py-20">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tatil Günleri</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Tatil Ekle
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {closedDates.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                  Tatil günü bulunmuyor
                </td>
              </tr>
            ) : (
              closedDates.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(item.date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.reason || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteClosedDate(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tatil Günü Ekle</h2>
            <form onSubmit={addClosedDate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Örn: Resmi Tatil, Bayram..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
