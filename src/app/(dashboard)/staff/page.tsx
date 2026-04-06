'use client'

import { useState } from 'react'
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from '@/hooks/use-staff'
import { useServices } from '@/hooks/use-services'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface StaffView {
  id: string
  fullName: string
  title: string | null
  phone: string | null
  email: string | null
  bio: string | null
  isActive: boolean
  services: { serviceId: string }[]
}

export default function StaffPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffView | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    phone: '',
    email: '',
    bio: '',
    isActive: true,
    serviceIds: [] as string[]
  })

  const { data: staff = [], isLoading: isStaffLoading, error: staffError } = useStaff()
  const { data: services = [], isLoading: isServicesLoading } = useServices()
  const createMutation = useCreateStaff()
  const updateMutation = useUpdateStaff()
  const deleteMutation = useDeleteStaff()

  const isLoading = isStaffLoading || isServicesLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      fullName: formData.fullName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
    }

    if (editingStaff) {
      updateMutation.mutate(
        { id: editingStaff.id, data },
        { onSuccess: () => closeModal() }
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => closeModal() })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return
    deleteMutation.mutate(id)
  }

  const openModal = (member?: StaffView) => {
    if (member) {
      setEditingStaff(member)
      setFormData({
        fullName: member.fullName,
        title: member.title || '',
        phone: member.phone || '',
        email: member.email || '',
        bio: member.bio || '',
        isActive: member.isActive,
        serviceIds: member.services?.map(s => s.serviceId) || []
      })
    } else {
      setEditingStaff(null)
      setFormData({ fullName: '', title: '', phone: '', email: '', bio: '', isActive: true, serviceIds: [] })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingStaff(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (staffError) {
    return (
      <div className="text-center py-10 text-red-600">
        Personeller yüklenirken hata oluştu. Lütfen sayfayı yenileyin.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Personel</h1>
        <Button onClick={() => openModal()}>
          + Yeni Personel
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(staff as unknown as StaffView[]).length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            Henüz personel eklenmemiş
          </div>
        ) : (
          (staff as unknown as StaffView[]).map((member) => (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{member.fullName}</h3>
                  {member.title && <p className="text-sm text-gray-500">{member.title}</p>}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openModal(member)}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={deleteMutation.isPending}
                  className="text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingStaff ? 'Personel Düzenle' : 'Yeni Personel'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Berber, Kuaför..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Biyografi</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verdiği Hizmetler</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {services.map(service => (
                      <label key={service.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.serviceIds.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, serviceIds: [...formData.serviceIds, service.id] })
                            } else {
                              setFormData({ ...formData, serviceIds: formData.serviceIds.filter(id => id !== service.id) })
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Aktif</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  {editingStaff ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
