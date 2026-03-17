'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
  createdAt: string
  _count: {
    users: number
    bookings: number
    customers: number
  }
}

interface Stats {
  totalTenants: number
  activeTenants: number
  totalBookings: number
  totalCustomers: number
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tenantsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/tenants?filter=${filter}`),
        fetch('/api/admin/stats')
      ])
      const tenantsData = await tenantsRes.json()
      const statsData = await statsRes.json()
      setTenants(tenantsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error updating tenant:', error)
    }
  }

  const statusLabels: Record<string, string> = {
    active: 'Aktif',
    trial: 'Deneme',
    paused: 'Paused',
    cancelled: 'İptal',
    past_due: 'Ödeme Bekleniyor'
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    past_due: 'bg-orange-100 text-orange-800'
  }

  if (loading) return <div className="text-center py-20">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Toplam İşletme</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTenants}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Aktif İşletme</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeTenants}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Toplam Randevu</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Toplam Müşteri</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalCustomers}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="trial">Deneme</option>
          <option value="paused">Paused</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kayıt Tarihi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Randevu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                  İşletme bulunamadı
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{tenant.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[tenant.status]}`}>
                      {statusLabels[tenant.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{tenant._count.users}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{tenant._count.bookings}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{tenant._count.customers}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={tenant.status}
                      onChange={(e) => updateTenantStatus(tenant.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="active">Aktif</option>
                      <option value="trial">Deneme</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">İptal</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
