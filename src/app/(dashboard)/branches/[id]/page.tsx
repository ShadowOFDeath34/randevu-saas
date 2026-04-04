'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Edit2,
  Save,
  X,
  TrendingUp,
  Briefcase,
  Scissors,
  Store
} from 'lucide-react'

interface Branch {
  id: string
  name: string
  code: string | null
  type: 'main' | 'satellite' | 'mobile' | 'franchise'
  status: 'active' | 'inactive' | 'maintenance'
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  hasOnlineBooking: boolean
  customHours: boolean
  businessHours: BusinessHour[]
  services: BranchService[]
  staff: Staff[]
  _count: {
    staff: number
    bookings: number
  }
}

interface BusinessHour {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

interface BranchService {
  service: {
    id: string
    name: string
    durationMinutes: number
    price: number
  }
  isAvailable: boolean
  customPrice: number | null
  customDurationMinutes: number | null
}

interface Staff {
  id: string
  fullName: string
  title: string | null
  avatarUrl: string | null
  isActive: boolean
}

const TYPE_LABELS: Record<string, string> = {
  main: 'Ana Şube',
  satellite: 'Yan Şube',
  mobile: 'Mobil',
  franchise: 'Franchise'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: 'bg-green-500' },
  inactive: { label: 'Pasif', color: 'bg-gray-500' },
  maintenance: { label: 'Bakımda', color: 'bg-yellow-500' }
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function BranchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const branchId = params.id as string

  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: ''
  })

  useEffect(() => {
    fetchBranch()
  }, [branchId])

  const fetchBranch = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/branches/${branchId}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setBranch(data)
      setEditForm({
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        district: data.district || ''
      })
    } catch (error) {
      console.error('Error fetching branch:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveChanges = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        await fetchBranch()
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving branch:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleOnlineBooking = async () => {
    if (!branch) return

    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasOnlineBooking: !branch.hasOnlineBooking })
      })

      if (response.ok) {
        await fetchBranch()
      }
    } catch (error) {
      console.error('Error toggling online booking:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="p-6 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Şube bulunamadı</p>
            <Button onClick={() => router.push('/branches')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Şubelere Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/branches')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{branch.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={STATUS_LABELS[branch.status].color}>
                {STATUS_LABELS[branch.status].label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {TYPE_LABELS[branch.type]}
              </span>
              {branch.code && (
                <span className="text-sm text-muted-foreground">
                  Kod: {branch.code}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
              <Button onClick={saveChanges} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="hours">Çalışma Saatleri</TabsTrigger>
          <TabsTrigger value="services">Hizmetler</TabsTrigger>
          <TabsTrigger value="staff">Personel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  İletişim Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Şube Adı</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Şehir</Label>
                        <Input
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>İlçe</Label>
                        <Input
                          value={editForm.district}
                          onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Adres</Label>
                      <Input
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-posta</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{branch.address || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{branch.city}{branch.district ? `, ${branch.district}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{branch.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{branch.email || '-'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  İstatistikler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{branch._count.staff}</p>
                    <p className="text-sm text-muted-foreground">Personel</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{branch._count.bookings}</p>
                    <p className="text-sm text-muted-foreground">Randevu</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{branch.services.length}</p>
                    <p className="text-sm text-muted-foreground">Hizmet</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {branch.hasOnlineBooking ? 'Aktif' : 'Pasif'}
                    </p>
                    <p className="text-sm text-muted-foreground">Online Rezervasyon</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Online Rezervasyon</p>
                      <p className="text-sm text-muted-foreground">
                        Müşteriler bu şubeden randevu alabilir
                      </p>
                    </div>
                    <Switch
                      checked={branch.hasOnlineBooking}
                      onCheckedChange={toggleOnlineBooking}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Çalışma Saatleri
              </CardTitle>
              <CardDescription>
                Şubenin haftalık çalışma saatleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS.map((day, index) => {
                  const hour = branch?.businessHours?.find(h => h.dayOfWeek === index + 1)
                  return (
                    <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium w-32">{day}</span>
                      {hour?.isClosed ? (
                        <Badge variant="secondary">Kapalı</Badge>
                      ) : hour?.openTime && hour?.closeTime ? (
                        <span className="text-muted-foreground">
                          {hour.openTime} - {hour.closeTime}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Hizmetler
              </CardTitle>
              <CardDescription>
                Bu şubede sunulan hizmetler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {branch.services.map((svc) => (
                  <div
                    key={svc.service.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{svc.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {svc.service.durationMinutes} dk
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ₺{svc.customPrice || svc.service.price}
                      </p>
                      <Badge variant={svc.isAvailable ? 'default' : 'secondary'}>
                        {svc.isAvailable ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Personel
              </CardTitle>
              <CardDescription>
                Bu şubede çalışan personeller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {branch.staff.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-4 border rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {person.avatarUrl ? (
                        <img src={person.avatarUrl} alt={person.fullName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <Users className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{person.fullName}</p>
                      <p className="text-sm text-muted-foreground">{person.title || 'Personel'}</p>
                    </div>
                    <Badge variant={person.isActive ? 'default' : 'secondary'}>
                      {person.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
