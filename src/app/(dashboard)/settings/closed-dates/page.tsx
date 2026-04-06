'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useClosedDates, useAddClosedDate, useDeleteClosedDate } from '@/hooks/use-settings'
import { Skeleton } from '@/components/ui/skeleton'

interface ClosedDate {
  id: string
  date: string
  reason: string
}

export default function ClosedDatesPage() {
  const { data: closedDates = [], isLoading } = useClosedDates()
  const addClosedDate = useAddClosedDate()
  const deleteClosedDate = useDeleteClosedDate()

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ date: '', reason: '' })

  const addClosedDateHandler = async (e: React.FormEvent) => {
    e.preventDefault()
    await addClosedDate.mutateAsync(formData)
    setShowModal(false)
    setFormData({ date: '', reason: '' })
  }

  const deleteClosedDateHandler = async (id: string) => {
    if (!confirm('Bu tatil gününü silmek istediğinize emin misiniz?')) return
    await deleteClosedDate.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
              closedDates.map((item: ClosedDate) => (
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
                      onClick={() => deleteClosedDateHandler(item.id)}
                      disabled={deleteClosedDate.isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tatil Günü Ekle</h2>
            <form onSubmit={addClosedDateHandler} className="space-y-4">
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
                  disabled={addClosedDate.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addClosedDate.isPending ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
